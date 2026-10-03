"""
Agent Workflow State Definition
TypedDict tracking mutable state across the entire resume processing and guidance lifecycle.
"""
from typing import TypedDict, List, Dict, Any, Optional

class WorkflowTraceStep(TypedDict):
    node_name: str
    status: str
    timestamp: str
    duration_ms: float
    summary: str

class ResumeWorkflowState(TypedDict):
    raw_text: str
    file_meta: Dict[str, Any]
    preprocessed_data: Dict[str, Any]
    extracted_skills: Dict[str, Any]
    career_match_results: Dict[str, Any]
    target_role_id: Optional[str]
    skill_gap_results: Dict[str, Any]
    llm_guidance: Dict[str, Any]
    roadmap: List[Dict[str, Any]]
    workflow_trace: List[WorkflowTraceStep]
    error: Optional[str]
