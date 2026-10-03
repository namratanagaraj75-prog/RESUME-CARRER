"""
FastAPI Backend Application
AI-Powered Resume Analysis & Career Guidance System
"""
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Literal
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

from backend.extractor import ResumeExtractor
from agents.workflow import run_resume_workflow, stream_resume_workflow
from llm.provider import LLMProvider
from reports.generator import ReportGenerator

DATA_DIR = os.path.join(BASE_DIR, "data")
REPORTS_DIR = os.path.join(BASE_DIR, "reports", "generated")
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
MAX_UPLOAD_BYTES = 15 * 1024 * 1024

app = FastAPI(
    title="AI-Powered Resume Analysis & Career Guidance System",
    description="Full-stack AI Academic Capstone System combining TF-IDF ML, LangGraph, and LLM guidance.",
    version="2.0.0"
)

# Enable CORS for local Vite development & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv(
        "CORS_ALLOW_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

report_generator = ReportGenerator(output_dir=REPORTS_DIR)
llm_provider = LLMProvider()

# Pydantic Request Models
class WorkflowRunRequest(BaseModel):
    raw_text: str
    filename: Optional[str] = "resume.txt"
    file_size_bytes: Optional[int] = 0
    target_role_id: Optional[str] = None

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=12)
    context: Dict[str, Any] = Field(default_factory=dict)

class CodeReadRequest(BaseModel):
    path: str = Field(min_length=1, max_length=1000)

class CodeExplainRequest(BaseModel):
    path: str = Field(min_length=1, max_length=1000)
    content: str = Field(max_length=100000)
    selected_code: Optional[str] = Field(default="", max_length=20000)

class ReportGenerateRequest(BaseModel):
    state: Dict[str, Any]
    format: Optional[str] = "both"  # "markdown", "pdf", or "both"

class SettingsUpdateRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None

# --- ENDPOINTS ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "AI-Powered Resume Analysis & Career Guidance System",
        "version": "2.0.0",
        "ml_engine": "scikit-learn TfidfVectorizer + Cosine Similarity",
        "agent_framework": "LangGraph StateGraph",
        "llm_status": llm_provider.get_status()
    }

@app.get("/api/sample-resumes")
def get_sample_resumes():
    sample_dir = os.path.join(DATA_DIR, "sample_resumes")
    if not os.path.exists(sample_dir):
        return []

    samples = []
    for f in os.listdir(sample_dir):
        if f.endswith(".txt"):
            role_hint = "General"
            if "ai_ml" in f:
                role_hint = "AI / ML Engineer (Senior)"
            elif "fullstack" in f:
                role_hint = "Full Stack Developer (Mid-Level)"
            elif "fresher" in f:
                role_hint = "Computer Science Graduate (Entry/Fresher)"
            elif "data_analyst" in f:
                role_hint = "Data Analyst"

            fpath = os.path.join(sample_dir, f)
            with open(fpath, "r", encoding="utf-8") as fp:
                preview = fp.read()

            samples.append({
                "id": f.replace(".txt", ""),
                "filename": f,
                "role_hint": role_hint,
                "preview_snippet": preview[:250] + "...",
                "full_text": preview,
                "has_pdf": os.path.exists(os.path.join(sample_dir, f.replace(".txt", ".pdf")))
            })
    return samples

