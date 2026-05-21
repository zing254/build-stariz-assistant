"""
Comprehensive tests for STARIZ AI Backend tools.
"""
import pytest
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from stariz_tools.system_tools import SystemTools
from stariz_tools.file_tools import FileTools
from stariz_tools.data_tools import DataTools
from stariz_tools.command_router import CommandRouter


class TestSystemTools:
    def test_get_system_info(self):
        info = SystemTools.get_system_info()
        assert "platform" in info
        assert "hostname" in info
        assert "cpu_count" in info
        assert "memory_total" in info

    def test_get_cpu_info(self):
        cpu = SystemTools.get_cpu_info()
        assert "percent" in cpu
        assert "count" in cpu
        assert cpu["percent"] >= 0
        assert cpu["percent"] <= 100

    def test_get_memory_info(self):
        mem = SystemTools.get_memory_info()
        assert "virtual" in mem
        assert "swap" in mem
        assert mem["virtual"]["percent"] >= 0

    def test_get_disk_info(self):
        disk = SystemTools.get_disk_info()
        assert isinstance(disk, list)
        assert len(disk) > 0
        assert "mountpoint" in disk[0]

    def test_get_network_info(self):
        net = SystemTools.get_network_info()
        assert "bytes_sent" in net
        assert "bytes_recv" in net

    def test_get_process_list(self):
        procs = SystemTools.get_process_list(limit=10)
        assert isinstance(procs, list)
        assert len(procs) <= 10
        if procs:
            assert "pid" in procs[0]
            assert "name" in procs[0]


class TestFileTools:
    def test_list_directory(self):
        result = FileTools.list_directory("/tmp")
        assert result["success"] is True
        assert "items" in result

    def test_list_nonexistent_directory(self):
        result = FileTools.list_directory("/nonexistent_path_xyz")
        assert result["success"] is False
        assert "error" in result

    def test_read_write_file(self):
        test_path = "/tmp/stariz_test_file.txt"
        test_content = "Hello STARIZ v2.5.0"

        write_result = FileTools.write_file(test_path, test_content)
        assert write_result["success"] is True

        read_result = FileTools.read_file(test_path)
        assert read_result["success"] is True
        assert test_content in read_result["content"]

        # Cleanup
        FileTools.delete_path(test_path)

    def test_create_delete_directory(self):
        test_path = "/tmp/stariz_test_dir"

        create_result = FileTools.create_directory(test_path)
        assert create_result["success"] is True

        info_result = FileTools.get_file_info(test_path)
        assert info_result["success"] is True
        assert info_result["is_dir"] is True

        delete_result = FileTools.delete_path(test_path)
        assert delete_result["success"] is True

    def test_read_nonexistent_file(self):
        result = FileTools.read_file("/nonexistent_file_xyz.txt")
        assert result["success"] is False

    def test_json_operations(self):
        test_path = "/tmp/stariz_test.json"
        test_data = {"name": "STARIZ", "version": "2.5.0", "creator": "Zingri_Master"}

        write_result = FileTools.write_json(test_path, test_data)
        assert write_result["success"] is True

        read_result = FileTools.read_json(test_path)
        assert read_result["success"] is True
        assert read_result["data"]["name"] == "STARIZ"
        assert read_result["data"]["creator"] == "Zingri_Master"

        FileTools.delete_path(test_path)


class TestDataTools:
    def test_analyze_data(self):
        data = [10, 20, 30, 40, 50]
        result = DataTools.analyze_data(data, "summary")
        assert result["success"] is True
        assert result["mean"] == 30.0
        assert result["min"] == 10.0
        assert result["max"] == 50.0

    def test_calculate_statistics(self):
        numbers = [1, 2, 3, 4, 5]
        result = DataTools.calculate_statistics(numbers)
        assert result["success"] is True
        assert result["count"] == 5
        assert result["sum"] == 15.0
        assert result["mean"] == 3.0

    def test_generate_chart_data(self):
        data = [10, 20, 30, 40, 50]
        result = DataTools.generate_chart_data(data, "line")
        assert result["success"] is True
        assert result["type"] == "line"
        assert len(result["datasets"][0]["data"]) == 5

    def test_process_csv(self):
        csv_content = "name,age\nAlice,30\nBob,25"
        result = DataTools.process_csv_data(csv_content, "head")
        assert result["success"] is True
        assert result["shape"] == (2, 2)


class TestCommandRouter:
    def test_system_time_command(self):
        route = CommandRouter.route_command("What time is it?")
        assert route["type"] == "system"
        assert route["command"] == "time"

    def test_system_date_command(self):
        route = CommandRouter.route_command("What's today's date?")
        assert route["type"] == "system"
        assert route["command"] == "date"

    def test_system_clear_command(self):
        route = CommandRouter.route_command("Clear chat")
        assert route["type"] == "system"
        assert route["command"] == "clear"

    def test_system_help_command(self):
        route = CommandRouter.route_command("Help me")
        assert route["type"] == "system"
        assert route["command"] == "help"

    def test_system_creator_command(self):
        route = CommandRouter.route_command("Who created you?")
        assert route["type"] == "system"
        assert route["command"] == "creator"

    def test_widget_terminal_command(self):
        route = CommandRouter.route_command("Open terminal")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "terminal"

    def test_widget_system_command(self):
        route = CommandRouter.route_command("Show system stats")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "system"

    def test_widget_files_command(self):
        route = CommandRouter.route_command("Browse my files")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "files"

    def test_widget_crypto_command(self):
        route = CommandRouter.route_command("Check bitcoin price")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "crypto"

    def test_widget_weather_command(self):
        route = CommandRouter.route_command("What's the weather?")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "dashboard"

    def test_widget_voice_command(self):
        route = CommandRouter.route_command("Open voice assistant")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "voice"

    def test_widget_knowledge_command(self):
        route = CommandRouter.route_command("Search my knowledge base")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "knowledge"

    def test_widget_memory_command(self):
        route = CommandRouter.route_command("Show my memories")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "memory"

    def test_widget_agent_command(self):
        route = CommandRouter.route_command("Run agent task")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "agent"

    def test_widget_godmode_command(self):
        route = CommandRouter.route_command("Open godmode")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "chat"

    def test_ai_fallback(self):
        route = CommandRouter.route_command("Tell me about quantum physics")
        assert route["type"] == "ai"
        assert route["navigate_to"] is None

    def test_navigation_prefix(self):
        route = CommandRouter.route_command("Go to the calendar")
        assert route["type"] == "widget"
        assert route["navigate_to"] == "calendar"

    def test_execute_time(self):
        result = CommandRouter.execute_system_command("time")
        assert "current time" in result.lower()

    def test_execute_date(self):
        result = CommandRouter.execute_system_command("date")
        assert "today" in result.lower() or datetime.now().strftime("%Y") in result

    def test_execute_clear(self):
        result = CommandRouter.execute_system_command("clear")
        assert "cleared" in result.lower()

    def test_execute_creator(self):
        result = CommandRouter.execute_system_command("creator")
        assert "Zingri_Master" in result

    def test_parameter_extraction(self):
        route = CommandRouter.route_command("Ping google.com")
        assert route["type"] == "system" or route["type"] == "ai"
        params = route.get("params", {})
        assert "host" in params or "google" in route.get("command", "")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
