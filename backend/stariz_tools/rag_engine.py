"""
RAG Engine — Local Knowledge Base with ChromaDB + Sentence Transformers + BM25
100% offline. No cloud API needed. Hybrid vector + keyword search.
"""
import os
import hashlib
import json
import logging
from typing import List, Dict, Optional
from pathlib import Path
import chromadb
from chromadb.config import Settings
from rank_bm25 import BM25Okapi
import re

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
            self.bm25_index = None
            self.bm25_documents = []
            self.bm25_ids = []
            self._rebuild_bm25_index()
            self._initialized = True
            logger.info(f"RAG Engine initialized. Documents: {self.collection.count()}")
        except Exception as e:
            logger.error(f"Failed to initialize RAG Engine: {e}")
            raise

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenizer for BM25."""
        return re.findall(r'\b\w+\b', text.lower())

    def _rebuild_bm25_index(self):
        """Build BM25 index from all documents in ChromaDB."""
        try:
            all_docs = self.collection.get(include=["documents"])
            self.bm25_documents = all_docs.get("documents", [])
            self.bm25_ids = all_docs.get("ids", [])
            if self.bm25_documents:
                tokenized = [self._tokenize(doc) for doc in self.bm25_documents]
                self.bm25_index = BM25Okapi(tokenized)
                logger.info(f"BM25 index rebuilt with {len(self.bm25_documents)} documents")
        except Exception as e:
            logger.warning(f"BM25 index rebuild failed: {e}")
            self.bm25_index = None

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
            self._rebuild_bm25_index()
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

    def search(self, query: str, top_k: int = 5, filter_source: Optional[str] = None,
               use_hybrid: bool = True) -> List[Dict]:
        """Search knowledge base with hybrid vector + BM25 search."""
        try:
            where = None
            if filter_source:
                where = {"source": {"$contains": filter_source}}

            if use_hybrid and self.bm25_index:
                return self._hybrid_search(query, top_k, where)

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
                    "distance": round(dist, 4),
                    "search_type": "vector"
                })
            search_results.sort(key=lambda x: x["score"], reverse=True)
            return search_results[:top_k]
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def _hybrid_search(self, query: str, top_k: int, where: Optional[Dict]) -> List[Dict]:
        """Combine vector search and BM25 keyword search."""
        vector_results = self.collection.query(
            query_texts=[query],
            n_results=top_k * 2,
            where=where,
            include=["documents", "metadatas", "distances", "ids"]
        )

        bm25_scores = {}
        query_tokens = self._tokenize(query)
        if query_tokens and self.bm25_index:
            scores = self.bm25_index.get_scores(query_tokens)
            for i, score in enumerate(scores):
                if i < len(self.bm25_ids):
                    bm25_scores[self.bm25_ids[i]] = score

        combined = {}
        v_ids = vector_results.get("ids", [[]])[0]
        v_docs = vector_results.get("documents", [[]])[0]
        v_metas = vector_results.get("metadatas", [[]])[0]
        v_dists = vector_results.get("distances", [[]])[0]

        for i, (doc_id, doc, meta, dist) in enumerate(zip(v_ids, v_docs, v_metas, v_dists)):
            v_score = 1.0 / (1.0 + dist)
            b_score = bm25_scores.get(doc_id, 0)
            combined[doc_id] = {
                "content": doc,
                "metadata": meta,
                "vector_score": round(v_score, 4),
                "bm25_score": round(float(b_score), 4),
                "score": round(0.6 * v_score + 0.4 * b_score, 4),
                "distance": round(dist, 4),
                "search_type": "hybrid"
            }

        results = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_stats(self) -> Dict:
        """Get knowledge base statistics."""
        return {
            "total_documents": self.collection.count(),
            "embedding_model": "chroma-default",
            "chunk_size": 1000,
            "chunk_overlap": 200,
            "db_path": str(DB_PATH),
            "bm25_indexed": self.bm25_index is not None,
            "bm25_documents": len(self.bm25_documents),
            "search_mode": "hybrid"
        }

    def delete_collection(self):
        """Reset knowledge base."""
        try:
            self.client.delete_collection("knowledge_base")
            self.collection = self.client.create_collection(
                name="knowledge_base",
                metadata={"hnsw:space": "cosine"}
            )
            self.bm25_index = None
            self.bm25_documents = []
            self.bm25_ids = []
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