@app.get("/api/sample-resumes/{sample_id}/download-pdf")
def download_sample_pdf(sample_id: str):
    if not sample_id or any(ch not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-" for ch in sample_id):
        raise HTTPException(status_code=404, detail="Sample PDF not found.")
    sample_root = os.path.realpath(os.path.join(DATA_DIR, "sample_resumes"))
    pdf_path = os.path.realpath(os.path.join(sample_root, f"{sample_id}.pdf"))
    if os.path.commonpath([sample_root, pdf_path]) != sample_root or not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="Sample PDF not found.")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{sample_id}.pdf")

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="A filename is required.")
        content = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File is too large (maximum 15 MB).")
        extracted = ResumeExtractor.extract_from_bytes(content, file.filename)
        return {
            "success": True,
            "filename": extracted["filename"],
            "file_size": extracted["file_size"],
            "page_count": extracted["page_count"],
            "char_count": extracted["char_count"],
            "text": extracted["text"],
            "preview": extracted["text"][:400] + ("..." if len(extracted["text"]) > 400 else "")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Resume extraction failed: {e}")
        raise HTTPException(status_code=400, detail="The file could not be read as a supported resume. Upload a text based PDF, TXT, or Markdown file.")

def validate_workflow_request(req: WorkflowRunRequest) -> None:
    if not req.raw_text or len(req.raw_text.strip()) < 15:
        raise HTTPException(status_code=400, detail="Resume text is too short or empty.")
    if len(req.raw_text) > 2_000_000:
        raise HTTPException(status_code=413, detail="Resume text is too large (maximum 2 million characters).")
    if req.target_role_id:
        with open(os.path.join(DATA_DIR, "career_roles.json"), "r", encoding="utf-8") as roles_file:
            valid_role_ids = {role.get("id") for role in json.load(roles_file).get("roles", [])}
        if req.target_role_id not in valid_role_ids:
            raise HTTPException(status_code=400, detail="Unknown target role.")


@app.post("/api/workflow/run")
def execute_workflow(req: WorkflowRunRequest):
    validate_workflow_request(req)
    try:
        final_state = run_resume_workflow(
            raw_text=req.raw_text,
            filename=req.filename,
            file_size_bytes=req.file_size_bytes,
            target_role_id=req.target_role_id
        )
        return final_state
    except Exception as e:
        print(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail="Analysis could not be completed. Check the resume and try again.")


@app.post("/api/workflow/run/stream")
def execute_workflow_stream(req: WorkflowRunRequest):
    validate_workflow_request(req)

    def event_stream():
        try:
            for event in stream_resume_workflow(
                raw_text=req.raw_text,
                filename=req.filename,
                file_size_bytes=req.file_size_bytes,
                target_role_id=req.target_role_id,
            ):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as exc:
            print(f"Workflow stream failed: {exc}")
            error = {"type": "error", "message": "Analysis could not be completed. Check the resume and try again."}
            yield f"data: {json.dumps(error)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@app.get("/api/career-roles")
def get_career_roles():
    roles_file = os.path.join(DATA_DIR, "career_roles.json")
    if not os.path.exists(roles_file):
        raise HTTPException(status_code=404, detail="Career roles file not found.")
    with open(roles_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/skills")
def get_skills_database():
    skills_file = os.path.join(DATA_DIR, "skills.json")
    if not os.path.exists(skills_file):
        raise HTTPException(status_code=404, detail="Skills database file not found.")
    with open(skills_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/chat")
def career_chat(req: ChatRequest):
    history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]
    reply = llm_provider.chat(req.message, history_dicts, req.context or {})
    return {"reply": reply}

# --- REAL CODE EXPLORER ENDPOINTS ---

EXCLUDED_DIRS = {".git", ".idea", ".vscode", "__pycache__", "node_modules", "dist", ".gemini", "brain", "tmp", "generated"}

@app.get("/api/code/tree")
def get_code_tree():
    """Returns actual directory tree of the project workspace."""
    def build_tree(current_path, rel_path=""):
        items = []
        try:
            entries = sorted(os.listdir(current_path))
        except Exception:
            return []

        # Put directories first, then files
        dirs = []
        files = []
        for entry in entries:
            if entry in EXCLUDED_DIRS or entry.startswith('.') or entry.lower() in {"secrets", "credentials"}:
                continue
            full_entry_path = os.path.join(current_path, entry)
            entry_rel_path = os.path.join(rel_path, entry).replace("\\", "/")

            if os.path.islink(full_entry_path):
                continue
            if os.path.isdir(full_entry_path):
                dirs.append({
                    "name": entry,
                    "path": entry_rel_path,
                    "type": "directory",
                    "children": build_tree(full_entry_path, entry_rel_path)
                })
            else:
                files.append({
                    "name": entry,
                    "path": entry_rel_path,
                    "type": "file",
                    "extension": entry.split(".")[-1] if "." in entry else "",
                    "size_bytes": os.path.getsize(full_entry_path)
                })
        return dirs + files

    return {"root": "project", "tree": build_tree(BASE_DIR)}

@app.post("/api/code/read")
def read_code_file(req: CodeReadRequest):
    """Safely reads the content of an actual source file within the workspace."""
    clean_rel = req.path.replace("\\", "/")
    parts = Path(clean_rel).parts
    if (not clean_rel or Path(clean_rel).is_absolute() or
            any(part in {".", ".."} or part.startswith(".") for part in parts) or
            any(part.lower() in {name.lower() for name in EXCLUDED_DIRS} for part in parts)):
        raise HTTPException(status_code=403, detail="Access denied: Cannot access files outside project directory.")

    project_root = os.path.realpath(BASE_DIR)
    full_path = os.path.realpath(os.path.join(project_root, *parts))
    try:
        if os.path.commonpath([project_root, full_path]) != project_root:
            raise HTTPException(status_code=403, detail="Access denied: Cannot access files outside project directory.")
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access files outside project directory.")
    if (os.path.basename(full_path).lower() in {".env", "credentials.json"} or
            os.path.splitext(full_path)[1].lower() in {".key", ".pem", ".p12", ".pfx", ".db", ".sqlite"}):
        raise HTTPException(status_code=403, detail="Access denied: This file is not available in the explorer.")

    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        return {
            "path": clean_rel,
            "filename": os.path.basename(full_path),
            "content": content,
            "lines_count": len(content.splitlines()),
            "size_bytes": os.path.getsize(full_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

@app.post("/api/code/explain")
def explain_code(req: CodeExplainRequest):
    explanation = llm_provider.explain_code(req.path, req.content, req.selected_code or "")
    return {"explanation": explanation}

# --- REPORTS & PRESENTATION ENDPOINTS ---

@app.post("/api/reports/generate")
def generate_reports(req: ReportGenerateRequest):
    state = req.state
    md_content = report_generator.generate_markdown_report(state)
    pdf_filename = None

    if req.format in ["pdf", "both"]:
        pdf_path = report_generator.generate_pdf_report(state)
        pdf_filename = os.path.basename(pdf_path)

    return {
        "markdown": md_content,
        "pdf_filename": pdf_filename,
        "pdf_download_url": f"/api/reports/download/{pdf_filename}" if pdf_filename else None
    }

@app.get("/api/reports/download/{filename}")
def download_pdf_report(filename: str):
    if not filename or os.path.basename(filename) != filename or not filename.endswith(".pdf"):
        raise HTTPException(status_code=404, detail="Report file not found.")
    report_root = os.path.realpath(REPORTS_DIR)
    file_path = os.path.realpath(os.path.join(report_root, filename))
    if os.path.commonpath([report_root, file_path]) != report_root or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Report file not found.")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

@app.get("/api/presentation/slides")
def get_presentation_slides():
    slides_path = os.path.join(DATA_DIR, "presentation_slides.json")
    if not os.path.exists(slides_path):
        raise HTTPException(status_code=404, detail="Presentation slides not found.")
    with open(slides_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/settings")
def update_settings(req: SettingsUpdateRequest):
    global llm_provider
    selected_provider = req.provider or "auto"
    if selected_provider not in {"auto", "openai", "local_synthesizer"}:
        raise HTTPException(status_code=400, detail="Supported providers are OpenAI and the local synthesizer.")
    llm_provider = LLMProvider(
        provider=selected_provider,
        model=req.model
    )
    # The agent uses the same runtime provider as chat and code explanations.
    from agents import nodes as workflow_nodes
    workflow_nodes.llm_provider = llm_provider
    return {"status": "updated", "config": llm_provider.get_status()}

# Mount built frontend SPA static files if present
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
