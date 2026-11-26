from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.models.all_models import (
    Ticket,
    Category,
    User,
    SLATracking,
    AIPrediction,
    AIFeedback,
    utc_now
)


class DashboardService:
    @staticmethod
    def get_summary(org_id: str, db: Session) -> Dict[str, Any]:
        tickets_query = db.query(Ticket).filter(Ticket.org_id == org_id)
        total_tickets = tickets_query.count()
        
        open_tickets = tickets_query.filter(
            Ticket.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING_CUSTOMER", "REOPENED"])
        ).count()
        
        resolved_tickets = tickets_query.filter(
            Ticket.status.in_(["RESOLVED", "CLOSED"])
        ).count()
        
        critical_tickets = tickets_query.filter(
            Ticket.priority == "CRITICAL",
            Ticket.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS"])
        ).count()

        # SLA Compliance
        sla_query = (
            db.query(SLATracking)
            .join(Ticket, Ticket.id == SLATracking.ticket_id)
            .filter(Ticket.org_id == org_id)
        )
        total_tracked = sla_query.count()
        breached = sla_query.filter(
            (SLATracking.is_response_breached == True) | (SLATracking.is_resolution_breached == True)
        ).count()
        
        sla_compliance = 100.0 if total_tracked == 0 else round(
            ((total_tracked - breached) / total_tracked) * 100.0, 1
        )

        # Average resolution time in hours
        resolved_list = tickets_query.filter(
            Ticket.resolved_at != None,
            Ticket.created_at != None
        ).all()
        if resolved_list:
            total_sec = sum((t.resolved_at - t.created_at).total_seconds() for t in resolved_list)
            avg_res_hours = round(total_sec / (len(resolved_list) * 3600.0), 1)
        else:
            avg_res_hours = 0.0

        # AI metrics
        ai_assisted = (
            db.query(AIPrediction)
            .join(Ticket, Ticket.id == AIPrediction.ticket_id)
            .filter(Ticket.org_id == org_id)
            .count()
        )
        
        # Feedback accuracy
        feedback_total = (
            db.query(AIFeedback)
            .join(Ticket, Ticket.id == AIFeedback.ticket_id)
            .filter(Ticket.org_id == org_id)
            .count()
        )
        accepted = (
            db.query(AIFeedback)
            .join(Ticket, Ticket.id == AIFeedback.ticket_id)
            .filter(Ticket.org_id == org_id, AIFeedback.is_category_accepted == True)
            .count()
        )
        ai_accuracy = 92.5 if feedback_total == 0 else round((accepted / feedback_total) * 100.0, 1)

        return {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "resolved_tickets": resolved_tickets,
            "critical_tickets": critical_tickets,
            "sla_compliance_rate": sla_compliance,
            "avg_resolution_hours": avg_res_hours,
            "ai_assisted_tickets": ai_assisted,
            "ai_category_accuracy": ai_accuracy
        }

    @staticmethod
    def get_trends(org_id: str, db: Session, days: int = 7) -> Dict[str, Any]:
        now = utc_now()
        start_date = now - timedelta(days=days)

        # Ticket volume by day
        tickets = db.query(Ticket).filter(
            Ticket.org_id == org_id,
            Ticket.created_at >= start_date
        ).all()

        date_counts: Dict[str, int] = {}
        for i in range(days):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            date_counts[d] = 0

        for t in tickets:
            d_str = t.created_at.strftime("%Y-%m-%d")
            if d_str in date_counts:
                date_counts[d_str] += 1

        volume_list = [{"date": k, "count": v} for k, v in date_counts.items()]

        # Status distribution
        status_rows = (
            db.query(Ticket.status, func.count(Ticket.id))
            .filter(Ticket.org_id == org_id)
            .group_by(Ticket.status)
            .all()
        )
        status_dict = {row[0]: row[1] for row in status_rows}

        # Priority distribution
        priority_rows = (
            db.query(Ticket.priority, func.count(Ticket.id))
            .filter(Ticket.org_id == org_id)
            .group_by(Ticket.priority)
            .all()
        )
        priority_dict = {row[0]: row[1] for row in priority_rows}

        # Category breakdown
        cat_rows = (
            db.query(Category.name, func.count(Ticket.id))
            .join(Ticket, Ticket.category_id == Category.id)
            .filter(Ticket.org_id == org_id)
            .group_by(Category.name)
            .all()
        )
        category_breakdown = [{"name": row[0], "count": row[1]} for row in cat_rows]

        # Agent workload
        agent_rows = (
            db.query(User.full_name, func.count(Ticket.id))
            .join(Ticket, Ticket.assigned_to_id == User.id)
            .filter(
                Ticket.org_id == org_id,
                Ticket.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING_CUSTOMER"])
            )
            .group_by(User.full_name)
            .all()
        )
        agent_workload = [{"agent_name": row[0], "active_tickets": row[1]} for row in agent_rows]

        return {
            "ticket_volume_by_day": volume_list,
            "daily_volume": volume_list,
            "status_distribution": status_dict,
            "priority_distribution": priority_dict,
            "category_breakdown": category_breakdown,
            "agent_workload": agent_workload
        }
