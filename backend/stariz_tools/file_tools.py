"""
File operation tools for STARIZ AI Assistant.
Provides file system operations and utilities.
"""

import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import csv
import io


class FileTools:
    """Tools for file system operations."""

    ALLOWED_BASE_DIRS = [
        Path.home(),
        Path("/tmp"),
        Path("/var/tmp"),
    ]

    @classmethod
    def _validate_path(cls, path: str) -> tuple[bool, str]:
        """Validate that path is within allowed directories."""
        try:
            resolved = Path(path).resolve()
            for base in cls.ALLOWED_BASE_DIRS:
                base_resolved = base.resolve()
                # Path-prefix checks are unsafe (`/home/user2` would match
                # `/home/user`). `relative_to` enforces a directory boundary.
                try:
                    resolved.relative_to(base_resolved)
                    return True, ""
                except ValueError:
                    continue
            return False, f"Access denied: path outside allowed directories ({path})"
        except Exception as e:
            return False, f"Path validation error: {str(e)}"

    @staticmethod
    def list_directory(path: str) -> Dict[str, Any]:
        """List contents of a directory."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "Path does not exist"}
            if not p.is_dir():
                return {"success": False, "error": "Path is not a directory"}

            items = []
            for item in p.iterdir():
                try:
                    stat = item.stat()
                    items.append(
                        {
                            "name": item.name,
                            "path": str(item),
                            "is_dir": item.is_dir(),
                            "size": stat.st_size,
                            "modified": stat.st_mtime,
                            "permissions": oct(stat.st_mode)[-3:],
                        }
                    )
                except (PermissionError, OSError) as e:
                    items.append(
                        {
                            "name": item.name,
                            "path": str(item),
                            "error": str(e),
                        }
                    )

            return {
                "success": True,
                "path": str(p),
                "items": sorted(
                    items, key=lambda x: (not x.get("is_dir", False), x["name"])
                ),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def read_file(path: str, encoding: str = "utf-8") -> Dict[str, Any]:
        """Read contents of a file."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "File does not exist"}
            if not p.is_file():
                return {"success": False, "error": "Path is not a file"}

            content = p.read_text(encoding=encoding, errors="ignore")
            return {
                "success": True,
                "content": content,
                "size": p.stat().st_size,
                "encoding": encoding,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def write_file(path: str, content: str, encoding: str = "utf-8") -> Dict[str, Any]:
        """Write content to a file."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content, encoding=encoding)
            return {"success": True, "path": str(p), "size": p.stat().st_size}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_path(path: str) -> Dict[str, Any]:
        """Delete a file or directory."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "Path does not exist"}

            if p.is_dir():
                shutil.rmtree(p)
            else:
                p.unlink()

            return {"success": True, "path": str(p)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def create_directory(path: str) -> Dict[str, Any]:
        """Create a directory."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            p.mkdir(parents=True, exist_ok=True)
            return {"success": True, "path": str(p)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_file_info(path: str) -> Dict[str, Any]:
        """Get information about a file or directory."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "Path does not exist"}

            stat = p.stat()
            return {
                "success": True,
                "name": p.name,
                "path": str(p),
                "is_dir": p.is_dir(),
                "is_file": p.is_file(),
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "accessed": stat.st_atime,
                "created": stat.st_ctime,
                "permissions": oct(stat.st_mode)[-3:],
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def read_json(path: str) -> Dict[str, Any]:
        """Read and parse a JSON file."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "File does not exist"}

            content = p.read_text(encoding="utf-8")
            data = json.loads(content)
            return {"success": True, "data": data}
        except json.JSONDecodeError as e:
            return {"success": False, "error": f"Invalid JSON: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def write_json(path: str, data: Any, indent: int = 2) -> Dict[str, Any]:
        """Write data to a JSON file."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            p.parent.mkdir(parents=True, exist_ok=True)
            content = json.dumps(data, indent=indent, ensure_ascii=False)
            p.write_text(content, encoding="utf-8")
            return {"success": True, "path": str(p)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def read_csv(path: str) -> Dict[str, Any]:
        """Read a CSV file."""
        try:
            valid, msg = FileTools._validate_path(path)
            if not valid:
                return {"success": False, "error": msg}
            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "File does not exist"}

            rows = []
            with p.open("r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rows.append(dict(row))

            return {"success": True, "rows": rows, "count": len(rows)}
        except Exception as e:
            return {"success": False, "error": str(e)}
