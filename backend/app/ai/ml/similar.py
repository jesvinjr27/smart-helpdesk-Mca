import time
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


def find_similar_tickets(
    query_text: str,
    candidates: List[Dict[str, Any]],
    top_k: int = 4,
    min_score: float = 0.15
) -> Dict[str, Any]:
    """
    Fast, in-memory TF-IDF and Cosine Similarity matcher for similar tickets.
    - Zero heavy models or vector DBs.
    - CPU inference in < 10 ms across 100 candidate tickets.
    - Input text bounded to 500 characters to conserve RAM.
    """
    t0 = time.time()
    if not query_text or not candidates:
        return {
            "similar_tickets": [],
            "total_found": 0,
            "execution_time_ms": round((time.time() - t0) * 1000, 2)
        }

    texts = [f"{c.get('title', '')} {c.get('description', '')}"[:500] for c in candidates]
    query_bounded = query_text[:500]

    try:
        vectorizer = TfidfVectorizer(max_features=256, stop_words="english", ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(texts).toarray()
        q_vec = vectorizer.transform([query_bounded]).toarray()

        # L2-normalized cosine similarity
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        mat_norm = matrix / norms

        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec /= q_norm

        scores = np.dot(mat_norm, q_vec.T).flatten()
        sorted_indices = np.argsort(-scores)

        results = []
        for idx in sorted_indices:
            score = float(scores[idx])
            if score < min_score:
                break
            cand = candidates[idx]
            cand_id = cand.get("ticket_id") or cand.get("id") or ""
            results.append({
                "id": cand_id,
                "ticket_id": cand_id,
                "ticket_number": cand.get("ticket_number") or "",
                "title": cand.get("title") or "",
                "status": cand.get("status") or "NEW",
                "priority": cand.get("priority") or "MEDIUM",
                "category_name": cand.get("category_name"),
                "similarity_score": round(score, 3),
                "created_at": cand.get("created_at"),
                "updated_at": cand.get("updated_at")
            })

            if len(results) >= top_k:
                break

        exec_ms = round((time.time() - t0) * 1000, 2)
        return {
            "similar_tickets": results,
            "total_found": len(results),
            "execution_time_ms": exec_ms
        }
    except Exception as e:
        return {
            "similar_tickets": [],
            "total_found": 0,
            "execution_time_ms": round((time.time() - t0) * 1000, 2),
            "error": str(e)
        }
