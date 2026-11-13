from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.all_models import User
from backend.app.schemas.all_schemas import DashboardSummary, DashboardTrends
from backend.app.core.dependencies import get_current_user
from backend.app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return DashboardService.get_summary(current_user.org_id, db)


@router.get("/trends", response_model=DashboardTrends)
def get_dashboard_trends(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return DashboardService.get_trends(current_user.org_id, db, days=days)
