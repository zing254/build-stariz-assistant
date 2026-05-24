import json
import os
from pathlib import Path
from datetime import datetime, date
from typing import Optional, Dict, Any, List

LOG_DIR = Path(__file__).parent.parent / "data" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_SOURCES = ["ai", "system", "dashboard", "voice", "rag", "memory", "agent"]

def _get_log_file(source: str) -> Path:
    date_str = date.today().isoformat()
    return LOG_DIR / f"{source}_{date_str}.jsonl"

def log_event(
    source: str,
    event_type: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None,
    level: str = "info",
) -> Dict[str, Any]:
    assert source in LOG_SOURCES, f"Invalid log source: {source}"
    assert level in ("debug", "info", "warning", "error"), f"Invalid level: {level}"
    entry = {
        "timestamp": datetime.now().isoformat(),
        "source": source,
        "type": event_type,
        "level": level,
        "message": message,
        "metadata": metadata or {},
    }
    log_file = _get_log_file(source)
    with open(log_file, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry

def query_logs(
    source: Optional[str] = None,
    level: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    since: Optional[str] = None,
) -> Dict[str, Any]:
    entries: List[Dict[str, Any]] = []
    sources_to_search = [source] if source else LOG_SOURCES

    for src in sources_to_search:
        log_dir = Path(LOG_DIR)
        if not log_dir.exists():
            continue
        for log_file in sorted(log_dir.glob(f"{src}_*.jsonl"), reverse=True):
            if not log_file.exists():
                continue
            with open(log_file) as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if level and entry.get("level") != level:
                        continue
                    if event_type and entry.get("type") != event_type:
                        continue
                    if since and entry.get("timestamp", "") < since:
                        continue
                    entries.append(entry)

    entries.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
    total = len(entries)
    paginated = entries[offset:offset + limit]

    return {
        "entries": paginated,
        "total": total,
        "offset": offset,
        "limit": limit,
    }

def get_log_sources() -> Dict[str, Any]:
    sources: Dict[str, int] = {}
    log_dir = Path(LOG_DIR)
    if not log_dir.exists():
        return {"sources": {}}
    for log_file in log_dir.glob("*.jsonl"):
        parts = log_file.stem.split("_")
        src = parts[0]
        count = 0
        try:
            with open(log_file) as f:
                for line in f:
                    if line.strip():
                        count += 1
        except Exception:
            pass
        if src in LOG_SOURCES:
            sources[src] = sources.get(src, 0) + count
    return {"sources": sources}

def get_log_stats() -> Dict[str, Any]:
    total_entries = 0
    source_counts: Dict[str, int] = {}
    level_counts: Dict[str, int] = {"debug": 0, "info": 0, "warning": 0, "error": 0}
    today_count = 0
    today = date.today().isoformat()

    log_dir = Path(LOG_DIR)
    if not log_dir.exists():
        return {"total_entries": 0, "sources": {}, "levels": {}, "today": 0}

    for log_file in log_dir.glob("*.jsonl"):
        src = log_file.stem.split("_")[0]
        if src not in LOG_SOURCES:
            continue
        count = 0
        try:
            with open(log_file) as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        count += 1
                        lvl = entry.get("level", "info")
                        if lvl in level_counts:
                            level_counts[lvl] += 1
                        if entry.get("timestamp", "").startswith(today):
                            today_count += 1
                    except json.JSONDecodeError:
                        pass
        except Exception:
            pass
        source_counts[src] = source_counts.get(src, 0) + count
        total_entries += count

    return {
        "total_entries": total_entries,
        "sources": source_counts,
        "levels": level_counts,
        "today": today_count,
    }

def clear_logs(source: Optional[str] = None) -> Dict[str, Any]:
    deleted = 0
    sources_to_clear = [source] if source else LOG_SOURCES
    for src in sources_to_clear:
        for log_file in Path(LOG_DIR).glob(f"{src}_*.jsonl"):
            try:
                log_file.unlink()
                deleted += 1
            except Exception:
                pass
    return {"deleted_files": deleted}

def get_log_files() -> Dict[str, Any]:
    files = []
    log_dir = Path(LOG_DIR)
    if not log_dir.exists():
        return {"files": []}
    for log_file in sorted(log_dir.glob("*.jsonl"), reverse=True):
        files.append({
            "name": log_file.name,
            "size": log_file.stat().st_size,
            "modified": datetime.fromtimestamp(log_file.stat().st_mtime).isoformat(),
        })
    return {"files": files}
