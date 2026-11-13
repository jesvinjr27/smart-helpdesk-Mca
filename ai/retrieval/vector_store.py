import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import joblib

logger = logging.getLogger(__name__)

# Global lazy references
_EMBEDDER = None
_VECTORIZER = None


def get_embedder(model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
    global _EMBEDDER
    if _EMBEDDER is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading local SentenceTransformer model: {model_name}")
            _EMBEDDER = SentenceTransformer(model_name)
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Falling back to TF-IDF vectorizer.")
            _EMBEDDER = None
    return _EMBEDDER


class KnowledgeVectorStore:
    def __init__(
        self,
        index_dir: str = "ai/artifacts",
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    ):
        self.index_dir = index_dir
        self.model_name = model_name
        self.index_file = os.path.join(index_dir, "kb_index.faiss")
        self.metadata_file = os.path.join(index_dir, "kb_metadata.json")
        self.vectorizer_file = os.path.join(index_dir, "kb_vectorizer.joblib")
        self.dimension = 384
        
        self.index = None
        self.metadata: List[Dict[str, Any]] = []
        self.vectorizer = None
        self._load_or_initialize()

    def _load_or_initialize(self):
        os.makedirs(self.index_dir, exist_ok=True)
        import faiss
        
        if os.path.exists(self.vectorizer_file):
            try:
                self.vectorizer = joblib.load(self.vectorizer_file)
            except Exception:
                self.vectorizer = None

        if os.path.exists(self.index_file) and os.path.exists(self.metadata_file):
            try:
                logger.info(f"Loading existing FAISS index from: {self.index_file}")
                self.index = faiss.read_index(self.index_file)
                with open(self.metadata_file, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                return
            except Exception as e:
                logger.error(f"Failed to read existing index: {e}. Reinitializing.")
                
        # Initialize new IndexFlatIP (Inner Product on normalized vectors = Cosine Similarity)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = []

    def save(self):
        import faiss
        os.makedirs(self.index_dir, exist_ok=True)
        faiss.write_index(self.index, self.index_file)
        with open(self.metadata_file, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)
        if self.vectorizer is not None:
            joblib.dump(self.vectorizer, self.vectorizer_file)
        logger.info(f"Saved FAISS index ({self.index.ntotal} vectors) to {self.index_file}")

    def embed_texts(self, texts: List[str], is_fitting: bool = False) -> np.ndarray:
        embedder = get_embedder(self.model_name)
        if embedder is not None and hasattr(embedder, "encode"):
            embeddings = embedder.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.astype("float32")
        else:
            from sklearn.feature_extraction.text import TfidfVectorizer
            if self.vectorizer is None or is_fitting:
                self.vectorizer = TfidfVectorizer(max_features=self.dimension, stop_words="english", ngram_range=(1, 2))
                matrix = self.vectorizer.fit_transform(texts).toarray()
            else:
                matrix = self.vectorizer.transform(texts).toarray()
                
            # Pad or truncate to self.dimension (384)
            padded = np.zeros((len(texts), self.dimension), dtype="float32")
            n_cols = min(matrix.shape[1], self.dimension)
            padded[:, :n_cols] = matrix[:, :n_cols]
            
            # Normalize for cosine similarity
            norms = np.linalg.norm(padded, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            return (padded / norms).astype("float32")

    def add_documents(self, documents: List[Dict[str, Any]], rebuild: bool = False) -> List[int]:
        if not documents:
            return []
            
        texts = [f"{doc.get('title', '')}\n{doc.get('content', '')}" for doc in documents]
        
        # When rebuilding or adding first batch, fit the vectorizer on the documents
        is_fitting = rebuild or (self.vectorizer is None) or (self.index.ntotal == 0)
        embeddings = self.embed_texts(texts, is_fitting=is_fitting)
        
        start_id = len(self.metadata)
        self.index.add(embeddings)
        
        vector_ids = []
        for i, doc in enumerate(documents):
            v_id = start_id + i
            meta_record = {
                "vector_id": v_id,
                "chunk_id": doc.get("chunk_id", str(v_id)),
                "article_id": doc.get("article_id"),
                "org_id": doc.get("org_id"),
                "title": doc.get("title"),
                "content": doc.get("content"),
                "visibility": doc.get("visibility", "PUBLIC")
            }
            self.metadata.append(meta_record)
            vector_ids.append(v_id)
            
        self.save()
        return vector_ids

    def search(
        self,
        query: str,
        org_id: str,
        user_role: str = "REQUESTER",
        top_k: int = 4,
        min_score: float = 0.05
    ) -> List[Dict[str, Any]]:
        if self.index is None or self.index.ntotal == 0:
            return []
            
        query_vector = self.embed_texts([query], is_fitting=False)
        
        fetch_k = min(self.index.ntotal, max(top_k * 4, 15))
        scores, indices = self.index.search(query_vector, fetch_k)
        
        results: List[Dict[str, Any]] = []
        allowed_visibilities = ["PUBLIC"]
        if user_role in ["AGENT", "LEAD", "ORG_ADMIN", "SYS_ADMIN"]:
            allowed_visibilities.extend(["INTERNAL", "RESTRICTED"])
            
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or idx >= len(self.metadata):
                continue
            meta = self.metadata[idx]
            
            # Strict tenant isolation
            if meta.get("org_id") != org_id:
                continue
                
            # Permission check
            if meta.get("visibility") not in allowed_visibilities:
                continue
                
            if float(score) < min_score:
                continue
                
            results.append({
                "chunk_id": meta.get("chunk_id"),
                "article_id": meta.get("article_id"),
                "article_title": meta.get("title"),
                "content": meta.get("content"),
                "similarity_score": round(float(score), 4),
                "visibility": meta.get("visibility")
            })
            
            if len(results) >= top_k:
                break
                
        return results

    def clear(self):
        import faiss
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = []
        self.vectorizer = None
        self.save()
