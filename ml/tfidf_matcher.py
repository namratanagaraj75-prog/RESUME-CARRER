"""
TF-IDF & Cosine Similarity Career Matching Engine
Uses scikit-learn TfidfVectorizer and cosine_similarity to mathematically rank career alignment.
"""
import os
import json
import numpy as np
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class CareerMatcher:
    def __init__(self, roles_db_path: str = None):
        if roles_db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            roles_db_path = os.path.join(base_dir, "data", "career_roles.json")

        self.roles_db_path = roles_db_path
        self.roles: List[Dict[str, Any]] = []
        self.load_roles()

    def load_roles(self):
        """Load career roles from JSON file."""
        if not os.path.exists(self.roles_db_path):
            raise FileNotFoundError(f"Roles file not found at {self.roles_db_path}")

        with open(self.roles_db_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.roles = data.get("roles", [])

    def _build_role_corpus_text(self, role: Dict[str, Any]) -> str:
        """Construct synthetic corpus text for a role combining description, required & preferred skills."""
        title = role.get("title", "")
        desc = role.get("description", "")
        # Required skills are given double weight by repeating in the corpus
        req_skills = " ".join(role.get("required_skills", []) * 2)
        pref_skills = " ".join(role.get("preferred_skills", []))
        return f"{title} {desc} {req_skills} {pref_skills}".lower()

    def match_career(self, resume_text: str, extracted_skills: List[str]) -> Dict[str, Any]:
        """
        Calculates mathematical cosine similarity between resume text and all career roles using TF-IDF.
        Returns detailed vector statistics, ranking, and term weights.
        """
        if not self.roles:
            return {"rankings": [], "top_match": None}

        # Build corpus: document 0 is resume text + detected skills; documents 1..N are roles
        resume_enriched = f"{resume_text} {' '.join(extracted_skills * 2)}".lower()
        role_texts = [self._build_role_corpus_text(role) for role in self.roles]
        corpus = [resume_enriched] + role_texts

        # Initialize Scikit-Learn TfidfVectorizer
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=2500,
            token_pattern=r'(?u)\b[a-zA-Z0-9_+#.]{2,}\b'
        )

        tfidf_matrix = vectorizer.fit_transform(corpus)
        feature_names = np.array(vectorizer.get_feature_names_out())

        resume_vector = tfidf_matrix[0:1]
        role_vectors = tfidf_matrix[1:]

        # Compute scikit-learn cosine similarities
        sim_scores = cosine_similarity(resume_vector, role_vectors)[0]

        # Extract top TF-IDF features from resume
        resume_dense = resume_vector.toarray()[0]
        top_feature_indices = resume_dense.argsort()[::-1][:15]
        top_resume_terms = [
            {"term": feature_names[i], "tfidf_weight": round(float(resume_dense[i]), 4)}
            for i in top_feature_indices if resume_dense[i] > 0
        ]

        extracted_skills_lower = {s.lower() for s in extracted_skills}

        rankings = []
        for idx, role in enumerate(self.roles):
            raw_sim = float(sim_scores[idx])
            # Percentage rounded to 1 decimal
            match_percentage = round(raw_sim * 100, 1)

            # Analyze skills alignment
            req_skills = role.get("required_skills", [])
            pref_skills = role.get("preferred_skills", [])

            matched_req = [s for s in req_skills if s.lower() in extracted_skills_lower]
            missing_req = [s for s in req_skills if s.lower() not in extracted_skills_lower]

            matched_pref = [s for s in pref_skills if s.lower() in extracted_skills_lower]
            missing_pref = [s for s in pref_skills if s.lower() not in extracted_skills_lower]

            # Vector norm & dot product breakdown for explainability
            role_vec = role_vectors[idx:idx+1]
            dot_product = float((resume_vector.toarray()[0] * role_vec.toarray()[0]).sum())
            norm_a = float(np.linalg.norm(resume_vector.toarray()[0]))
            norm_b = float(np.linalg.norm(role_vec.toarray()[0]))

            rankings.append({
                "role_id": role.get("id"),
                "title": role.get("title"),
                "category": role.get("category"),
                "description": role.get("description"),
                "similarity_score": round(raw_sim, 4),
                "match_percentage": match_percentage,
                "matched_required_skills": matched_req,
                "missing_required_skills": missing_req,
                "matched_preferred_skills": matched_pref,
                "missing_preferred_skills": missing_pref,
                "required_coverage": round((len(matched_req) / len(req_skills) * 100), 1) if req_skills else 0.0,
                "total_coverage": round(((len(matched_req) + len(matched_pref)) / (len(req_skills) + len(pref_skills)) * 100), 1) if (len(req_skills) + len(pref_skills)) > 0 else 0.0,
                "math_breakdown": {
                    "dot_product": round(dot_product, 4),
                    "resume_norm": round(norm_a, 4),
                    "role_norm": round(norm_b, 4),
                    "cosine_angle_deg": round(float(np.degrees(np.arccos(np.clip(raw_sim, 0.0, 1.0)))), 1)
                }
            })

        # Sort descending by similarity score
        rankings.sort(key=lambda x: x["similarity_score"], reverse=True)
        top_match = rankings[0] if rankings else None

        return {
            "top_match": top_match,
            "rankings": rankings,
            "vector_metadata": {
                "vocabulary_size": len(feature_names),
                "top_resume_terms": top_resume_terms,
                "total_roles_evaluated": len(self.roles),
                "metric": "Cosine Similarity over TF-IDF sparse space"
            }
        }
