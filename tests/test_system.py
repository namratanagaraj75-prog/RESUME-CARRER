"""
Unit & Integration Tests for Resume Analysis & Career Guidance System.
"""
import pytest
from pathlib import Path
from tempfile import TemporaryDirectory
from ml.preprocessor import ResumePreprocessor
from ml.skill_extractor import SkillExtractor
from ml.tfidf_matcher import CareerMatcher
from ml.gap_analyzer import SkillGapAnalyzer
from agents.workflow import run_resume_workflow
from backend.extractor import ResumeExtractor
from llm.provider import LLMProvider
from reports.generator import ReportGenerator

def test_preprocessor_contacts_and_sections():
    raw = """John Doe
john.doe@example.com | (555) 123-4567 | github.com/johndoe

SUMMARY
Experienced software developer with Python expertise.

SKILLS
Python, JavaScript, Docker, Git

EXPERIENCE
Software Engineer at Acme Corp. Built REST APIs.
"""
    prep = ResumePreprocessor()
    res = prep.preprocess(raw)

    assert res["contact_info"]["name"] == "John Doe"
    assert res["contact_info"]["email"] == "john.doe@example.com"
    assert "github.com/johndoe" in res["contact_info"]["links"]
    assert "summary" in res["sections"]
    assert "skills" in res["sections"]
    assert res["word_count"] > 10

def test_skill_extraction():
    text = "Proficient in Python, machine learning, PyTorch, k8s, Docker, and PostgreSQL. Familiar with scikit-learn and React."
    extractor = SkillExtractor()
    extracted = extractor.extract_skills(text)

    skills = extracted["skills"]
    assert "Python" in skills
    assert "Machine Learning" in skills
    assert "PyTorch" in skills
    assert "Docker" in skills
    assert "PostgreSQL" in skills
    assert "Kubernetes" in skills  # Resolved from alias 'k8s'
    assert "scikit-learn" in skills
    assert extracted["total_count"] >= 7

def test_tfidf_cosine_matcher():
    text = "Machine learning engineer experienced in Python, scikit-learn, PyTorch, Pandas, NumPy, and TensorFlow. Building AI models."
    skills = ["Python", "Machine Learning", "scikit-learn", "PyTorch", "TensorFlow", "Pandas", "NumPy"]

    matcher = CareerMatcher()
    result = matcher.match_career(text, skills)

    rankings = result["rankings"]
    assert len(rankings) >= 8
    top = result["top_match"]
    assert top is not None

    # Top match should be in Data & AI category (ML Engineer, Data Scientist, or AI Engineer)
    assert top["category"] == "Data & AI"
    assert 0.0 <= top["similarity_score"] <= 1.0
    assert 0.0 <= top["match_percentage"] <= 100.0

    # Verify math breakdown presence
    math_info = top["math_breakdown"]
    assert "dot_product" in math_info
    assert "resume_norm" in math_info
    assert "role_norm" in math_info
    assert "cosine_angle_deg" in math_info

