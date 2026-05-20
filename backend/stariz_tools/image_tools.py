"""
Image processing tools for STARIZ AI Assistant.
Provides image manipulation and analysis capabilities using Pillow.
"""

from typing import Dict, Any, Optional, Tuple
from pathlib import Path
import io
import base64


class ImageTools:
    """Tools for image processing operations."""

    @staticmethod
    def get_image_info(path: str) -> Dict[str, Any]:
        """Get information about an image file."""
        try:
            from PIL import Image

            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "File does not exist"}

            with Image.open(p) as img:
                return {
                    "success": True,
                    "format": img.format,
                    "mode": img.mode,
                    "size": {"width": img.width, "height": img.height},
                    "palette": img.palette.mode if img.palette else None,
                    "animated": getattr(img, "is_animated", False),
                    "n_frames": getattr(img, "n_frames", 1),
                }
        except ImportError:
            return {"success": False, "error": "Pillow library not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def resize_image(
        input_path: str,
        output_path: str,
        width: int,
        height: int,
        maintain_aspect: bool = True,
    ) -> Dict[str, Any]:
        """Resize an image."""
        try:
            from PIL import Image

            with Image.open(input_path) as img:
                if maintain_aspect:
                    img.thumbnail((width, height))
                else:
                    img = img.resize((width, height))

                output = Path(output_path)
                output.parent.mkdir(parents=True, exist_ok=True)
                img.save(output)

                return {
                    "success": True,
                    "input_path": input_path,
                    "output_path": output_path,
                    "original_size": {"width": img.width, "height": img.height},
                    "new_size": {"width": width, "height": height},
                }
        except ImportError:
            return {"success": False, "error": "Pillow library not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def convert_image_format(
        input_path: str,
        output_path: str,
        output_format: str = "PNG",
    ) -> Dict[str, Any]:
        """Convert image to a different format."""
        try:
            from PIL import Image

            with Image.open(input_path) as img:
                # Handle transparency for JPEG
                if output_format.upper() in ["JPEG", "JPG"] and img.mode == "RGBA":
                    img = img.convert("RGB")

                output = Path(output_path)
                output.parent.mkdir(parents=True, exist_ok=True)
                img.save(output, format=output_format)

                return {
                    "success": True,
                    "input_path": input_path,
                    "output_path": output_path,
                    "input_format": img.format,
                    "output_format": output_format,
                }
        except ImportError:
            return {"success": False, "error": "Pillow library not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def create_thumbnail(
        input_path: str,
        output_path: str,
        size: Tuple[int, int] = (128, 128),
    ) -> Dict[str, Any]:
        """Create a thumbnail of an image."""
        try:
            from PIL import Image

            with Image.open(input_path) as img:
                img.thumbnail(size)
                output = Path(output_path)
                output.parent.mkdir(parents=True, exist_ok=True)
                img.save(output)

                return {
                    "success": True,
                    "input_path": input_path,
                    "output_path": output_path,
                    "thumbnail_size": {"width": img.width, "height": img.height},
                }
        except ImportError:
            return {"success": False, "error": "Pillow library not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def apply_filter(
        input_path: str,
        output_path: str,
        filter_type: str = "grayscale",
    ) -> Dict[str, Any]:
        """Apply a filter to an image."""
        try:
            from PIL import Image, ImageFilter, ImageEnhance

            with Image.open(input_path) as img:
                if filter_type == "grayscale":
                    img = img.convert("L").convert("RGB")
                elif filter_type == "blur":
                    img = img.filter(ImageFilter.BLUR)
                elif filter_type == "sharpen":
                    img = img.filter(ImageFilter.SHARPEN)
                elif filter_type == "edge":
                    img = img.filter(ImageFilter.FIND_EDGES)
                elif filter_type == "contour":
                    img = img.filter(ImageFilter.CONTOUR)
                elif filter_type == "brightness":
                    enhancer = ImageEnhance.Brightness(img)
                    img = enhancer.enhance(1.5)
                elif filter_type == "contrast":
                    enhancer = ImageEnhance.Contrast(img)
                    img = enhancer.enhance(1.5)
                else:
                    return {
                        "success": False,
                        "error": f"Unknown filter type: {filter_type}",
                    }

                output = Path(output_path)
                output.parent.mkdir(parents=True, exist_ok=True)
                img.save(output)

                return {
                    "success": True,
                    "input_path": input_path,
                    "output_path": output_path,
                    "filter": filter_type,
                }
        except ImportError:
            return {"success": False, "error": "Pillow library not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def image_to_base64(path: str) -> Dict[str, Any]:
        """Convert an image to base64 encoding."""
        try:
            p = Path(path)
            if not p.exists():
                return {"success": False, "error": "File does not exist"}

            with p.open("rb") as f:
                image_data = f.read()
                base64_encoded = base64.b64encode(image_data).decode("utf-8")

                return {
                    "success": True,
                    "data": base64_encoded,
                    "mime_type": f"image/{p.suffix[1:]}",
                    "size": len(image_data),
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
