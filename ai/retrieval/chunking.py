from typing import List, Dict, Any


def chunk_text(
    text: str,
    chunk_size: int = 400,
    chunk_overlap: int = 60
) -> List[str]:
    """
    Chunks text using a sliding window with overlap, respecting paragraph/sentence boundaries.
    """
    if not text:
        return []
        
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    
    current_chunk = ""
    for para in paragraphs:
        if len(para) > chunk_size:
            # Paragraph is longer than chunk_size, split by lines/sentences
            lines = [line.strip() for line in para.split("\n") if line.strip()]
            for line in lines:
                if len(current_chunk) + len(line) + 1 <= chunk_size:
                    current_chunk = (current_chunk + "\n" + line).strip()
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    current_chunk = line
        else:
            if len(current_chunk) + len(para) + 2 <= chunk_size:
                current_chunk = (current_chunk + "\n\n" + para).strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para
                
    if current_chunk:
        chunks.append(current_chunk)
        
    # If no chunk created (e.g. very single line), fallback
    if not chunks and text:
        chunks = [text[:chunk_size]]
        
    return chunks