def test_skill_gap_analyzer():
    candidate_skills = ["Python", "scikit-learn", "Pandas", "NumPy"]
    target_role = {
        "id": "ml_engineer",
        "title": "Machine Learning Engineer",
        "required_skills": ["Python", "Machine Learning", "scikit-learn", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Docker"],
        "preferred_skills": ["Deep Learning", "FastAPI", "AWS"],
        "learning_priority_order": ["Python", "NumPy", "Pandas", "scikit-learn", "Machine Learning", "PyTorch", "Docker"]
    }

    analyzer = SkillGapAnalyzer()
    gap = analyzer.analyze_gap(candidate_skills, target_role)

    assert "Python" in gap["matched_required"]
    assert "TensorFlow" in gap["missing_required"]
    assert "Docker" in gap["missing_required"]
    assert "FastAPI" in gap["missing_preferred"]
    assert gap["required_match_rate"] > 0
    assert len(gap["prioritized_learning"]) > 0

def test_langgraph_workflow_trace():
    resume_text = "Senior Python engineer building microservices with FastAPI, Docker, PostgreSQL, Redis, and React."
    state = run_resume_workflow(resume_text, "test.txt")

    assert state["preprocessed_data"] is not None
    assert len(state["extracted_skills"]["skills"]) > 0
    assert len(state["career_match_results"]["rankings"]) > 0
    assert state["skill_gap_results"]["target_role_title"] == state["career_match_results"]["top_match"]["title"]
    assert len(state["skill_gap_results"]["matched_required"]) + len(state["skill_gap_results"]["missing_required"]) > 0
    assert len(state["roadmap"]) == 7
    assert len(state["workflow_trace"]) == 7

    node_names = [t["node_name"] for t in state["workflow_trace"]]
    expected_nodes = [
        "node_parse_preprocess",
        "node_extract_skills",
        "node_career_match",
        "node_skill_gap",
        "node_prepare_context",
        "node_career_guidance",
        "node_roadmap_generation"
    ]
    assert node_names == expected_nodes

def test_api_endpoints():
    from fastapi.testclient import TestClient
    from backend.app import app

    client = TestClient(app)

    # Health check
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    # Sample resumes
    res_samples = client.get("/api/sample-resumes")
    assert res_samples.status_code == 200
    assert len(res_samples.json()) >= 3

    # Career roles
    res_roles = client.get("/api/career-roles")
    assert res_roles.status_code == 200
    assert len(res_roles.json()["roles"]) >= 8

    # Presentation slides
    res_slides = client.get("/api/presentation/slides")
    assert res_slides.status_code == 200
    assert len(res_slides.json()["slides"]) == 28

    # Code tree
    res_tree = client.get("/api/code/tree")
    assert res_tree.status_code == 200
    assert "tree" in res_tree.json()

    # The explorer serves actual project source, and rejects traversal paths.
    res_code = client.post("/api/code/read", json={"path": "backend/extractor.py"})
    assert res_code.status_code == 200
    assert "class ResumeExtractor" in res_code.json()["content"]
    res_traversal = client.post("/api/code/read", json={"path": "../outside.txt"})
    assert res_traversal.status_code == 403
    for private_output in ("reports/generated/report.pdf", "tmp/debug.txt"):
        res_private_output = client.post("/api/code/read", json={"path": private_output})
        assert res_private_output.status_code == 403

    # Empty and unknown-target workflow requests fail with useful client errors.
    res_empty = client.post("/api/workflow/run", json={"raw_text": ""})
    assert res_empty.status_code == 400
    res_unknown_role = client.post("/api/workflow/run", json={
        "raw_text": "A sufficiently long resume with Python and FastAPI experience.",
        "target_role_id": "not-a-role"
    })
    assert res_unknown_role.status_code == 400


def test_streaming_workflow_endpoint(monkeypatch):
    import json
    from fastapi.testclient import TestClient
    from backend.app import app
    from agents import nodes as workflow_nodes

    # Keep this integration check deterministic and avoid external API calls.
    monkeypatch.setattr(workflow_nodes, "llm_provider", LLMProvider(provider="local_synthesizer"))
    client = TestClient(app)
    response = client.post("/api/workflow/run/stream", json={
        "raw_text": "Python developer with FastAPI, PostgreSQL, Docker, React, and project testing experience.",
        "filename": "stream-check.txt",
    })
    assert response.status_code == 200
    events = [
        json.loads(data)
        for frame in response.text.strip().split("\n\n")
        for data in ["\n".join(line[5:].strip() for line in frame.splitlines() if line.startswith("data:"))]
        if data
    ]
    steps = [event["step"] for event in events if event["type"] == "step"]
    complete = next(event["state"] for event in events if event["type"] == "complete")
    assert len(steps) == 7
    assert all(step["status"] == "COMPLETED" for step in steps)
    assert len(complete["workflow_trace"]) == 7
    assert complete["roadmap"]


def test_pdf_extraction_and_upload():
    from fastapi.testclient import TestClient
    from backend.app import app

    sample_pdf = Path(__file__).parent.parent / "data" / "sample_resumes" / "sarah_chen_fullstack_dev.pdf"
    pdf_bytes = sample_pdf.read_bytes()
    extracted = ResumeExtractor.extract_from_bytes(pdf_bytes, sample_pdf.name)
    assert extracted["page_count"] >= 1
    assert "Sarah" in extracted["text"]

    client = TestClient(app)
    response = client.post("/api/resume/upload", files={"file": (sample_pdf.name, pdf_bytes, "application/pdf")})
    assert response.status_code == 200
    assert response.json()["char_count"] > 15
    assert "Sarah" in response.json()["text"]

    invalid = client.post("/api/resume/upload", files={"file": ("resume.exe", b"not a resume", "application/octet-stream")})
    assert invalid.status_code == 400


def test_report_generation_and_local_llm_fallback():
    text = "Python developer using FastAPI, PostgreSQL, Docker, React, and Git. Built a web application."
    state = run_resume_workflow(text, "test_resume.txt")

    with TemporaryDirectory() as output_dir:
        generator = ReportGenerator(output_dir=output_dir)
        markdown = generator.generate_markdown_report(state)
        pdf_path = generator.generate_pdf_report(state)
        assert "TF-IDF" in markdown
        assert "ROLE TEMPLATE SKILL COVERAGE" in markdown
        assert Path(pdf_path).read_bytes().startswith(b"%PDF")

    local_llm = LLMProvider(provider="local_synthesizer")
    context = {
        "top_match_title": state["career_match_results"]["top_match"]["title"],
        "match_score": state["career_match_results"]["top_match"]["match_percentage"],
        "extracted_skills": state["extracted_skills"]["skills"],
        "missing_required": state["skill_gap_results"]["missing_required"],
        "missing_preferred": state["skill_gap_results"]["missing_preferred"]
    }
    chat_reply = local_llm.chat("What skills am I missing?", [], context)
    guidance = local_llm.generate_career_guidance({
        "target_role": state["skill_gap_results"]["target_role_title"],
        "match_score": state["career_match_results"]["top_match"]["match_percentage"],
        "matched_required": state["skill_gap_results"]["matched_required"],
        "missing_required": state["skill_gap_results"]["missing_required"],
        "missing_preferred": state["skill_gap_results"]["missing_preferred"],
        "existing_skills": state["skill_gap_results"]["existing_skills"]
    })
    explanation = local_llm.explain_code("ml/preprocessor.py", "class ResumePreprocessor:\n    pass", "class ResumePreprocessor")
    assert "not detected" in chat_reply.lower()
    assert guidance["alignment_label"] == "Template-relative text similarity"
    assert "does not verify proficiency" in guidance["executive_summary"]
    assert "records or measurements" in guidance["resume_enhancements"][0]
    assert "Selected excerpt" in explanation
    assert "ResumePreprocessor" in explanation
