import unittest
import json
import os
import tempfile
from pathlib import Path
from datetime import datetime, date


class TestLogManager(unittest.TestCase):
    def setUp(self):
        # Import log_manager with a temp log directory
        import importlib.util
        import sys

        # Create a temporary directory for logs
        self.tmpdir = tempfile.mkdtemp()

        # Load log_manager module with patched LOG_DIR
        spec = importlib.util.spec_from_file_location(
            "log_manager_test",
            os.path.join(os.path.dirname(__file__), "stariz_tools", "log_manager.py"),
        )
        self.mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.mod)
        self.mod.LOG_DIR = Path(self.tmpdir)

    def tearDown(self):
        # Clean up temp files
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_log_event_writes_file(self):
        entry = self.mod.log_event("system", "test", "hello world")
        self.assertEqual(entry["source"], "system")
        self.assertEqual(entry["type"], "test")
        self.assertEqual(entry["message"], "hello world")

        # Verify file was created
        today = date.today().isoformat()
        log_file = Path(self.tmpdir) / f"system_{today}.jsonl"
        self.assertTrue(log_file.exists())

    def test_log_event_invalid_source(self):
        with self.assertRaises(AssertionError):
            self.mod.log_event("invalid_source", "test", "message")

    def test_log_event_all_sources(self):
        for source in self.mod.LOG_SOURCES:
            entry = self.mod.log_event(source, "init", f"{source} started")
            self.assertEqual(entry["source"], source)

    def test_query_logs_empty(self):
        result = self.mod.query_logs()
        self.assertEqual(result["entries"], [])
        self.assertEqual(result["total"], 0)

    def test_query_logs_with_entries(self):
        self.mod.log_event("ai", "chat", "Hello")
        self.mod.log_event("system", "cpu", "High usage")
        self.mod.log_event("ai", "chat", "How are you?")

        result = self.mod.query_logs()
        self.assertEqual(result["total"], 3)

        # Filter by source
        ai_result = self.mod.query_logs(source="ai")
        self.assertEqual(ai_result["total"], 2)

        system_result = self.mod.query_logs(source="system")
        self.assertEqual(system_result["total"], 1)

    def test_query_logs_pagination(self):
        for i in range(10):
            self.mod.log_event("system", "test", f"Message {i}")

        result = self.mod.query_logs(limit=3)
        self.assertEqual(len(result["entries"]), 3)
        self.assertEqual(result["total"], 10)
        self.assertEqual(result["limit"], 3)

        result2 = self.mod.query_logs(limit=3, offset=3)
        self.assertEqual(len(result2["entries"]), 3)
        self.assertEqual(result2["offset"], 3)

    def test_get_log_stats(self):
        self.mod.log_event("ai", "chat", "Hello", level="info")
        self.mod.log_event("system", "warning", "High CPU", level="warning")
        self.mod.log_event("voice", "error", "Failed", level="error")

        stats = self.mod.get_log_stats()
        self.assertEqual(stats["total_entries"], 3)
        self.assertEqual(stats["levels"]["info"], 1)
        self.assertEqual(stats["levels"]["warning"], 1)
        self.assertEqual(stats["levels"]["error"], 1)
        self.assertIn("ai", stats["sources"])
        self.assertIn("system", stats["sources"])
        self.assertIn("voice", stats["sources"])

    def test_get_log_sources(self):
        self.mod.log_event("ai", "chat", "Hello")
        sources = self.mod.get_log_sources()
        self.assertIn("ai", sources["sources"])
        self.assertEqual(sources["sources"]["ai"], 1)

    def test_clear_logs(self):
        self.mod.log_event("ai", "chat", "Hello")
        self.mod.log_event("system", "cpu", "High")

        result = self.mod.clear_logs()
        self.assertEqual(result["deleted_files"], 2)

        stats = self.mod.get_log_stats()
        self.assertEqual(stats["total_entries"], 0)

    def test_clear_logs_by_source(self):
        self.mod.log_event("ai", "chat", "Hello")
        self.mod.log_event("system", "cpu", "High")

        result = self.mod.clear_logs(source="ai")
        self.assertEqual(result["deleted_files"], 1)

        stats = self.mod.get_log_stats()
        self.assertEqual(stats["total_entries"], 1)

    def test_log_event_with_metadata(self):
        entry = self.mod.log_event(
            "agent", "task", "Processing", metadata={"task_id": 42, "duration": 1.5}
        )
        self.assertEqual(entry["metadata"]["task_id"], 42)
        self.assertEqual(entry["metadata"]["duration"], 1.5)

    def test_query_logs_filter_by_level(self):
        self.mod.log_event("ai", "chat", "Info", level="info")
        self.mod.log_event("ai", "chat", "Warning", level="warning")
        self.mod.log_event("ai", "chat", "Error", level="error")

        error_result = self.mod.query_logs(level="error")
        self.assertEqual(error_result["total"], 1)

        info_result = self.mod.query_logs(level="info")
        self.assertEqual(info_result["total"], 1)

    def test_get_log_files(self):
        self.mod.log_event("ai", "chat", "Hello")
        files = self.mod.get_log_files()
        self.assertEqual(len(files["files"]), 1)
        self.assertIn("ai_", files["files"][0]["name"])


if __name__ == "__main__":
    unittest.main()
