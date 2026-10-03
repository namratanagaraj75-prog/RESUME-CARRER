"""
Skill Gap Analysis Engine
Analyzes skill disparities between candidate profile and target roles, calculating priority learning order and actionable next steps.
"""
from typing import Dict, List, Any

class SkillGapAnalyzer:
    def __init__(self):
        # General foundational dependencies
        self.foundations = {
            "Machine Learning": ["Python", "NumPy", "Pandas"],
            "Deep Learning": ["Machine Learning", "Python", "NumPy"],
            "PyTorch": ["Python", "NumPy", "Deep Learning"],
            "TensorFlow": ["Python", "NumPy", "Deep Learning"],
            "LangChain": ["Python", "LLM", "REST API"],
            "LangGraph": ["LangChain", "Python"],
            "RAG": ["Vector Databases", "LLM", "Python"],
            "React": ["JavaScript", "HTML", "CSS"],
            "Next.js": ["React", "JavaScript", "TypeScript"],
            "TypeScript": ["JavaScript"],
            "FastAPI": ["Python", "REST API"],
            "Docker": ["Linux", "Git"],
            "Kubernetes": ["Docker", "Linux"],
            "CI/CD": ["Git", "GitHub Actions"]
        }

    def analyze_gap(self, candidate_skills: List[str], target_role: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates gap between candidate skills and target role requirements.
        Determines critical, high, and medium learning priorities.
        """
        candidate_skills_lower = {s.lower() for s in candidate_skills}

        req_skills = target_role.get("required_skills", [])
        pref_skills = target_role.get("preferred_skills", [])
        learning_order = target_role.get("learning_priority_order", [])

        matched_required = [s for s in req_skills if s.lower() in candidate_skills_lower]
        missing_required = [s for s in req_skills if s.lower() not in candidate_skills_lower]

        matched_preferred = [s for s in pref_skills if s.lower() in candidate_skills_lower]
        missing_preferred = [s for s in pref_skills if s.lower() not in candidate_skills_lower]

        # Prioritize missing skills:
        # Priority 1: Critical (Missing required skills that are early in the learning order)
        # Priority 2: High (Remaining missing required skills)
        # Priority 3: Medium (Missing preferred skills)
        prioritized_learning: List[Dict[str, Any]] = []

        # Check required missing against learning priority order
        order_dict = {s.lower(): idx for idx, s in enumerate(learning_order)}

        sorted_missing_req = sorted(
            missing_required,
            key=lambda s: order_dict.get(s.lower(), 99)
        )

        for skill in sorted_missing_req:
            prereqs = self.foundations.get(skill, [])
            missing_prereqs = [p for p in prereqs if p.lower() not in candidate_skills_lower]
            prioritized_learning.append({
                "skill": skill,
                "importance": "Critical (Required Skill)",
                "priority_level": 1,
                "missing_prerequisites": missing_prereqs,
                "reason": f"Listed as a required skill in the {target_role.get('title')} template and not detected in the resume text."
            })

        for skill in missing_preferred:
            prioritized_learning.append({
                "skill": skill,
                "importance": "Secondary (Preferred Skill)",
                "priority_level": 2,
                "missing_prerequisites": [],
                "reason": f"Listed as a preferred skill in the {target_role.get('title')} template and not detected in the resume text."
            })

        # Calculate metrics
        total_req = len(req_skills) if req_skills else 1
        req_match_rate = round((len(matched_required) / total_req) * 100, 1)

        total_all = len(req_skills) + len(pref_skills)
        total_matched = len(matched_required) + len(matched_preferred)
        overall_readiness = round((total_matched / total_all * 100), 1) if total_all > 0 else 0.0

        # Suggested actionable next steps
        actionable_steps = []
        if missing_required:
            actionable_steps.append(f"Focus immediate study on: {', '.join(sorted_missing_req[:3])}.")
            actionable_steps.append("Build one focused portfolio project implementing these critical missing skills.")
        if missing_preferred:
            actionable_steps.append(f"Add elective breadth with: {', '.join(missing_preferred[:2])}.")
        actionable_steps.append("Use role-relevant terms only where they describe work you have done; include numbers only when you can substantiate them.")

        return {
            "target_role_title": target_role.get("title"),
            "target_role_id": target_role.get("id") or target_role.get("role_id"),
            "existing_skills": sorted(list(candidate_skills)),
            "matched_required": matched_required,
            "missing_required": missing_required,
            "matched_preferred": matched_preferred,
            "missing_preferred": missing_preferred,
            "required_match_rate": req_match_rate,
            "overall_readiness_score": overall_readiness,
            "prioritized_learning": prioritized_learning,
            "actionable_steps": actionable_steps
        }
