"""
Data analysis tools for STARIZ AI Assistant.
Provides data processing and analysis capabilities using NumPy and Pandas.
"""

from typing import Dict, Any, List, Optional
import json


class DataTools:
    """Tools for data analysis operations."""

    @staticmethod
    def analyze_data(data: List[Any], operation: str = "summary") -> Dict[str, Any]:
        """Analyze a dataset."""
        try:
            import numpy as np
            import pandas as pd

            # Convert to numpy array for analysis
            if isinstance(data[0], (int, float)) if data else False:
                arr = np.array(data)
                if operation == "summary":
                    return {
                        "success": True,
                        "count": len(arr),
                        "mean": float(np.mean(arr)),
                        "median": float(np.median(arr)),
                        "std": float(np.std(arr)),
                        "min": float(np.min(arr)),
                        "max": float(np.max(arr)),
                        "sum": float(np.sum(arr)),
                    }
                elif operation == "histogram":
                    hist, bins = np.histogram(arr, bins=10)
                    return {
                        "success": True,
                        "histogram": hist.tolist(),
                        "bins": bins.tolist(),
                    }
            else:
                # Try with pandas for mixed data
                df = pd.DataFrame(
                    data if isinstance(data[0], dict) else [{"value": d} for d in data]
                )

                if operation == "summary":
                    numeric_cols = df.select_dtypes(include=[np.number]).columns
                    return {
                        "success": True,
                        "rows": len(df),
                        "columns": len(df.columns),
                        "numeric_summary": {
                            col: {
                                "mean": float(df[col].mean()),
                                "std": float(df[col].std()),
                                "min": float(df[col].min()),
                                "max": float(df[col].max()),
                            }
                            for col in numeric_cols
                        }
                        if len(numeric_cols) > 0
                        else {},
                    }

            return {"success": False, "error": "Unsupported data type or operation"}
        except ImportError:
            return {"success": False, "error": "NumPy or Pandas not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def process_csv_data(csv_content: str, operation: str = "head") -> Dict[str, Any]:
        """Process CSV data."""
        try:
            import pandas as pd
            from io import StringIO

            df = pd.read_csv(StringIO(csv_content))

            if operation == "head":
                return {
                    "success": True,
                    "data": df.head().to_dict(orient="records"),
                    "shape": df.shape,
                }
            elif operation == "describe":
                return {
                    "success": True,
                    "statistics": df.describe().to_dict(),
                    "shape": df.shape,
                }
            elif operation == "info":
                return {
                    "success": True,
                    "columns": [
                        {
                            "name": col,
                            "dtype": str(df[col].dtype),
                            "non_null": int(df[col].notna().sum()),
                            "null": int(df[col].isna().sum()),
                        }
                        for col in df.columns
                    ],
                    "shape": df.shape,
                }

            return {"success": False, "error": f"Unknown operation: {operation}"}
        except ImportError:
            return {"success": False, "error": "Pandas not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def generate_chart_data(
        data: List[float],
        chart_type: str = "line",
        labels: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Generate chart data for visualization."""
        try:
            import numpy as np

            if chart_type == "line":
                return {
                    "success": True,
                    "type": "line",
                    "labels": labels or [str(i) for i in range(len(data))],
                    "datasets": [
                        {
                            "data": data,
                            "borderColor": "rgb(0, 240, 255)",
                            "backgroundColor": "rgba(0, 240, 255, 0.1)",
                        }
                    ],
                }
            elif chart_type == "bar":
                return {
                    "success": True,
                    "type": "bar",
                    "labels": labels or [str(i) for i in range(len(data))],
                    "datasets": [
                        {
                            "data": data,
                            "backgroundColor": "rgba(0, 240, 255, 0.6)",
                        }
                    ],
                }
            elif chart_type == "pie":
                return {
                    "success": True,
                    "type": "pie",
                    "labels": labels or [str(i) for i in range(len(data))],
                    "datasets": [{"data": data}],
                }

            return {"success": False, "error": f"Unknown chart type: {chart_type}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def calculate_statistics(numbers: List[float]) -> Dict[str, Any]:
        """Calculate comprehensive statistics for a list of numbers."""
        try:
            import numpy as np
            import statistics

            arr = np.array(numbers)

            return {
                "success": True,
                "count": len(numbers),
                "sum": float(np.sum(arr)),
                "mean": float(np.mean(arr)),
                "median": float(np.median(arr)),
                "mode": statistics.mode(numbers) if len(numbers) > 0 else None,
                "std": float(np.std(arr)),
                "variance": float(np.var(arr)),
                "min": float(np.min(arr)),
                "max": float(np.max(arr)),
                "range": float(np.ptp(arr)),
                "q1": float(np.percentile(arr, 25)),
                "q3": float(np.percentile(arr, 75)),
                "iqr": float(np.percentile(arr, 75) - np.percentile(arr, 25)),
            }
        except ImportError:
            return {
                "success": False,
                "error": "NumPy or statistics module not available",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
