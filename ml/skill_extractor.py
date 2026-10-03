"""
Skill Extraction Engine
Extracts technical and soft skills using curated taxonomy, token boundaries, and alias normalization.
"""
import os
import json
import re
from typing import Dict, List, Any, Set

class SkillExtractor:
    def __init__(self, skills_db_path: str = None):
        if skills_db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            skills_db_path = os.path.join(base_dir, "data", "skills.json")

        self.skills_db_path = skills_db_path
        self.categories: Dict[str, List[str]] = {}
        self.all_skills: List[str] = []
        self.skill_to_category: Dict[str, str] = {}
        self.aliases: Dict[str, str] = {
            "js": "JavaScript",
            "ts": "TypeScript",
            "py": "Python",
            "ml": "Machine Learning",
            "dl": "Deep Learning",
            "ai": "Artificial Intelligence",
            "nlp": "Natural Language Processing",
            "k8s": "Kubernetes",
            "postgres": "PostgreSQL",
            "mongo": "MongoDB",
            "reactjs": "React",
            "react.js": "React",
            "nextjs": "Next.js",
            "vue": "Vue.js",
            "aws ec2": "AWS",
            "sklearn": "scikit-learn",
            "tf": "TensorFlow",
            "pytorch": "PyTorch"
        }
        self.load_taxonomy()

    def load_taxonomy(self):
        """Load skills from JSON taxonomy."""
        if not os.path.exists(self.skills_db_path):
            raise FileNotFoundError(f"Skills taxonomy not found at {self.skills_db_path}")

        with open(self.skills_db_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.categories = data.get("categories", {})
        self.all_skills = []
        self.skill_to_category = {}

        for category, skills in self.categories.items():
            for skill in skills:
                self.all_skills.append(skill)
                self.skill_to_category[skill.lower()] = category

    def extract_skills(self, text: str) -> Dict[str, Any]:
        """Extract skills from text, categorize them, and compute occurrence frequency."""
        if not text:
            return {"skills": [], "by_category": {}, "total_count": 0}

        text_lower = " " + text.lower() + " "
        detected_skills: Set[str] = set()
        skill_counts: Dict[str, int] = {}

        # 1. Alias checks
        for alias, canon in self.aliases.items():
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(alias) + r'(?![a-zA-Z0-9])'
            matches = len(re.findall(pattern, text_lower))
            if matches > 0:
                detected_skills.add(canon)
                skill_counts[canon] = skill_counts.get(canon, 0) + matches

        # 2. Taxonomy skill checks
        for skill in self.all_skills:
            # Handle special symbols like C++, C#, .NET
            skill_esc = re.escape(skill.lower())
            if skill.lower() in ["c", "r"]:
                pattern = r'(?<![a-zA-Z0-9])' + skill_esc + r'(?![a-zA-Z0-9])'
            elif skill.endswith("+") or skill.endswith("#"):
                pattern = r'(?<![a-zA-Z0-9])' + skill_esc
            else:
                pattern = r'(?<![a-zA-Z0-9])' + skill_esc + r'(?![a-zA-Z0-9])'

            matches = len(re.findall(pattern, text_lower))
            if matches > 0:
                detected_skills.add(skill)
                skill_counts[skill] = skill_counts.get(skill, 0) + matches

        # Organize by category
        by_category: Dict[str, List[Dict[str, Any]]] = {}
        for skill in detected_skills:
            cat = self.skill_to_category.get(skill.lower(), "other")
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append({
                "name": skill,
                "frequency": skill_counts.get(skill, 1)
            })

        # Sort skills within category by frequency
        for cat in by_category:
            by_category[cat].sort(key=lambda x: x["frequency"], reverse=True)

        return {
            "skills": sorted(list(detected_skills)),
            "skill_counts": skill_counts,
            "by_category": by_category,
            "total_count": len(detected_skills)
        }
