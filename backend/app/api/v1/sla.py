from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.db.session import get_db
from backend.app.models.all_models import (
    SLAPolicy,
    Ticket,
    SLATracking,
    SLARiskPrediction,
    User,
    utc_now
)
from backend.app.schemas.all_schemas import (
    SLAPolicyResponse,
    SLAPolicyCreate,
    SLARiskItem,
    MessageResponse
)
from backend.app.core.dependencies import (
    get_current_user,
    require_role,
    enforce_organization_isolation
)

router = APIRouter(prefix="/sla", tags=["SLA Management"])


@router.get("/policies", response_model=List[SLAPolicyResponse])
def list_sla_policies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SLAPolicy).filter(
        SLAPolicy.org_id == current_user.org_id,
        SLAPolicy.is_active == True
    ).all()


@router.post("/policies", response_model=SLAPolicyResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def create_or_update_policy(
    policy_in: SLAPolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(policy_in.org_id, current_user, db)

    # Check if policy for priority exists
    existing = db.query(SLAPolicy).filter(
        SLAPolicy.org_id == org_id,
        SLAPolicy.priority == policy_in.priority
    ).first()

    if existing:
        existing.name = policy_in.name
        existing.description = policy_in.description
        existing.response_time_hours = policy_in.response_time_hours
        existing.resolution_time_hours = policy_in.resolution_time_hours
        existing.business_hours_only = policy_in.business_hours_only
        existing.is_active = policy_in.is_active
        db.commit()
        db.refresh(existing)
        return existing

    policy = SLAPolicy(
        org_id=org_id,
        name=policy_in.name,
        description=policy_in.description,
        priority=policy_in.priority,
        response_time_hours=policy_in.response_time_hours,
        resolution_time_hours=policy_in.resolution_time_hours,
        business_hours_only=policy_in.business_hours_only,
        is_active=policy_in.is_active
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/risks", response_model=List[SLARiskItem])
def list_sla_risks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = utc_now()
    # Query all active tickets in organization
    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.org_id == current_user.org_id,
            Ticket.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING_CUSTOMER", "REOPENED"])
        )
        .order_by(Ticket.resolution_due_at.asc())
        .all()
    )

    risk_items: List[SLARiskItem] = []
    for t in tickets:
        time_rem = None
        if t.resolution_due_at:
            delta = t.resolution_due_at - now
            time_rem = round(delta.total_seconds() / 60.0, 1)

        # Check existing AI SLA risk prediction
        pred = (
            db.query(SLARiskPrediction)
            .filter(SLARiskPrediction.ticket_id == t.id)
            .order_by(desc(SLARiskPrediction.created_at))
            .first()
        )

        risk_score = pred.risk_score if pred else 0.3
        risk_level = pred.risk_level if pred else ("HIGH" if time_rem and time_rem < 120 else "LOW")
        risk_factors = pred.risk_factors if pred and pred.risk_factors else []
        mitigation = pred.suggested_mitigation if pred else "Monitor ticket progression"

        if time_rem is not None and time_rem <= 0:
            risk_level = "CRITICAL"
            risk_score = 1.0
            risk_factors.append("SLA deadline has already expired")
            mitigation = "Immediate escalation to Department Manager required."
        elif time_rem is not None and time_rem < 60:
            risk_level = "HIGH"
            risk_score = max(risk_score, 0.85)
            risk_factors.append("Less than 60 minutes remaining before resolution breach")

        risk_items.append(SLARiskItem(
            ticket_id=t.id,
            ticket_number=t.ticket_number,
            title=t.title,
            priority=t.priority,
            status=t.status,
            assigned_to_name=t.assignee.full_name if t.assignee else "Unassigned",
            resolution_due_at=t.resolution_due_at,
            time_remaining_minutes=time_rem,
            risk_score=round(risk_score, 2),
            risk_level=risk_level,
            risk_factors=risk_factors,
            suggested_mitigation=mitigation
        ))

    # Sort so most critical risks are first
    risk_items.sort(key=lambda x: x.risk_score, reverse=True)
    return risk_items
