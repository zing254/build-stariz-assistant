"""
System-related tools for STARIZ AI Assistant.
Provides real system information and operations.
"""

import psutil
import platform
import socket
import subprocess
import re
from typing import Dict, Any, List
from datetime import datetime, timedelta


class SystemTools:
    """Tools for system information and operations."""

    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get comprehensive system information."""
        try:
            boot_time = psutil.boot_time()
            uptime_seconds = datetime.now().timestamp() - boot_time
            uptime = str(timedelta(seconds=int(uptime_seconds)))

            return {
                "platform": platform.system(),
                "platform_release": platform.release(),
                "platform_version": platform.version(),
                "architecture": platform.machine(),
                "hostname": socket.gethostname(),
                "ip_address": socket.gethostbyname(socket.gethostname()),
                "cpu_count": psutil.cpu_count(logical=True),
                "cpu_count_physical": psutil.cpu_count(logical=False),
                "memory_total": psutil.virtual_memory().total,
                "memory_available": psutil.virtual_memory().available,
                "disk_total": psutil.disk_usage("/").total,
                "disk_free": psutil.disk_usage("/").free,
                "boot_time": datetime.fromtimestamp(boot_time).isoformat(),
                "uptime": uptime,
                "python_version": platform.python_version(),
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_cpu_info() -> Dict[str, Any]:
        """Get CPU information and usage."""
        try:
            cpu_freq = psutil.cpu_freq()
            return {
                "percent": psutil.cpu_percent(interval=0.1),
                "count": psutil.cpu_count(logical=True),
                "frequency": {
                    "current": cpu_freq.current if cpu_freq else 0,
                    "min": cpu_freq.min if cpu_freq else 0,
                    "max": cpu_freq.max if cpu_freq else 0,
                }
                if cpu_freq
                else None,
                "per_cpu": psutil.cpu_percent(interval=0.1, percpu=True),
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_memory_info() -> Dict[str, Any]:
        """Get memory information."""
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            return {
                "virtual": {
                    "total": memory.total,
                    "available": memory.available,
                    "used": memory.used,
                    "percent": memory.percent,
                },
                "swap": {
                    "total": swap.total,
                    "used": swap.used,
                    "free": swap.free,
                    "percent": swap.percent,
                },
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_disk_info() -> List[Dict[str, Any]]:
        """Get disk information for all partitions."""
        try:
            partitions = []
            for part in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(part.mountpoint)
                    partitions.append(
                        {
                            "device": part.device,
                            "mountpoint": part.mountpoint,
                            "fstype": part.fstype,
                            "total": usage.total,
                            "used": usage.used,
                            "free": usage.free,
                            "percent": usage.percent,
                        }
                    )
                except PermissionError:
                    continue
            return partitions
        except Exception as e:
            return [{"error": str(e)}]

    @staticmethod
    def get_network_info() -> Dict[str, Any]:
        """Get network information."""
        try:
            net_io = psutil.net_io_counters()
            net_connections = len(psutil.net_connections())
            net_if_addrs = psutil.net_if_addrs()

            interfaces = {}
            for interface, addrs in net_if_addrs.items():
                interfaces[interface] = [
                    {"family": addr.family.name, "address": addr.address}
                    for addr in addrs
                ]

            return {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
                "errin": net_io.errin,
                "errout": net_io.errout,
                "connections": net_connections,
                "interfaces": interfaces,
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_process_list(limit: int = 20, sort_by: str = "cpu") -> List[Dict[str, Any]]:
        """Get list of running processes."""
        try:
            processes = []
            for proc in psutil.process_iter(
                [
                    "pid",
                    "name",
                    "username",
                    "cpu_percent",
                    "memory_percent",
                    "status",
                    "create_time",
                ]
            ):
                try:
                    pinfo = proc.info
                    processes.append(
                        {
                            "pid": pinfo["pid"],
                            "name": pinfo["name"],
                            "username": pinfo["username"],
                            "cpu_percent": pinfo["cpu_percent"],
                            "memory_percent": pinfo["memory_percent"],
                            "status": pinfo["status"],
                            "running_time": (
                                datetime.now().timestamp() - pinfo["create_time"]
                                if pinfo["create_time"]
                                else 0
                            ),
                        }
                    )
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Sort processes
            if sort_by == "cpu":
                processes.sort(key=lambda x: x["cpu_percent"] or 0, reverse=True)
            elif sort_by == "memory":
                processes.sort(key=lambda x: x["memory_percent"] or 0, reverse=True)

            return processes[:limit]
        except Exception as e:
            return [{"error": str(e)}]

    @staticmethod
    def ping_host(host: str, count: int = 4) -> Dict[str, Any]:
        """Ping a host and return statistics."""
        if not re.match(r'^[a-zA-Z0-9._-]+$', host):
            return {"success": False, "error": "Invalid hostname. Only alphanumeric, dots, hyphens, and underscores allowed."}
        count = max(1, min(10, int(count)))
        try:
            result = subprocess.run(
                ["ping", "-c", str(count), host],
                capture_output=True,
                text=True,
                timeout=10,
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr if result.returncode != 0 else None,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
