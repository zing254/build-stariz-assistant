"""
RAG Engine — Local Knowledge Base with ChromaDB + Sentence Transformers
100% offline. No cloud API needed.
"""
import os
import hashlib
import json
import logging
from typing import List, Dict, Optional
from pathlib import Path
import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "chroma_db"


class RAGEngine:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        try:
            DB_PATH.mkdir(parents=True, exist_ok=True)
            self.client = chromadb.PersistentClient(path=str(DB_PATH))
            self.collection = self.client.get_or_create_collection(
                name="knowledge_base",
                metadata={"hnsw:space": "cosine"}
            )
            self._initialized = True
            logger.info(f"RAG Engine initialized. Documents: {self.collection.count()}")
        except Exception as e:
            logger.error(f"Failed to initialize RAG Engine: {e}")
            raise

    def ingest_text(self, text: str, source: str, metadata: Optional[Dict] = None) -> int:
        """Ingest text into knowledge base. Returns number of chunks created."""
        if not text.strip():
            return 0
        chunks = self._split_text(text)
        if not chunks:
            return 0
        ids = []
        documents = []
        metadatas = []
        for i, chunk in enumerate(chunks):
            doc_id = self._generate_id(chunk, source, i)
            ids.append(doc_id)
            documents.append(chunk)
            meta = {"source": source, "chunk_index": i, **(metadata or {})}
            metadatas.append(meta)
        try:
            self.collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Ingested {len(chunks)} chunks from {source}")
            return len(chunks)
        except Exception as e:
            logger.error(f"Ingestion error: {e}")
            return 0

    def ingest_file(self, file_path: str) -> int:
        """Ingest a file (PDF, DOCX, TXT, MD, code files)."""
        path = Path(file_path)
        if not path.exists():
            logger.warning(f"File not found: {file_path}")
            return 0
        content = ""
        try:
            if path.suffix == '.pdf':
                from pypdf import PdfReader
                reader = PdfReader(str(path))
                content = "\n".join(page.extract_text() or "" for page in reader.pages)
            elif path.suffix == '.docx':
                from docx import Document
                doc = Document(str(path))
                content = "\n".join(p.text for p in doc.paragraphs)
            elif path.suffix in ['.txt', '.md', '.py', '.js', '.ts', '.tsx', '.json', '.yaml', '.yml', '.html', '.css', '.csv']:
                content = path.read_text(encoding='utf-8', errors='ignore')
            else:
                logger.warning(f"Unsupported file type: {path.suffix}")
                return 0
        except Exception as e:
            logger.error(f"Error reading {file_path}: {e}")
            return 0
        return self.ingest_text(content, source=str(path))

    def ingest_directory(self, dir_path: str, extensions: Optional[List[str]] = None,
                         max_files: int = 100) -> int:
        """Ingest all supported files in a directory."""
        total = 0
        path = Path(dir_path)
        if not path.exists():
            return 0
        files_processed = 0
        for file_path in sorted(path.rglob('*')):
            if files_processed >= max_files:
                break
            if file_path.is_file():
                if extensions and file_path.suffix not in extensions:
                    continue
                if file_path.name.startswith('.'):
                    continue
                if 'node_modules' in str(file_path) or '.git' in str(file_path):
                    continue
                try:
                    count = self.ingest_file(str(file_path))
                    total += count
                    files_processed += 1
                except Exception as e:
                    logger.error(f"Error ingesting {file_path}: {e}")
        logger.info(f"Ingested {total} chunks from {files_processed} files in {dir_path}")
        return total

    def search(self, query: str, top_k: int = 5, filter_source: Optional[str] = None) -> List[Dict]:
        """Search knowledge base. Returns list of {content, metadata, score}."""
        try:
            where = None
            if filter_source:
                where = {"source": {"$contains": filter_source}}
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k * 2,
                where=where,
                include=["documents", "metadatas", "distances"]
            )
            docs = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]
            search_results = []
            for doc, meta, dist in zip(docs, metadatas, distances):
                score = 1.0 / (1.0 + dist)
                search_results.append({
                    "content": doc,
                    "metadata": meta,
                    "score": round(score, 4),
                    "distance": round(dist, 4)
                })
            search_results.sort(key=lambda x: x["score"], reverse=True)
            return search_results[:top_k]
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def get_stats(self) -> Dict:
        """Get knowledge base statistics."""
        return {
            "total_documents": self.collection.count(),
            "embedding_model": "chroma-default",
            "chunk_size": 1000,
            "chunk_overlap": 200,
            "db_path": str(DB_PATH)
        }

    def delete_collection(self):
        """Reset knowledge base."""
        try:
            self.client.delete_collection("knowledge_base")
            self.collection = self.client.create_collection(
                name="knowledge_base",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Knowledge base reset")
            return {"status": "reset"}
        except Exception as e:
            logger.error(f"Reset error: {e}")
            return {"status": "error", "detail": str(e)}

    def _split_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks."""
        if len(text) <= chunk_size:
            return [text] if text.strip() else []
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk)
            start = end - overlap
        return chunks

    def _generate_id(self, content: str, source: str, index: int) -> str:
        """Deterministic ID for deduplication."""
        raw = f"{source}::{index}::{content[:100]}"
        return hashlib.md5(raw.encode()).hexdigest()
