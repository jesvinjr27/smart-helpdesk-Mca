import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.all_models import KnowledgeArticle

logger = logging.getLogger(__name__)


class DatabaseKnowledgeRetriever:
    """
    Tenant and Role Permission-Aware Knowledge Article Retriever.
    Reads approved knowledge articles directly from the application database.
    - Zero external vector DB required.
    - Guarantees strict multi-tenant data isolation.
    - Enforces role-based visibility gating.
    """

    @staticmethod
    def get_authorized_articles(
        db: Session,
        org_id: str,
        user_role: str = "REQUESTER"
    ) -> List[Dict[str, Any]]:
        """
        Query all published knowledge articles within the organization
        filtered by the user's role permissions.
        """
        query = db.query(KnowledgeArticle).filter(
            KnowledgeArticle.org_id == org_id,
            KnowledgeArticle.status == "APPROVED",
            KnowledgeArticle.is_active == True
        )

        # Role-based visibility filtering
        if user_role in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]:
            # Privileged roles can see PUBLIC, INTERNAL, and RESTRICTED
            articles = query.all()
        else:
            # Requesters (Employee, Student, etc.) can ONLY access PUBLIC articles
            articles = query.filter(KnowledgeArticle.visibility == "PUBLIC").all()

        results = []
        for a in articles:
            results.append({
                "article_id": a.id,
                "org_id": a.org_id,
                "title": a.title,
                "content": a.content,
                "category_id": a.category_id,
                "visibility": a.visibility,
                "created_at": a.created_at
            })

        return results
