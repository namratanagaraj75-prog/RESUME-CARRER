# AI Resume Analysis & Career Guidance System

A full-stack academic project that extracts resume text, detects skills from a local taxonomy, compares resumes with curated career role templates, analyzes skill gaps, and creates career guidance and reports.

## What is implemented

- React, TypeScript, Vite, Tailwind CSS, Lucide icons, and Framer Motion frontend.
- FastAPI backend for resume upload, analysis, chat, source browsing, presentation data, and reports.
- PDF text extraction with `pypdf`, plus plain text and Markdown uploads.
- Resume preprocessing, contact and section parsing, skill taxonomy matching, and aliases in `data/skills.json`.
- TF-IDF vectors and cosine similarity against roles in `data/career_roles.json`.
- Required and preferred skill gap analysis with prioritized learning suggestions.
- A LangGraph workflow that runs preprocessing, skill extraction, role matching, gap analysis, context preparation, guidance, and roadmap generation.
- Optional OpenAI guidance, chat, and code explanations. Without a key, a local rule-based synthesizer provides fallback responses.
- A source explorer that reads project files, highlights common code tokens, supports code selection, and requests explanations.
- An in-app 30-slide presentation viewer using the supplied PDF, with PDF-rendered slide thumbnails, keyboard navigation, and fullscreen controls.
- Markdown and PDF report generation.
- Roadmap milestone checkboxes saved in browser storage for each resume and target role.

## Important score interpretation

The reported percentage is cosine similarity between a TF-IDF resume vector and a curated role template. The resume representation includes extracted skills; required skills are weighted in the role text. This score measures text similarity only. It is not a hiring probability, model accuracy, or evidence of a candidate's proficiency. Skills are detected from mentions in resume text.

The built-in fallback guidance is rule-based. Set an OpenAI key to enable OpenAI-generated guidance and explanations. Numerical career scores always come from the scikit-learn matcher.

## Requirements

- Python 3.10 or later
- Node.js and npm versions supported by the installed Vite package

## Run locally

From the project root, install the Python requirements and build the frontend:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
python app.py
```

Open `http://127.0.0.1:8000`. The API documentation is at `http://127.0.0.1:8000/docs`.

For development, run `python app.py` in one terminal and `cd frontend; npm run dev` in another. Vite proxies `/api` requests to port 8000.

To use OpenAI, set `OPENAI_API_KEY` in the backend process environment before starting the server. The key is never entered in or sent from the frontend. Without the environment key, the local rule-based synthesizer handles guidance, chat, and explanations.

The backend also reads a root `.env` file for local development. Start from `.env.example`, keep the real `.env` private, and never put an OpenAI key in a `VITE_*` variable.

## Deployment notes

Vercel can host the React/Vite frontend, but this project also needs its Python FastAPI backend. The backend runs the resume extraction, scikit-learn analysis, LangGraph workflow, LLM adapter, and PDF report generation; it is not served by Vercel's static frontend deployment. Deploy the frontend to Vercel and run the backend as a separate Python service or container with the project data files available and a writable reports directory.

For Vercel, set the project root directory to `frontend` and configure the build environment variable `VITE_API_BASE_URL` to the backend's public URL ending in `/api` (for example, `https://your-backend.example.com/api`). This URL is public configuration, not a secret. Set `CORS_ALLOW_ORIGINS` on the backend to the exact Vercel site origin. Set `OPENAI_API_KEY` only in the backend host's secret environment if OpenAI responses are wanted; local rule-based guidance works without it.

Run a production backend from the repository root with the host's port, for example `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`. Vite's `/api` proxy is for local development and is not a production proxy. Reports are written to `reports/generated/`, so the backend host must provide writable storage; use persistent storage if generated reports must survive restarts or run across multiple backend instances.

The equivalent settings are documented in the root and frontend `.env.example` files. Do not commit real `.env` files or credentials.

## Try the workflow

1. Open **Resume** and upload a PDF or text resume, paste text, or choose one of the sample profiles.
2. Run the analysis. The backend executes the LangGraph workflow and returns the completed node trace.
3. Review detected skills, similarity rankings, and the role-template skill gaps.
4. Ask the Career Guide a question, inspect and update the roadmap milestones, then export a report.
5. Use **Code & AI** to browse actual project files and request an explanation for a file or selected code.

Sample resume text and PDFs are in `data/sample_resumes/`.

## Tests and build

```powershell
python -m pytest tests -v
cd frontend
npm run build
```

The Python suite covers preprocessing, skill extraction, TF-IDF matching, gaps, workflow execution, and API routes. The frontend build runs TypeScript checks before bundling.

## Project layout

```text
agents/       LangGraph state, nodes, and workflow
backend/      FastAPI routes and PDF/text extraction
data/         Skill taxonomy, role templates, slides, sample resumes
frontend/     React application
llm/          OpenAI adapter and local fallback responses
ml/           Preprocessing, skills, similarity, and gap analysis
reports/      Markdown and PDF report generation
tests/        Python unit and API tests
app.py        Unified FastAPI launcher
requirements.txt
```

Resume upload is limited to 15 MB. The source explorer excludes hidden folders, dependency/build directories, and symbolic links, and it does not execute project code.
