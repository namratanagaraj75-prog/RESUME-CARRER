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

## Deployment (Render + Vercel)

The FastAPI backend and React frontend are separate deployments. The backend serves the analysis API and needs the repository's `data/` files; Vercel hosts only the frontend. The root `render.yaml` configures the Render web service.

1. Push this repository to GitHub.
2. In Render, create a **Blueprint** from the GitHub repository and deploy the `resume-career-api` service from `render.yaml`. Wait for the deploy to finish, then copy the service URL (for example, `https://resume-career-api.onrender.com`). Check that `<service-url>/api/health` returns a healthy response.
3. In Vercel, import the same GitHub repository and set **Root Directory** to `frontend`. Set the environment variable `VITE_API_BASE_URL` to the Render URL ending in `/api` (for example, `https://resume-career-api.onrender.com/api`), then deploy. The Vercel configuration supports client-side route fallback.
4. Copy the deployed Vercel origin (for example, `https://your-project.vercel.app`) into the Render service's `CORS_ALLOW_ORIGINS` environment variable. Enter only the origin, with no trailing slash; add any custom frontend domain as another comma-separated origin. Save and redeploy/restart the Render service.
5. Optionally set `OPENAI_API_KEY` in Render's environment variables to enable OpenAI-generated guidance. Without it the local rule-based guidance continues to work.

`VITE_API_BASE_URL` is public frontend configuration, not a secret. Keep API keys only in Render's secret environment variables, never in Vercel `VITE_*` variables or committed files.

Render's free service may sleep when idle, so the first request after a quiet period can take longer. Generated reports are written to `reports/generated/`; on hosts without persistent disks they may be lost when the service restarts. Configure persistent storage if generated reports need to survive restarts. Vite's `/api` proxy is for local development only and is not used by the production deployment.

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
