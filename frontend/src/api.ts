import {
  ResumeWorkflowState,
  SampleResume,
  CodeTreeNode,
  PresentationSlide,
  WorkflowTraceStep
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '');

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const endpoint = path.startsWith('/api/')
    ? path.slice('/api'.length)
    : path.startsWith('/')
      ? path
      : `/${path}`;
  return `${API_BASE}${endpoint}`;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  async getSampleResumes(): Promise<SampleResume[]> {
    const res = await fetch(`${API_BASE}/sample-resumes`);
    if (!res.ok) throw new Error('Failed to fetch sample resumes');
    return res.json();
  },

  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/resume/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async runWorkflow(raw_text: string, filename = 'resume.txt', file_size_bytes = 0, target_role_id?: string | null): Promise<ResumeWorkflowState> {
    const res = await fetch(`${API_BASE}/workflow/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_text,
        filename,
        file_size_bytes,
        target_role_id
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Workflow execution failed');
    }
    return res.json();
  },

  async streamWorkflow(
    raw_text: string,
    filename = 'resume.txt',
    file_size_bytes = 0,
    target_role_id?: string | null,
    onStep?: (step: WorkflowTraceStep) => void,
  ): Promise<ResumeWorkflowState> {
    const res = await fetch(`${API_BASE}/workflow/run/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text, filename, file_size_bytes, target_role_id }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Analysis could not be completed. Check the resume and try again.');
    }
    if (!res.body) throw new Error('Live workflow updates are not available in this browser.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalState: ResumeWorkflowState | null = null;

    const processFrame = (frame: string) => {
      const data = frame.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
      if (!data) return;
      const event = JSON.parse(data);
      if (event.type === 'step') onStep?.(event.step as WorkflowTraceStep);
      else if (event.type === 'complete') finalState = event.state as ResumeWorkflowState;
      else if (event.type === 'error') throw new Error(event.message || 'Analysis could not be completed.');
    };

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done }).replace(/\r/g, '');
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';
        frames.forEach(processFrame);
        if (done) break;
      }
      if (buffer.trim()) processFrame(buffer);
    } finally {
      reader.releaseLock();
    }
    if (!finalState) throw new Error('The workflow ended without a final analysis result. Please retry.');
    return finalState;
  },

  async getCareerRoles() {
    const res = await fetch(`${API_BASE}/career-roles`);
    if (!res.ok) throw new Error('Failed to fetch career roles');
    return res.json();
  },

  async getSkills() {
    const res = await fetch(`${API_BASE}/skills`);
    if (!res.ok) throw new Error('Failed to fetch skills taxonomy');
    return res.json();
  },

  async chat(message: string, history: Array<{ role: string; content: string }>, context: any) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    });
    if (!res.ok) throw new Error('Failed to get chat response');
    return res.json();
  },

  async getCodeTree(): Promise<{ root: string; tree: CodeTreeNode[] }> {
    const res = await fetch(`${API_BASE}/code/tree`);
    if (!res.ok) throw new Error('Failed to fetch code tree');
    return res.json();
  },

  async readCodeFile(path: string): Promise<{ path: string; filename: string; content: string; lines_count: number; size_bytes: number }> {
    const res = await fetch(`${API_BASE}/code/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to read file');
    }
    return res.json();
  },

  async explainCode(path: string, content: string, selected_code?: string): Promise<{ explanation: string }> {
    const res = await fetch(`${API_BASE}/code/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, selected_code }),
    });
    if (!res.ok) throw new Error('Failed to explain code');
    return res.json();
  },

  async generateReport(state: ResumeWorkflowState, format = 'both'): Promise<{ markdown: string; pdf_filename?: string; pdf_download_url?: string }> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, format }),
    });
    if (!res.ok) throw new Error('Failed to generate report');
    const report = await res.json();
    return {
      ...report,
      pdf_download_url: report.pdf_download_url ? resolveApiUrl(report.pdf_download_url) : undefined,
    };
  },

  async getPresentationSlides(): Promise<{ slides: PresentationSlide[] }> {
    const res = await fetch(`${API_BASE}/presentation/slides`);
    if (!res.ok) throw new Error('Failed to fetch presentation slides');
    return res.json();
  },

  async updateSettings(settings: { provider?: string; model?: string }) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
