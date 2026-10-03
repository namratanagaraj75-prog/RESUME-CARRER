"""
Resume Text Preprocessor Module
Handles raw text normalization, regex cleaning, section segmentation, and contact extraction.
"""
import re
from typing import Dict, Any, List

class ResumePreprocessor:
    def __init__(self):
        self.email_pattern = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
        self.phone_pattern = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
        self.url_pattern = re.compile(r'(https?://[^\s]+|linkedin\.com/in/[a-zA-Z0-9-_]+|github\.com/[a-zA-Z0-9-_]+)')

        self.section_headers = {
            "summary": ["summary", "professional summary", "profile", "about me", "objective", "career objective"],
            "education": ["education", "academic background", "qualifications", "academic history"],
            "experience": ["experience", "work experience", "employment", "professional experience", "internships"],
            "skills": ["skills", "technical skills", "core competencies", "technologies", "skill set"],
            "projects": ["projects", "personal projects", "academic projects", "key projects"],
            "certifications": ["certifications", "licenses", "courses", "certificates"]
        }

    def clean_text(self, text: str) -> str:
        """Normalize whitespaces, tabs, and non-printable characters."""
        if not text:
            return ""
        # Replace non-breaking spaces and tabs
        text = text.replace('\xa0', ' ').replace('\t', ' ')
        # Normalize newlines
        text = re.sub(r'\r\n|\r', '\n', text)
        # Collapse excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    def extract_contact_info(self, text: str) -> Dict[str, Any]:
        """Extract email, phone, links, and approximate name."""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        name = lines[0] if lines else "Candidate"
        # If the first line is very long, it might not be a name
        if len(name) > 40:
            name = name[:40]

        emails = self.email_pattern.findall(text)
        phones = self.phone_pattern.findall(text)
        links = self.url_pattern.findall(text)

        return {
            "name": name,
            "email": emails[0] if emails else None,
            "phone": phones[0] if phones else None,
            "links": list(set(links))
        }

    def segment_sections(self, text: str) -> Dict[str, str]:
        """Split resume into semantic sections based on standard headings."""
        lines = text.split('\n')
        sections: Dict[str, List[str]] = {
            "summary": [],
            "education": [],
            "experience": [],
            "skills": [],
            "projects": [],
            "certifications": [],
            "other": []
        }

        current_section = "other"

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Check if this line is a header
            clean_line = re.sub(r'[^a-zA-Z\s]', '', stripped).strip().lower()
            matched_header = None
            if len(clean_line.split()) <= 4:
                for sec_name, keywords in self.section_headers.items():
                    if clean_line in keywords or any(clean_line.startswith(kw) for kw in keywords):
                        matched_header = sec_name
                        break

            if matched_header:
                current_section = matched_header
            else:
                sections[current_section].append(stripped)

        return {sec: "\n".join(content) for sec, content in sections.items()}

    def preprocess(self, raw_text: str) -> Dict[str, Any]:
        """Full preprocessing pipeline returning clean text, contact info, and sections."""
        cleaned = self.clean_text(raw_text)
        contacts = self.extract_contact_info(cleaned)
        sections = self.segment_sections(cleaned)

        return {
            "cleaned_text": cleaned,
            "contact_info": contacts,
            "sections": sections,
            "character_count": len(cleaned),
            "word_count": len(cleaned.split()),
            "line_count": len(cleaned.splitlines())
        }
