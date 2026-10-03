export interface ContactInfo {
  name: string;
  email?: string | null;
  phone?: string | null;
  links: string[];
}

export interface PreprocessedData {
  cleaned_text: string;
  contact_info: ContactInfo;
  sections: Record<string, string>;
  character_count: number;
  word_count: number;
  line_count: number;
}

export interface SkillItem {
  name: string;
  frequency: number;
}

export interface ExtractedSkills {
  skills: string[];
  skill_counts: Record<string, number>;
  by_category: Record<string, SkillItem[]>;
  total_count: number;
}

export interface MathBreakdown {
  dot_product: number;
  resume_norm: number;
  role_norm: number;
  cosine_angle_deg: number;
}

export interface RoleMatch {
  role_id: string;
  title: string;
  category: string;
  description: string;
  similarity_score: number;
  match_percentage: number;
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  required_coverage: number;
  total_coverage: number;
  math_breakdown: MathBreakdown;
}

export interface CareerMatchResults {
  top_match: RoleMatch | null;
  rankings: RoleMatch[];
  vector_metadata: {
    vocabulary_size: number;
    top_resume_terms: Array<{ term: string; tfidf_weight: number }>;
    total_roles_evaluated: number;
    metric: string;
  };
}

export interface PrioritizedLearningItem {
  skill: string;
  importance: string;
  priority_level: number;
  missing_prerequisites: string[];
  reason: string;
}

export interface SkillGapResults {
  target_role_title: string;
  target_role_id: string;
  existing_skills: string[];
  matched_required: string[];
  missing_required: string[];
  matched_preferred: string[];
  missing_preferred: string[];
  required_match_rate: number;
  overall_readiness_score: number;
  prioritized_learning: PrioritizedLearningItem[];
  actionable_steps: string[];
}

export interface RoadmapStage {
  stage_number: number;
  stage_name: string;
  timeline: string;
  icon: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  description: string;
  deliverables: string[];
  action_items: string[];
}

export interface WorkflowTraceStep {
  node_name: string;
  status: string;
  timestamp: string;
  duration_ms: number;
  summary: string;
}

export interface LLMGuidance {
  alignment_label?: string;
  executive_summary: string;
  core_strengths: string[];
  critical_gap_strategy: string;
  recommended_projects: Array<{
    title: string;
    description: string;
    skills_demonstrated: string[];
  }>;
  resume_enhancements: string[];
  interview_focus_areas: string[];
}

export interface ResumeWorkflowState {
  raw_text: string;
  file_meta: {
    filename: string;
    size_bytes: number;
    char_count: number;
  };
  preprocessed_data: PreprocessedData;
  extracted_skills: ExtractedSkills;
  career_match_results: CareerMatchResults;
  target_role_id?: string | null;
  skill_gap_results: SkillGapResults;
  llm_guidance: LLMGuidance;
  roadmap: RoadmapStage[];
  workflow_trace: WorkflowTraceStep[];
  error?: string | null;
}

export interface SampleResume {
  id: string;
  filename: string;
  role_hint: string;
  preview_snippet: string;
  full_text: string;
  has_pdf: boolean;
}

export interface CodeTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size_bytes?: number;
  children?: CodeTreeNode[];
}

export interface PresentationSlide {
  slide_number: number;
  title: string;
  subtitle: string;
  category: string;
  key_points: string[];
  metrics: Record<string, string>;
}
