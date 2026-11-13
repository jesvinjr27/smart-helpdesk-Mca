from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.db.session import get_db
from backend.app.models.all_models import (
    Ticket,
    TicketComment,
    TicketEvent,
    AIPrediction,
    SLARiskPrediction,
    AIFeedback,
    Category,
    User,
    SLATracking,
    utc_now
)
from backend.app.schemas.all_schemas import (
    TicketCreate,
    TicketUpdate,
    TicketAssignRequest,
    TicketTransitionRequest,
    TicketBriefResponse,
    TicketDetailResponse,
    CommentCreate,
    CommentResponse,
    EventResponse,
    AIPredictionResponse,
    AIFeedbackCreate,
    MessageResponse
)
from backend.app.core.dependencies import (
    get_current_user,
    get_user_roles,
    require_role,
    enforce_organization_isolation
)
from backend.app.services.ticket_service import TicketService
from backend.app.integrations.ai_service import ai_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])


def format_ticket_brief(t: Ticket) -> Dict[str, Any]:
    now = utc_now()
    is_breached = False
    if t.sla_tracking:
        is_breached = t.sla_tracking.is_response_breached or t.sla_tracking.is_resolution_breached
    elif t.resolution_due_at and t.resolution_due_at < now and t.status not in ["RESOLVED", "CLOSED"]:
        is_breached = True

    return {
        "id": t.id,
        "org_id": t.org_id,
        "ticket_number": t.ticket_number,
        "title": t.title,
        "category_id": t.category_id,
        "category_name": t.category.name if t.category else None,
        "priority": t.priority,
        "status": t.status,
        "requester_id": t.requester_id,
        "requester_name": t.requester.full_name if t.requester else None,
        "assigned_to_id": t.assigned_to_id,
        "assignee_name": t.assignee.full_name if t.assignee else None,
        "assigned_team_id": t.assigned_team_id,
        "team_name": t.assigned_team.name if t.assigned_team else None,
        "response_due_at": t.response_due_at,
        "resolution_due_at": t.resolution_due_at,
        "is_sla_breached": is_breached,
        "created_at": t.created_at,
        "updated_at": t.updated_at
    }


