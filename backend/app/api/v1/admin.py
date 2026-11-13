from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.db.session import get_db
from backend.app.models.all_models import AuditLog, User
from backend.app.schemas.all_schemas import AIAdminModelsResponse, AuditLogResponse
from backend.app.core.dependencies import get_current_user, require_role
from backend.app.integrations.ai_service import ai_service

router = APIRouter(prefix="/admin", tags=["Administration & Monitoring"])


@router.get("/ai/models", response_model=AIAdminModelsResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN", "LEAD"]))])
async def get_ai_models_admin(
    current_user: User = Depends(get_current_user)
):
    summary = ai_service.get_model_status_summary()
    # Check live Ollama status
    ollama_check = await ai_service.check_ollama_health()
    summary["ollama_llm"]["status"] = ollama_check["status"]
    summary["ollama_llm"]["metrics"]["ollama_service"] = ollama_check

    return AIAdminModelsResponse(**summary)


@router.get("/audit-logs", response_model=List[AuditLogResponse], dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN"]))])
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.org_id == current_user.org_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = (
        query.order_by(desc(AuditLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    results = []
    for l in logs:
        results.append(AuditLogResponse(
            id=l.id,
            org_id=l.org_id,
            actor_id=l.actor_id,
            actor_name=l.actor.full_name if l.actor else "System",
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            ip_address=l.ip_address,
            details=l.details,
            created_at=l.created_at
        ))
    return results
