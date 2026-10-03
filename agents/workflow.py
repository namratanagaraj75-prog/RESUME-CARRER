"""
LangGraph State-Based Workflow Definition
Compiles the directed acyclic graph (DAG) coordinating resume analysis, ML matching, gap analysis, and guidance.
"""
from typing import Dict, Any, Iterator, Optional
from langgraph.graph import StateGraph, START, END

from agents.state import ResumeWorkflowState
from agents.nodes import (
    node_parse_preprocess,
    node_extract_skills,
    node_career_match,
    node_skill_gap,
    node_prepare_context,
    node_career_guidance,
    node_roadmap_generation
)

def create_resume_workflow():
    """Builds and compiles the LangGraph StateGraph."""
    graph = StateGraph(ResumeWorkflowState)

    # Register Nodes
    graph.add_node("node_parse_preprocess", node_parse_preprocess)
    graph.add_node("node_extract_skills", node_extract_skills)
    graph.add_node("node_career_match", node_career_match)
    graph.add_node("node_skill_gap", node_skill_gap)
    graph.add_node("node_prepare_context", node_prepare_context)
    graph.add_node("node_career_guidance", node_career_guidance)
    graph.add_node("node_roadmap_generation", node_roadmap_generation)

    # Define Linear Graph Flow
    graph.add_edge(START, "node_parse_preprocess")
    graph.add_edge("node_parse_preprocess", "node_extract_skills")
    graph.add_edge("node_extract_skills", "node_career_match")
    graph.add_edge("node_career_match", "node_skill_gap")
    graph.add_edge("node_skill_gap", "node_prepare_context")
    graph.add_edge("node_prepare_context", "node_career_guidance")
    graph.add_edge("node_career_guidance", "node_roadmap_generation")
    graph.add_edge("node_roadmap_generation", END)

    return graph.compile()

# Singleton compiled workflow instance
compiled_app = create_resume_workflow()

def create_initial_state(
    raw_text: str,
    filename: str = "resume.txt",
    file_size_bytes: int = 0,
    target_role_id: Optional[str] = None
) -> ResumeWorkflowState:
    return {
        "raw_text": raw_text,
        "file_meta": {
            "filename": filename,
            "size_bytes": file_size_bytes,
            "char_count": len(raw_text)
        },
        "preprocessed_data": {},
        "extracted_skills": {},
        "career_match_results": {},
        "target_role_id": target_role_id,
        "skill_gap_results": {},
        "llm_guidance": {},
        "roadmap": [],
        "workflow_trace": [],
        "error": None
    }


def run_resume_workflow(
    raw_text: str,
    filename: str = "resume.txt",
    file_size_bytes: int = 0,
    target_role_id: Optional[str] = None
) -> Dict[str, Any]:
    """Execute the LangGraph workflow and return its final state."""
    initial_state = create_initial_state(raw_text, filename, file_size_bytes, target_role_id)
    final_state = compiled_app.invoke(initial_state)
    return final_state


def stream_resume_workflow(
    raw_text: str,
    filename: str = "resume.txt",
    file_size_bytes: int = 0,
    target_role_id: Optional[str] = None,
) -> Iterator[Dict[str, Any]]:
    """Yield each completed LangGraph node, then the accumulated final state."""
    state = create_initial_state(raw_text, filename, file_size_bytes, target_role_id)
    for update in compiled_app.stream(state, stream_mode="updates"):
        for node_name, node_update in update.items():
            state.update(node_update)
            trace = state.get("workflow_trace", [])
            step = next((item for item in reversed(trace) if item.get("node_name") == node_name), None)
            if step:
                yield {"type": "step", "step": step}
    yield {"type": "complete", "state": state}