@router.get("", response_model=Dict[str, Any])
def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category_id: Optional[str] = None,
    department_id: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
    requester_id: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(current_user, db)
    query = db.query(Ticket).filter(Ticket.org_id == current_user.org_id)

    # Scoping: If user is REQUESTER only, restrict to own tickets
    if "REQUESTER" in roles and not any(r in roles for r in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]):
        query = query.filter(Ticket.requester_id == current_user.id)
    elif requester_id:
        query = query.filter(Ticket.requester_id == requester_id)

    # Filters
    if status:
        query = query.filter(Ticket.status == status.upper())
    if priority:
        query = query.filter(Ticket.priority == priority.upper())
    if category_id:
        query = query.filter(Ticket.category_id == category_id)
    if department_id:
        query = query.filter(Ticket.department_id == department_id)
    if assigned_to_id:
        query = query.filter(Ticket.assigned_to_id == assigned_to_id)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(s),
                Ticket.title.ilike(s),
                Ticket.description.ilike(s)
            )
        )

    # Sorting
    sort_column = getattr(Ticket, sort_by, Ticket.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [format_ticket_brief(t) for t in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("", response_model=TicketDetailResponse)
def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = TicketService.create_ticket(
        ticket_in=ticket_in,
        current_user=current_user,
        db=db,
        trigger_ai_analysis=True
    )
    return get_ticket(ticket.id, current_user, db)


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    enforce_organization_isolation(ticket.org_id, current_user, db)
    roles = get_user_roles(current_user, db)
    
    # Requesters can only view their own tickets
    if "REQUESTER" in roles and not any(r in roles for r in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]):
        if ticket.requester_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this ticket")

    brief = format_ticket_brief(ticket)

    # Latest AI Prediction
    latest_pred = None
    pred_obj = (
        db.query(AIPrediction)
        .filter(AIPrediction.ticket_id == ticket.id)
        .order_by(desc(AIPrediction.created_at))
        .first()
    )
    if pred_obj:
        latest_pred = {
            "id": pred_obj.id,
            "model_name": pred_obj.model_name,
            "predicted_category_name": pred_obj.predicted_category.name if pred_obj.predicted_category else None,
            "predicted_priority": pred_obj.predicted_priority,
            "confidence_scores": pred_obj.confidence_scores,
            "rationale": pred_obj.rationale,
            "execution_time_ms": pred_obj.execution_time_ms,
            "created_at": pred_obj.created_at
        }

    # Latest SLA Risk
    latest_sla_risk = None
    risk_obj = (
        db.query(SLARiskPrediction)
        .filter(SLARiskPrediction.ticket_id == ticket.id)
        .order_by(desc(SLARiskPrediction.created_at))
        .first()
    )
    if risk_obj:
        latest_sla_risk = {
            "risk_score": risk_obj.risk_score,
            "risk_level": risk_obj.risk_level,
            "risk_factors": risk_obj.risk_factors,
            "suggested_mitigation": risk_obj.suggested_mitigation
        }

    # SLA Info
    sla_info = None
    if ticket.sla_tracking:
        sla_info = {
            "policy_name": ticket.sla_tracking.policy.name if ticket.sla_tracking.policy else "Standard SLA",
            "response_deadline": ticket.sla_tracking.response_deadline,
            "resolution_deadline": ticket.sla_tracking.resolution_deadline,
            "is_response_breached": ticket.sla_tracking.is_response_breached,
            "is_resolution_breached": ticket.sla_tracking.is_resolution_breached
        }

    return TicketDetailResponse(
        **brief,
        description=ticket.description,
        department_id=ticket.department_id,
        department_name=ticket.department.name if ticket.department else None,
        first_responded_at=ticket.first_responded_at,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        tags=ticket.tags or [],
        comments_count=len(ticket.comments),
        sla_info=sla_info,
        latest_ai_prediction=latest_pred,
        latest_sla_risk=latest_sla_risk
    )


@router.patch("/{ticket_id}", response_model=TicketDetailResponse)
def update_ticket(
    ticket_id: str,
    ticket_update: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    enforce_organization_isolation(ticket.org_id, current_user, db)

    now = utc_now()
    if ticket_update.title is not None:
        ticket.title = ticket_update.title
    if ticket_update.description is not None:
        ticket.description = ticket_update.description
    if ticket_update.category_id is not None:
        ticket.category_id = ticket_update.category_id
    if ticket_update.priority is not None:
        old_priority = ticket.priority
        ticket.priority = ticket_update.priority
        db.add(TicketEvent(
            ticket_id=ticket.id,
            actor_id=current_user.id,
            event_type="PRIORITY_CHANGED",
            old_value=old_priority,
            new_value=ticket_update.priority
        ))
    if ticket_update.department_id is not None:
        ticket.department_id = ticket_update.department_id
    if ticket_update.tags is not None:
        ticket.tags = ticket_update.tags

    ticket.updated_at = now
    db.commit()
    db.refresh(ticket)
    return get_ticket(ticket.id, current_user, db)


@router.post("/{ticket_id}/assign", response_model=TicketDetailResponse, dependencies=[Depends(require_role(["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]))])
def assign_ticket(
    ticket_id: str,
    assign_in: TicketAssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

    ticket = TicketService.assign_ticket(ticket, assign_in, current_user, db)
    return get_ticket(ticket.id, current_user, db)


@router.post("/{ticket_id}/transition", response_model=TicketDetailResponse)
def transition_ticket(
    ticket_id: str,
    transition_in: TicketTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

    # Requesters can only transition to CLOSED or REOPENED
    roles = get_user_roles(current_user, db)
    if "REQUESTER" in roles and not any(r in roles for r in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]):
        if transition_in.status.upper() not in ["CLOSED", "REOPENED"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Requesters are only permitted to Close or Reopen tickets."
            )

    ticket = TicketService.transition_ticket(ticket, transition_in, current_user, db)
    return get_ticket(ticket.id, current_user, db)


@router.get("/{ticket_id}/comments", response_model=List[CommentResponse])
def get_comments(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

    roles = get_user_roles(current_user, db)
    is_requester = "REQUESTER" in roles and not any(r in roles for r in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"])

    query = db.query(TicketComment).filter(TicketComment.ticket_id == ticket.id)
    if is_requester:
        query = query.filter(TicketComment.is_internal == False)

    comments = query.order_by(asc(TicketComment.created_at)).all()
    results = []
    for c in comments:
        c_roles = get_user_roles(c.author, db) if c.author else []
        results.append(CommentResponse(
            id=c.id,
            ticket_id=c.ticket_id,
            author_id=c.author_id,
            author_name=c.author.full_name if c.author else "System",
            author_role=c_roles[0] if c_roles else "USER",
            content=c.content,
            is_internal=c.is_internal,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))
    return results


@router.post("/{ticket_id}/comments", response_model=CommentResponse)
def add_comment(
    ticket_id: str,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

    roles = get_user_roles(current_user, db)
    is_requester = "REQUESTER" in roles and not any(r in roles for r in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"])

    if is_requester and comment_in.is_internal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requesters cannot create internal agent notes."
        )

    now = utc_now()
    comment = TicketComment(
        ticket_id=ticket.id,
        author_id=current_user.id,
        content=comment_in.content,
        is_internal=comment_in.is_internal,
        created_at=now,
        updated_at=now
    )
    db.add(comment)

    # First responded at if an agent responded publicly
    if not comment_in.is_internal and not is_requester and ticket.first_responded_at is None:
        ticket.first_responded_at = now

    event = TicketEvent(
        ticket_id=ticket.id,
        actor_id=current_user.id,
        event_type="COMMENT_ADDED",
        details={"is_internal": comment_in.is_internal}
    )
    db.add(event)

    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        ticket_id=comment.ticket_id,
        author_id=comment.author_id,
        author_name=current_user.full_name,
        author_role=roles[0] if roles else "USER",
        content=comment.content,
        is_internal=comment.is_internal,
        created_at=comment.created_at,
        updated_at=comment.updated_at
    )


@router.get("/{ticket_id}/history", response_model=List[EventResponse])
def get_ticket_history(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

    events = (
        db.query(TicketEvent)
        .filter(TicketEvent.ticket_id == ticket.id)
        .order_by(asc(TicketEvent.created_at))
        .all()
    )

    results = []
    for e in events:
        results.append(EventResponse(
            id=e.id,
            ticket_id=e.ticket_id,
            actor_id=e.actor_id,
            actor_name=e.actor.full_name if e.actor else "System",
            event_type=e.event_type,
            old_value=e.old_value,
            new_value=e.new_value,
            details=e.details,
            created_at=e.created_at
        ))
    return results


@router.post("/{ticket_id}/ai/analyze", response_model=AIPredictionResponse)
def trigger_ai_analysis(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

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

    # Log AI event
    db.add(TicketEvent(
        ticket_id=ticket.id,
        actor_id=current_user.id,
        event_type="AI_ANALYZED",
        new_value=ai_res["predicted_category_name"],
        details={"priority": ai_res["predicted_priority"], "confidence": ai_res["confidence_scores"]}
    ))

    db.commit()
    db.refresh(ai_pred)

    return AIPredictionResponse(
        id=ai_pred.id,
        ticket_id=ai_pred.ticket_id,
        model_name=ai_pred.model_name,
        model_version=ai_pred.model_version,
        predicted_category_id=ai_pred.predicted_category_id,
        predicted_category_name=ai_res["predicted_category_name"],
        predicted_priority=ai_pred.predicted_priority,
        confidence_scores=ai_pred.confidence_scores,
        rationale=ai_pred.rationale,
        execution_time_ms=ai_pred.execution_time_ms,
        created_at=ai_pred.created_at
    )


@router.get("/{ticket_id}/ai/predictions", response_model=List[AIPredictionResponse])
def get_ai_predictions(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

    preds = (
        db.query(AIPrediction)
        .filter(AIPrediction.ticket_id == ticket.id)
        .order_by(desc(AIPrediction.created_at))
        .all()
    )
    
    results = []
    for p in preds:
        results.append(AIPredictionResponse(
            id=p.id,
            ticket_id=p.ticket_id,
            model_name=p.model_name,
            model_version=p.model_version,
            predicted_category_id=p.predicted_category_id,
            predicted_category_name=p.predicted_category.name if p.predicted_category else None,
            predicted_priority=p.predicted_priority,
            confidence_scores=p.confidence_scores,
            rationale=p.rationale,
            execution_time_ms=p.execution_time_ms,
            created_at=p.created_at
        ))
    return results


@router.post("/{ticket_id}/ai/feedback", response_model=MessageResponse)
def submit_ai_feedback(
    ticket_id: str,
    fb_in: AIFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    enforce_organization_isolation(ticket.org_id, current_user, db)

    pred = db.query(AIPrediction).filter(AIPrediction.id == fb_in.prediction_id).first()
    if not pred or pred.ticket_id != ticket.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid prediction reference")

    feedback = AIFeedback(
        ticket_id=ticket.id,
        prediction_id=pred.id,
        user_id=current_user.id,
        is_category_accepted=fb_in.is_category_accepted,
        corrected_category_id=fb_in.corrected_category_id,
        is_priority_accepted=fb_in.is_priority_accepted,
        corrected_priority=fb_in.corrected_priority,
        feedback_notes=fb_in.feedback_notes,
        rating=fb_in.rating
    )
    db.add(feedback)
    db.commit()

    return MessageResponse(message="AI feedback recorded successfully to train future iterations")
