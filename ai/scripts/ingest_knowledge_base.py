import os
import sys

# Ensure backend root is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.db.session import SessionLocal
from backend.app.models.all_models import KnowledgeArticle, KnowledgeChunk
from ai.retrieval.chunking import chunk_text
from ai.retrieval.vector_store import KnowledgeVectorStore


def ingest_articles(rebuild: bool = True):
    print("Connecting to database to fetch approved knowledge articles...")
    db = SessionLocal()
    try:
        articles = db.query(KnowledgeArticle).filter(
            KnowledgeArticle.status == "APPROVED",
            KnowledgeArticle.is_active == True
        ).all()
        
        print(f"Found {len(articles)} approved articles to ingest.")
        if not articles:
            return 0, 0
            
        vector_store = KnowledgeVectorStore()
        if rebuild:
            vector_store.clear()
            # Clear existing chunks from db
            db.query(KnowledgeChunk).delete()
            db.commit()

        documents_to_embed = []
        total_chunks = 0
        
        for art in articles:
            chunks = chunk_text(art.content, chunk_size=400, chunk_overlap=60)
            for idx, text in enumerate(chunks):
                # Create DB KnowledgeChunk
                chunk_record = KnowledgeChunk(
                    article_id=art.id,
                    chunk_index=idx,
                    chunk_text=text,
                    token_count=len(text.split())
                )
                db.add(chunk_record)
                db.flush()
                
                documents_to_embed.append({
                    "chunk_id": chunk_record.id,
                    "article_id": art.id,
                    "org_id": art.org_id,
                    "title": art.title,
                    "content": text,
                    "visibility": art.visibility
                })
                total_chunks += 1
                
        # Generate embeddings and add to FAISS
        print(f"Embedding and indexing {len(documents_to_embed)} chunks into FAISS...")
        vector_ids = vector_store.add_documents(documents_to_embed)
        
        # Update chunk records with vector IDs
        for doc, v_id in zip(documents_to_embed, vector_ids):
            chunk_rec = db.query(KnowledgeChunk).filter(KnowledgeChunk.id == doc["chunk_id"]).first()
            if chunk_rec:
                chunk_rec.vector_id = v_id
                
        db.commit()
        print(f"Ingestion successful! Total Articles: {len(articles)} | Total Chunks: {total_chunks}")
        return len(articles), total_chunks
        
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    ingest_articles(rebuild=True)
