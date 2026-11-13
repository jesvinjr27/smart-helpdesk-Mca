import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.db.session import get_db
from backend.app.models.all_models import KnowledgeArticle, KnowledgeChunk, Category, User, utc_now
from backend.app.schemas.all_schemas import (
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeArticleResponse,
    KnowledgeIngestRequest,
    KnowledgeIngestResponse,
    AISearchRequest,
    AISearchResponse,
    AISearchResultItem,
    AIAssistRequest,
    AIAssistResponse,
    MessageResponse
)
from backend.app.core.dependencies import (
    get_current_user,
    get_user_roles,
    require_role,
    enforce_organization_isolation
)
from backend.app.integrations.ai_service import ai_service
from ai.scripts.ingest_knowledge_base import ingest_articles

router = APIRouter(tags=["Knowledge Base & AI RAG"])

# In-memory ingestion job status tracking
INGESTION_JOBS: Dict[str, Dict[str, Any]] = {}


# ---------------------------------------------------------------------
# Knowledge Articles CRUD
# ---------------------------------------------------------------------
@router.get("/knowledge/articles", response_model=List[KnowledgeArticleResponse])
def list_articles(
    category_id: Optional[str] = None,
    status: str = "APPROVED",
    visibility: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(current_user, db)
    is_requester = "REQUESTER" in roles and not any(r in roles for r in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"])

    query = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.org_id == current_user.org_id,
        KnowledgeArticle.is_active == True
    )

    if is_requester:
        query = query.filter(KnowledgeArticle.visibility == "PUBLIC", KnowledgeArticle.status == "APPROVED")
    else:
        if status:
            query = query.filter(KnowledgeArticle.status == status)
        if visibility:
            query = query.filter(KnowledgeArticle.visibility == visibility)

    if category_id:
        query = query.filter(KnowledgeArticle.category_id == category_id)

    articles = query.order_by(desc(KnowledgeArticle.created_at)).all()
    results = []
    for a in articles:
        results.append(KnowledgeArticleResponse(
            id=a.id,
            org_id=a.org_id,
            author_id=a.author_id,
            author_name=a.author.full_name if a.author else "System",
            category_id=a.category_id,
            category_name=a.category.name if a.category else None,
            title=a.title,
            content=a.content,
            summary=a.summary,
            visibility=a.visibility,
            status=a.status,
            tags=a.tags or [],
            view_count=a.view_count,
            is_active=a.is_active,
            created_at=a.created_at,
            updated_at=a.updated_at
        ))
    return results


@router.post("/knowledge/articles", response_model=KnowledgeArticleResponse, dependencies=[Depends(require_role(["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]))])
def create_article(
    art_in: KnowledgeArticleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = enforce_organization_isolation(art_in.org_id, current_user, db)
    now = utc_now()

    article = KnowledgeArticle(
        org_id=org_id,
        author_id=current_user.id,
        category_id=art_in.category_id,
        title=art_in.title,
        content=art_in.content,
        summary=art_in.summary,
        visibility=art_in.visibility or "PUBLIC",
        status=art_in.status or "APPROVED",
        tags=art_in.tags or [],
        view_count=0,
        is_active=True,
        created_at=now,
        updated_at=now
    )
    db.add(article)
    db.commit()
    db.refresh(article)

    # Immediately ingest into vector store
    try:
        ai_service.vector_store.add_documents([{
            "chunk_id": f"chunk-{article.id}-0",
            "article_id": article.id,
            "org_id": article.org_id,
            "title": article.title,
            "content": article.content,
            "visibility": article.visibility
        }])
    except Exception:
        pass

    return KnowledgeArticleResponse(
        id=article.id,
        org_id=article.org_id,
        author_id=article.author_id,
        author_name=current_user.full_name,
        category_id=article.category_id,
        category_name=article.category.name if article.category else None,
        title=article.title,
        content=article.content,
        summary=article.summary,
        visibility=article.visibility,
        status=article.status,
        tags=article.tags or [],
        view_count=article.view_count,
        is_active=article.is_active,
        created_at=article.created_at,
        updated_at=article.updated_at
    )


@router.get("/knowledge/articles/{article_id}", response_model=KnowledgeArticleResponse)
def get_article(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
        
    enforce_organization_isolation(article.org_id, current_user, db)
    
    # Increment view count
    article.view_count += 1
    db.commit()

    return KnowledgeArticleResponse(
        id=article.id,
        org_id=article.org_id,
        author_id=article.author_id,
        author_name=article.author.full_name if article.author else "System",
        category_id=article.category_id,
        category_name=article.category.name if article.category else None,
        title=article.title,
        content=article.content,
        summary=article.summary,
        visibility=article.visibility,
        status=article.status,
        tags=article.tags or [],
        view_count=article.view_count,
        is_active=article.is_active,
        created_at=article.created_at,
        updated_at=article.updated_at
    )


@router.patch("/knowledge/articles/{article_id}", response_model=KnowledgeArticleResponse, dependencies=[Depends(require_role(["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]))])
def update_article(
    article_id: str,
    art_update: KnowledgeArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
        
    enforce_organization_isolation(article.org_id, current_user, db)

    if art_update.title is not None:
        article.title = art_update.title
    if art_update.content is not None:
        article.content = art_update.content
    if art_update.summary is not None:
        article.summary = art_update.summary
    if art_update.category_id is not None:
        article.category_id = art_update.category_id
    if art_update.visibility is not None:
        article.visibility = art_update.visibility
    if art_update.status is not None:
        article.status = art_update.status
    if art_update.tags is not None:
        article.tags = art_update.tags
    if art_update.is_active is not None:
        article.is_active = art_update.is_active

    article.updated_at = utc_now()
    db.commit()
    db.refresh(article)
    return get_article(article.id, current_user, db)


@router.delete("/knowledge/articles/{article_id}", response_model=MessageResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN", "LEAD"]))])
def delete_article(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
        
    enforce_organization_isolation(article.org_id, current_user, db)
    article.is_active = False
    article.status = "ARCHIVED"
    db.commit()
    return MessageResponse(message="Article archived successfully")


# ---------------------------------------------------------------------
# Vector Ingestion
# ---------------------------------------------------------------------
def background_ingest_task(job_id: str, rebuild: bool):
    try:
        INGESTION_JOBS[job_id]["status"] = "PROCESSING"
        total_art, total_chunks = ingest_articles(rebuild=rebuild)
        INGESTION_JOBS[job_id]["status"] = "COMPLETED"
        INGESTION_JOBS[job_id]["total_articles"] = total_art
        INGESTION_JOBS[job_id]["total_chunks"] = total_chunks
        INGESTION_JOBS[job_id]["message"] = f"Ingestion completed. {total_art} articles, {total_chunks} chunks indexed."
    except Exception as e:
        INGESTION_JOBS[job_id]["status"] = "FAILED"
        INGESTION_JOBS[job_id]["message"] = f"Ingestion failed: {str(e)}"


@router.post("/knowledge/ingest", response_model=KnowledgeIngestResponse, dependencies=[Depends(require_role(["ORG_ADMIN", "SYS_ADMIN", "LEAD"]))])
def trigger_ingest(
    ingest_in: KnowledgeIngestRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    job_id = str(uuid.uuid4())
    INGESTION_JOBS[job_id] = {
        "job_id": job_id,
        "status": "PENDING",
        "total_articles": 0,
        "total_chunks": 0,
        "message": "Ingestion job queued"
    }
    
    background_tasks.add_task(background_ingest_task, job_id, ingest_in.rebuild_index)
    return KnowledgeIngestResponse(**INGESTION_JOBS[job_id])


@router.get("/knowledge/ingest/{job_id}", response_model=KnowledgeIngestResponse)
def get_ingest_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    if job_id not in INGESTION_JOBS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return KnowledgeIngestResponse(**INGESTION_JOBS[job_id])


# ---------------------------------------------------------------------
# Semantic Search & RAG Assist
# ---------------------------------------------------------------------
@router.post("/ai/knowledge/search", response_model=AISearchResponse)
def search_knowledge(
    search_in: AISearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(current_user, db)
    role_str = roles[0] if roles else "REQUESTER"

    results = ai_service.vector_store.search(
        query=search_in.query,
        org_id=current_user.org_id,
        user_role=role_str,
        top_k=search_in.top_k,
        min_score=0.15
    )

    items = [
        AISearchResultItem(
            chunk_id=r["chunk_id"],
            article_id=r["article_id"],
            article_title=r["article_title"],
            content=r["content"],
            similarity_score=r["similarity_score"],
            visibility=r["visibility"]
        )
        for r in results
    ]

    return AISearchResponse(
        query=search_in.query,
        results=items,
        total_retrieved=len(items)
    )


@router.post("/ai/assist", response_model=AIAssistResponse)
async def generate_ai_assist(
    assist_in: AIAssistRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = assist_in.query or assist_in.description or ""
    if not query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query or description required")

    roles = get_user_roles(current_user, db)
    role_str = roles[0] if roles else "REQUESTER"

    response_data = await ai_service.rag_service.generate_response(
        query=query,
        org_id=current_user.org_id,
        user_role=role_str,
        top_k=3,
        tone=assist_in.tone or "professional"
    )

    return AIAssistResponse(**response_data)
