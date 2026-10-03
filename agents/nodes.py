"""
LangGraph Agent Workflow Nodes
Each node performs a discrete, observable analytical stage and updates the workflow state.
"""
import time
from datetime import datetime
from typing import Dict, Any

from ml.preprocessor import ResumePreprocessor
from ml.skill_extractor import SkillExtractor
from ml.tfidf_matcher import CareerMatcher
from ml.gap_analyzer import SkillGapAnalyzer
from llm.provider import LLMProvider

preprocessor = ResumePreprocessor()
skill_extractor = SkillExtractor()
career_matcher = CareerMatcher()
gap_analyzer = SkillGapAnalyzer()
llm_provider = LLMProvider()

def node_parse_preprocess(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    raw_text = state.get("raw_text", "")
    prep_data = preprocessor.preprocess(raw_text)
    duration = round((time.time() - t0) * 1000, 2)

    trace = state.get("workflow_trace", [])
    trace.append({
        "node_name": "node_parse_preprocess",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "duration_ms": duration,
        "summary": f"Cleaned {prep_data['word_count']} words, parsed {len(prep_data['sections'])} sections, identified {prep_data['contact_info']['name']}."
    })

    return {
        "preprocessed_data": prep_data,
        "workflow_trace": trace
    }

def node_extract_skills(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    cleaned_text = state.get("preprocessed_data", {}).get("cleaned_text", state.get("raw_text", ""))
    skills_data = skill_extractor.extract_skills(cleaned_text)
    duration = round((time.time() - t0) * 1000, 2)

    trace = state.get("workflow_trace", [])
    trace.append({
        "node_name": "node_extract_skills",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "duration_ms": duration,
        "summary": f"Extracted {skills_data['total_count']} technical & soft skills across {len(skills_data['by_category'])} taxonomy domains."
    })

    return {
        "extracted_skills": skills_data,
        "workflow_trace": trace
    }

def node_career_match(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    cleaned_text = state.get("preprocessed_data", {}).get("cleaned_text", state.get("raw_text", ""))
    skills = state.get("extracted_skills", {}).get("skills", [])

    match_results = career_matcher.match_career(cleaned_text, skills)
    duration = round((time.time() - t0) * 1000, 2)

    top_match = match_results.get("top_match")
    top_title = top_match.get("title") if top_match else "None"
    top_score = top_match.get("match_percentage") if top_match else 0.0

    trace = state.get("workflow_trace", [])
    trace.append({
        "node_name": "node_career_match",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "duration_ms": duration,
        "summary": f"Calculated TF-IDF vectors & Cosine Similarity across {len(match_results.get('rankings', []))} roles. Top match: {top_title} ({top_score}%)."
    })

    return {
        "career_match_results": match_results,
        "target_role_id": state.get("target_role_id") or (top_match.get("role_id") if top_match else None),
        "workflow_trace": trace
    }

def node_skill_gap(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    skills = state.get("extracted_skills", {}).get("skills", [])
    match_results = state.get("career_match_results", {})
    target_id = state.get("target_role_id")

    # Use the role template definition. A ranking result contains matched/missing
    # lists but does not carry the required_skills and preferred_skills arrays
    # the gap analyzer needs as its comparison baseline.
    target_role = None
    for role in career_matcher.roles:
        if role.get("id") == target_id:
            target_role = role
            break

    rankings = match_results.get("rankings", [])
    if not target_role and rankings:
        ranked_role_id = rankings[0].get("role_id")
        target_role = next((role for role in career_matcher.roles if role.get("id") == ranked_role_id), None)

    gap_data = gap_analyzer.analyze_gap(skills, target_role or {})
    duration = round((time.time() - t0) * 1000, 2)

    trace = state.get("workflow_trace", [])
    trace.append({
        "node_name": "node_skill_gap",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "duration_ms": duration,
        "summary": f"Analyzed gaps for '{gap_data['target_role_title']}': {len(gap_data['matched_required'])} matched, {len(gap_data['missing_required'])} missing required skills."
    })

    return {
        "skill_gap_results": gap_data,
        "workflow_trace": trace
    }

def node_prepare_context(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    gap_data = state.get("skill_gap_results", {})
    match_results = state.get("career_match_results", {})
    skills_data = state.get("extracted_skills", {})
    prep_data = state.get("preprocessed_data", {})

    top_match = match_results.get("top_match", {})

    context = {
        "candidate_name": prep_data.get("contact_info", {}).get("name", "Candidate"),
        "target_role": gap_data.get("target_role_title", top_match.get("title", "Target Role")),
        "match_score": top_match.get("match_percentage", 0.0),
        "existing_skills": skills_data.get("skills", []),
        "matched_required": gap_data.get("matched_required", []),
        "missing_required": gap_data.get("missing_required", []),
        "missing_preferred": gap_data.get("missing_preferred", []),
        "education": prep_data.get("sections", {}).get("education", ""),
        "experience": prep_data.get("sections", {}).get("experience", "")
    }

    duration = round((time.time() - t0) * 1000, 2)

    trace = state.get("workflow_trace", [])
    trace.append({
        "node_name": "node_prepare_context",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "duration_ms": duration,
        "summary": "Prepared structured context dictionary with numerical and categorical grounding for LLM."
    })

    return {
        "prepared_context": context,
        "workflow_trace": trace
    }

def node_career_guidance(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    context = state.get("prepared_context", {})
    guidance = llm_provider.generate_career_guidance(context)
    duration = round((time.time() - t0) * 1000, 2)

    trace = state.get("workflow_trace", [])
    trace.append({
        "node_name": "node_career_guidance",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "duration_ms": duration,
        "summary": f"Synthesized personalized career guidance, {len(guidance.get('core_strengths', []))} key strengths, and strategy for {context.get('target_role')}."
    })

    return {
        "llm_guidance": guidance,
        "workflow_trace": trace
    }

def node_roadmap_generation(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    gap_data = state.get("skill_gap_results", {})
    missing_req = gap_data.get("missing_required", [])
    missing_pref = gap_data.get("missing_preferred", [])
    existing_skills = gap_data.get("existing_skills", [])
    role_title = gap_data.get("target_role_title", "Target Role")

    # Generate 7-stage actionable roadmap
    stages = [
        {
            "stage_number": 1,
            "stage_name": "Review Resume-Listed Skills",
            "timeline": "Week 1",
            "icon": "CheckCircle2",
            "status": "UPCOMING",
            "description": "Check detected skill mentions against experience you can verify.",
            "deliverables": [f"Review resume-listed terms: {', '.join(existing_skills[:4]) if existing_skills else 'the detected skill list'}"],
            "action_items": [
                "Confirm that each listed skill is supported by work, study, or projects you can describe.",
                "Edit or remove terms that do not accurately represent your experience."
            ]
        },
        {
            "stage_number": 2,
            "stage_name": "Skill Gap Remediation",
            "timeline": "Weeks 2 – 4",
            "icon": "AlertTriangle",
            "status": "UPCOMING",
            "description": f"Study required terms not detected for the {role_title} template.",
            "deliverables": [f"Practice exercises for {', '.join(missing_req[:3]) if missing_req else 'role-relevant topics'}"],
            "action_items": [
                f"Choose a study schedule that fits your availability and start with {missing_req[0] if missing_req else 'a relevant domain topic'}.",
                "Write small, modular unit tests verifying syntax and core patterns."
            ]
        },
        {
            "stage_number": 3,
            "stage_name": "Structured Learning Sprint",
            "timeline": "Weeks 5 – 7",
            "icon": "BookOpen",
            "status": "UPCOMING",
            "description": "Bridge secondary missing skills and domain frameworks.",
            "deliverables": [f"Study {', '.join(missing_pref[:2]) if missing_pref else 'industry architectural patterns'}"],
            "action_items": [
                "Follow standard production courses or official documentation deep dives.",
                "Implement small modules that demonstrate state management and data persistence where relevant."
            ]
        },
        {
            "stage_number": 4,
            "stage_name": "Practical Hands-on Exercises",
            "timeline": "Weeks 8 – 9",
            "icon": "Code2",
            "status": "UPCOMING",
            "description": "Connect backend, frontend, or data pipelines into unified exercises.",
            "deliverables": ["Containerized microservice or reproducible data notebook"],
            "action_items": [
                "Integrate Docker containerization for local execution.",
                "Configure automated unit and integration tests using PyTest or Jest."
            ]
        },
        {
            "stage_number": 5,
            "stage_name": "Capstone Portfolio Projects",
            "timeline": "Weeks 10 – 12",
            "icon": "FolderGit2",
            "status": "UPCOMING",
            "description": f"Architect a flagship capstone application tailored for {role_title}.",
            "deliverables": [f"Documented {role_title} project demo; deployment is optional"],
            "action_items": [
                f"Build a showcase project featuring {missing_req[0] if missing_req else 'core role stack'}.",
                "Document the architecture, tested behavior, and known limitations."
            ]
        },
        {
            "stage_number": 6,
            "stage_name": "Portfolio & Resume Polish",
            "timeline": "Week 13",
            "icon": "FileText",
            "status": "UPCOMING",
            "description": "Align resume bullet points and public profiles with targeted keywords.",
            "deliverables": ["Updated ATS-friendly resume and GitHub profile README"],
            "action_items": [
                "Rewrite bullet points with clear actions; include numbers only when supported by records or measurements.",
                "Add badges, setup guides, and video walk-throughs to GitHub repositories."
            ]
        },
        {
            "stage_number": 7,
            "stage_name": "Interview Practice",
            "timeline": "Weeks 14 – 16",
            "icon": "Target",
            "status": "UPCOMING",
            "description": f"Practice explaining technical choices and project work relevant to {role_title}.",
            "deliverables": ["Practice notes and topics to review"],
            "action_items": [
                "Practice system design and technical architecture questions.",
                "Conduct mock interviews focusing on trade-offs and project storytelling."
            ]
        }
    ]

    duration = round((time.time() - t0) * 1000, 2)

    trace = state.get("workflow_trace", [])
    trace.append({
        "node_name": "node_roadmap_generation",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "duration_ms": duration,
        "summary": f"Generated personalized 7-stage career roadmap spanning 16 weeks targeting {role_title}."
    })

    return {
        "roadmap": stages,
        "workflow_trace": trace
    }
