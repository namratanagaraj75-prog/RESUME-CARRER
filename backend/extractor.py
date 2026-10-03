"""
Resume Document Extractor
Extracts raw text from PDF and TXT documents using pypdf.
"""
import io
from typing import Dict, Any
from pypdf import PdfReader

class ResumeExtractor:
    @staticmethod
    def extract_from_bytes(file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Extract text and metadata from uploaded file bytes."""
        text = ""
        page_count = 0
        file_ext = filename.split(".")[-1].lower() if "." in filename else ""

        if file_ext == "pdf":
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                page_count = len(reader.pages)
                pages_text = []
                for i, page in enumerate(reader.pages):
                    extracted = page.extract_text() or ""
                    pages_text.append(extracted)
                text = "\n\n".join(pages_text)
            except Exception as e:
                raise ValueError(f"Failed to extract PDF text: {str(e)}")
        elif file_ext in ["txt", "md", "json"]:
            try:
                text = file_bytes.decode("utf-8", errors="replace")
                page_count = 1
            except Exception as e:
                raise ValueError(f"Failed to decode text file: {str(e)}")
        else:
            raise ValueError(f"Unsupported file format: .{file_ext}. Please upload a PDF or TXT file.")

        cleaned_sample = text.strip()
        if len(cleaned_sample) < 15:
            raise ValueError("Extracted text is empty or too short. Please upload a valid resume.")

        return {
            "text": text,
            "filename": filename,
            "file_size": len(file_bytes),
            "page_count": page_count,
            "char_count": len(text)
        }
