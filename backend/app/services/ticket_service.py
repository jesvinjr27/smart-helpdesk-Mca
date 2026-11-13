from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc, asc
from fastapi import HTTPException, status

from backend.app.models.all_models import (
    Ticket,
    TicketAssignment,
    TicketComment,
    TicketEvent,
    SLAPolicy,
    SLATracking,
    Category,
    User,
    Organization,
    Team,
    Department,
    AIPrediction,
    SLARiskPrediction,
    utc_now
)
from backend.app.schemas.all_schemas import TicketCreate, TicketUpdate, TicketAssignRequest, TicketTransitionRequest
from backend.app.integrations.ai_service import ai_service

ALLOWED_TRANSITIONS = {
    "NEW": ["ASSIGNED", "IN_PROGRESS", "CLOSED"],
    "ASSIGNED": ["IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"],
    "IN_PROGRESS": ["PENDING_CUSTOMER", "RESOLVED", "CLOSED"],
    "PENDING_CUSTOMER": ["IN_PROGRESS", "RESOLVED", "CLOSED"],
    "RESOLVED": ["CLOSED", "REOPENED"],
    "CLOSED": ["REOPENED"],
    "REOPENED": ["ASSIGNED", "IN_PROGRESS", "CLOSED"]
}


def calculate_sla_deadlines(
    org_id: str,
    priority: str,
    created_at: datetime,
    db: Session
) -> Tuple[Optional[datetime], Optional[datetime], Optional[SLAPolicy]]:
    policy = db.query(SLAPolicy).filter(
        SLAPolicy.org_id == org_id,
        SLAPolicy.priority == priority,
        SLAPolicy.is_active == True
    ).first()
    
    if not policy:
        # Defaults if policy not explicitly defined
        default_resp = 4.0 if priority == "MEDIUM" else (1.0 if priority == "CRITICAL" else 8.0)
        default_res = 24.0 if priority == "MEDIUM" else (4.0 if priority == "CRITICAL" else 48.0)
        return (created_at + timedelta(hours=default_resp), created_at + timedelta(hours=default_res), None)
        
    response_due = created_at + timedelta(hours=policy.response_time_hours)
    resolution_due = created_at + timedelta(hours=policy.resolution_time_hours)
    return (response_due, resolution_due, policy)


def generate_ticket_number(org_id: str, db: Session) -> str:
    org = db.query(Organization).filter(Organization.id == org_id).first()
    code = org.code if org else "TK"
    
    count = db.query(Ticket).filter(Ticket.org_id == org_id).count()
    return f"{code}-TK-{1001 + count}"


class TicketService:
    @staticmethod
    def create_ticket(
        ticket_in: TicketCreate,
        current_user: User,
        db: Session,
        trigger_ai_analysis: bool = True
    ) -> Ticket:
        now = utc_now()
        ticket_num = generate_ticket_number(current_user.org_id, db)
        
        # Verify category belongs to user org
        category = db.query(Category).filter(
            Category.id == ticket_in.category_id,
            Category.org_id == current_user.org_id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected category not found in organization"
            )
            
        priority = ticket_in.priority or category.default_priority or "MEDIUM"
        resp_due, res_due, sla_policy = calculate_sla_deadlines(
            current_user.org_id, priority, now, db
        )
        
        ticket = Ticket(
            org_id=current_user.org_id,
            ticket_number=ticket_num,
            title=ticket_in.title,
            description=ticket_in.description,
            category_id=category.id,
            priority=priority,
            status="NEW",
            requester_id=current_user.id,
            department_id=ticket_in.department_id or category.default_department_id,
            assigned_team_id=category.default_team_id,
            response_due_at=resp_due,
            resolution_due_at=res_due,
            tags=ticket_in.tags or [],
            created_at=now,
            updated_at=now
        )
        db.add(ticket)
        db.flush()

        # Create Initial SLA Tracking Record
        sla_tracking = SLATracking(
            ticket_id=ticket.id,
            policy_id=sla_policy.id if sla_policy else None,
            response_deadline=resp_due,
            resolution_deadline=res_due
        )
        db.add(sla_tracking)

        # Log Ticket Creation Event
        event = TicketEvent(
            ticket_id=ticket.id,
            actor_id=current_user.id,
            event_type="CREATED",
            new_value="NEW",
            details={"priority": priority, "ticket_number": ticket_num}
        )
        db.add(event)

        # Trigger AI Analysis if requested
        if trigger_ai_analysis:
            categories_map = {
                c.name: c.id
                for c in db.query(Category).filter(Category.org_id == current_user.org_id).all()
            }
            ai_res = ai_service.predict_category_and_priority(
                ticket.title, ticket.description, categories_map
            )
            
            ai_pred = AIPrediction(
                ticket_id=ticket.id,
                model_name=ai_res["model_name"],
                model_version=ai_res["model_version"],
                predicted_category_id=ai_res["predicted_category_id"],
                predicted_priority=ai_res["predicted_priority"],
                confidence_scores=ai_res["confidence_scores"],
                rationale=ai_res["rationale"],
                execution_time_ms=ai_res["execution_time_ms"]
            )
            db.add(ai_pred)
            
            # Predict SLA Risk
            queue_count = db.query(Ticket).filter(
                Ticket.org_id == current_user.org_id,
                Ticket.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS"])
            ).count()
            
            sla_risk_res = ai_service.predict_sla_risk(
                priority=ticket.priority,
                category=category.name,
                created_hour=now.hour,
                is_weekend=1 if now.weekday() >= 5 else 0,
                initial_queue=queue_count,
                desc_length=len(ticket.description)
            )
            
            sla_risk = SLARiskPrediction(
                ticket_id=ticket.id,
                model_name=sla_risk_res["model_name"],
                risk_score=sla_risk_res["risk_score"],
                risk_level=sla_risk_res["risk_level"],
                risk_factors=sla_risk_res["risk_factors"],
                suggested_mitigation=sla_risk_res["suggested_mitigation"]
            )
            db.add(sla_risk)

        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def transition_ticket(
        ticket: Ticket,
        transition_in: TicketTransitionRequest,
        current_user: User,
        db: Session
    ) -> Ticket:
        now = utc_now()
        target_status = transition_in.status.upper()
        
        valid_next = ALLOWED_TRANSITIONS.get(ticket.status, [])
        if target_status not in valid_next:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition from '{ticket.status}' to '{target_status}'. Allowed transitions: {valid_next}"
            )
            
        old_status = ticket.status
        ticket.status = target_status
        ticket.updated_at = now
        
        # State transitions timestamps
        if target_status == "RESOLVED":
            ticket.resolved_at = now
        elif target_status == "CLOSED":
            ticket.closed_at = now
        elif target_status == "REOPENED":
            ticket.resolved_at = None
            ticket.closed_at = None
            
        # First response timestamp if agent moved from NEW/ASSIGNED to IN_PROGRESS
        if ticket.first_responded_at is None and target_status in ["IN_PROGRESS", "RESOLVED"]:
            ticket.first_responded_at = now

        # Record TicketEvent
        event = TicketEvent(
            ticket_id=ticket.id,
            actor_id=current_user.id,
            event_type="STATUS_CHANGED",
            old_value=old_status,
            new_value=target_status,
            details={"comment": transition_in.comment} if transition_in.comment else None
        )
        db.add(event)

        # If transition includes a comment, add it
        if transition_in.comment:
            comment = TicketComment(
                ticket_id=ticket.id,
                author_id=current_user.id,
                content=transition_in.comment,
                is_internal=transition_in.is_internal,
                created_at=now,
                updated_at=now
            )
            db.add(comment)

        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def assign_ticket(
        ticket: Ticket,
        assign_in: TicketAssignRequest,
        current_user: User,
        db: Session
    ) -> Ticket:
        now = utc_now()
        prev_assignee_id = ticket.assigned_to_id
        prev_team_id = ticket.assigned_team_id
        
        if assign_in.assigned_to_id:
            assignee = db.query(User).filter(
                User.id == assign_in.assigned_to_id,
                User.org_id == ticket.org_id
            ).first()
            if not assignee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned user not found in this organization"
                )
            ticket.assigned_to_id = assignee.id
            if ticket.status == "NEW":
                ticket.status = "ASSIGNED"
                
        if assign_in.assigned_team_id:
            team = db.query(Team).filter(
                Team.id == assign_in.assigned_team_id,
                Team.org_id == ticket.org_id
            ).first()
            if not team:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned team not found in this organization"
                )
            ticket.assigned_team_id = team.id

        ticket.updated_at = now

        # Record Assignment History
        assignment = TicketAssignment(
            ticket_id=ticket.id,
            assigned_by_id=current_user.id,
            previous_assignee_id=prev_assignee_id,
            new_assignee_id=ticket.assigned_to_id,
            previous_team_id=prev_team_id,
            new_team_id=ticket.assigned_team_id,
            reason=assign_in.reason,
            created_at=now
        )
        db.add(assignment)

        # Record TicketEvent
        event = TicketEvent(
            ticket_id=ticket.id,
            actor_id=current_user.id,
            event_type="ASSIGNED",
            old_value=str(prev_assignee_id) if prev_assignee_id else "Unassigned",
            new_value=str(ticket.assigned_to_id) if ticket.assigned_to_id else "Unassigned",
            details={"team_id": ticket.assigned_team_id, "reason": assign_in.reason}
        )
        db.add(event)

        db.commit()
        db.refresh(ticket)
        return ticket
