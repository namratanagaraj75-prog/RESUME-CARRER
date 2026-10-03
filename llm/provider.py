"""
LLM Provider Integration
Supports OpenAI and a local rule-based context synthesizer fallback.
API keys are read strictly from the backend process environment.
"""
import os
import json
from typing import Dict, List, Any, Optional

class LLMProvider:
    def __init__(self, provider: str = "auto", model: Optional[str] = None):
        self.provider = provider
        # API credentials are read only from the backend process environment.
        self.openai_key = os.getenv("OPENAI_API_KEY")
        if provider == "local_synthesizer":
            self.active_provider = "local_synthesizer"
            self.active_key = None
            self.model = "heuristic-intelligence-engine"
        elif self.openai_key and len(self.openai_key.strip()) > 5:
            self.active_provider = "openai"
            self.active_key = self.openai_key
            self.model = model or "gpt-4o-mini"
        else:
            self.active_provider = "local_synthesizer"
            self.active_key = None
            self.model = "heuristic-intelligence-engine"

    def is_api_configured(self) -> bool:
        return self.active_key is not None and len(self.active_key.strip()) > 5

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.active_provider,
            "model": self.model,
            "has_key": self.is_api_configured(),
            "available_providers": ["openai", "local_synthesizer"]
        }

    def generate_career_guidance(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured career guidance including strengths, gap remedies, and resume improvements."""
        target_role = context.get("target_role", "Target Role")
        match_score = context.get("match_score", 0.0)
        matched_req = context.get("matched_required", [])
        missing_req = context.get("missing_required", [])
        missing_pref = context.get("missing_preferred", [])
        existing_skills = context.get("existing_skills", [])

        if self.is_api_configured() and self.active_provider == "openai":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.active_key)
                prompt = f"""
Analyze this candidate for target role '{target_role}':
Match Score: {match_score}%
Candidate Skills: {', '.join(existing_skills)}
Matched Required Skills: {', '.join(matched_req)}
Missing Required Skills: {', '.join(missing_req)}
Missing Preferred Skills: {', '.join(missing_pref)}

Provide a structured JSON response with keys:
- 'alignment_label': a neutral label for this template-relative text similarity
- 'executive_summary': describe the score and detected or missing terms
- 'core_strengths': list detected resume mentions, without claiming proficiency
- 'critical_gap_strategy': suggestions for reviewing or learning missing terms
- 'recommended_projects': list of 2 portfolio project ideas tailored to cover missing skills
- 'resume_enhancements': list of 3 evidence-based resume suggestions
- 'interview_focus_areas': list of 3 topics to practice, not predictions

Treat the score as lexical similarity, not qualification or hiring likelihood. Do not infer
experience, proficiency, salary, hiring outcomes, or career readiness. Never invent
performance metrics, usage counts, timelines, or accomplishments. Recommend numeric
resume claims only when the candidate supplies verifiable measurements; otherwise use
accurate descriptions without numbers.
"""
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a careful technical career guide. Treat resume skills as detected mentions, not verified proficiency. Treat cosine match as lexical similarity, not qualification or hiring likelihood. Do not invent performance metrics, usage counts, salary, timelines, accomplishments, or career outcomes. Recommend numeric claims only when the user supplies verifiable measurements; otherwise suggest accurate descriptions without numbers. Return pure JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
                return json.loads(content)
            except Exception as e:
                print(f"API call failed, falling back to local synthesizer: {e}")

        # Deterministic context-grounded synthesis fallback
        return self._synthesize_guidance_fallback(
            target_role, match_score, matched_req, missing_req, missing_pref, existing_skills
        )

    def _synthesize_guidance_fallback(
        self,
        target_role: str,
        match_score: float,
        matched_req: List[str],
        missing_req: List[str],
        missing_pref: List[str],
        existing_skills: List[str]
    ) -> Dict[str, Any]:
        """Create guidance from detected terms without inferring candidate outcomes."""
        label = "Template-relative text similarity"
        detected = ", ".join(matched_req[:4]) or "no required terms from this template"
        if missing_req:
            gap_strategy = (
                f"The {target_role} template lists required terms not detected in this resume: "
                f"{', '.join(missing_req[:4])}. Check whether relevant experience was omitted. "
                "If these are new topics, choose one to study and practice; this analysis does not assess your proficiency."
            )
        else:
            gap_strategy = (
                f"All required terms in the {target_role} template were detected in the resume text. "
                "Review preferred terms and verify that each listed skill is supported by experience you can describe."
            )

        strengths = [
            f"Detected resume term: {skill}"
            for skill in (matched_req or existing_skills)[:4]
        ]
        project_skills = (missing_req or missing_pref)[:2] or existing_skills[:2] or ["a role-relevant topic"]
        project_skills_text = ", ".join(project_skills)
        projects = [
            {
                "title": f"Learning Project for {target_role}",
                "description": f"Build a small project to practice {project_skills_text}. Document the features you implement and the choices you make.",
                "skills_demonstrated": project_skills
            },
            {
                "title": "Reproducible Testing Exercise",
                "description": "Run repeatable tests against a stated baseline. Report only measurements from actual runs and include the environment and test conditions.",
                "skills_demonstrated": ["Testing", project_skills[0]]
            }
        ]

        resume_enhancements = [
            "Use numbers only when you have records or measurements to support them; otherwise describe verified scope and work without numeric claims.",
            f"Add terms such as {', '.join(missing_req[:3]) if missing_req else 'role-relevant technologies'} only after you have learned and used them.",
            "Link project artifacts you can access and describe accurately."
        ]

        interview_focus = [
            f"Practice explaining {missing_req[0] if missing_req else target_role} concepts and trade-offs.",
            f"Review a project involving {matched_req[0] if matched_req else 'a relevant technology'} and describe your own contribution.",
            "Practice explaining design choices, testing, and limitations using examples you can verify."
        ]
        summary = (
            f"The resume has {match_score}% TF-IDF cosine similarity with the {target_role} role template. "
            f"Detected required terms include {detected}; {len(missing_req)} required template terms were not detected. "
            "This score reflects text similarity only and does not verify proficiency or predict hiring outcomes."
        )

        return {
            "alignment_label": label,
            "executive_summary": summary,
            "core_strengths": strengths,
            "critical_gap_strategy": gap_strategy,
            "recommended_projects": projects,
            "resume_enhancements": resume_enhancements,
            "interview_focus_areas": interview_focus
        }

    def chat(self, user_message: str, history: List[Dict[str, str]], context: Dict[str, Any]) -> str:
        """Process conversational query using resume context."""
        if self.is_api_configured() and self.active_provider == "openai":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.active_key)
                system_prompt = f"""
You are the AI Career Guide inside the 'AI-Powered Resume Analysis & Career Guidance System'.
Treat skill entries as detected resume mentions, not verified proficiency. Treat match scores
as lexical similarity against bundled role templates, not qualifications or hiring odds.
Do not invent salaries, performance metrics, user statistics, timelines, accomplishments,
or career outcomes. Suggest numeric resume claims only when the user provides verifiable
measurements; otherwise recommend accurate descriptions without numbers.
Candidate Resume Data:
- Top Role Match: {context.get('top_match_title', 'None')} ({context.get('match_score', 0)}% similarity)
- Extracted Skills: {', '.join(context.get('extracted_skills', []))}
- Missing Required Skills: {', '.join(context.get('missing_required', []))}
- Missing Preferred Skills: {', '.join(context.get('missing_preferred', []))}
- Education: {context.get('education', 'Not parsed')}

Answer concisely, helpfully, and with direct technical relevance to the candidate's actual profile.
"""
                messages = [{"role": "system", "content": system_prompt}]
                for msg in history[-6:]:
                    messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
                messages.append({"role": "user", "content": user_message})

                resp = client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=600
                )
                return resp.choices[0].message.content
            except Exception as e:
                print(f"Chat API failed: {e}")

        # Intelligent contextual chatbot fallback
        return self._synthesize_chat_fallback(user_message, context)

    def _synthesize_chat_fallback(self, query: str, context: Dict[str, Any]) -> str:
        """Answer common career questions from the current analysis context."""
        q = query.lower()
        role = context.get("top_match_title", "your target career")
        score = context.get("match_score", 0.0)
        skills = context.get("extracted_skills", [])
        missing_req = context.get("missing_required", [])
        missing_pref = context.get("missing_preferred", [])

        if "why" in q and ("low" in q or "score" in q or "match" in q):
            if missing_req:
                coverage = f"The role template lists these required skills that were not detected: {', '.join(missing_req[:5])}."
            else:
                coverage = "All required skills in the selected role template were detected. The score also reflects wider term overlap with the full role description, separate from required-skill coverage."
            listed = ", ".join(skills[:5]) if skills else "no skills from the current taxonomy"
            return (
                f"### Match explanation: {score}% text similarity for {role}\n\n"
                "The TF-IDF cosine score compares resume text and detected skill mentions with curated role templates.\n\n"
                f"**Required skill coverage:** {coverage}\n\n"
                f"**Detected resume terms:** {listed}.\n\n"
                "This score does not measure proficiency, project quality, years of experience, or hiring likelihood. Review the role template and include concrete evidence only for work you have actually done; then rerun the analysis to see how text similarity changes."
            )
        if "missing" in q or "gap" in q:
            required = (
                "\n".join(f"- **{skill}**: Required by this role template and not detected in the resume." for skill in missing_req)
                if missing_req else "No required skills from this role template are currently missing from the detected list."
            )
            preferred = (
                "\n".join(f"- **{skill}**: Preferred by this role template and not detected in the resume." for skill in missing_pref)
                if missing_pref else "No preferred skills from this role template are currently missing from the detected list."
            )
            next_step = f"Start with **{missing_req[0]}** from the required list." if missing_req else "Review preferred skills if they fit your interests and target projects."
            return f"### Skill gaps for {role}\n\n**Required**\n{required}\n\n**Preferred**\n{preferred}\n\n{next_step}"
        if "learn" in q or "first" in q:
            if missing_req:
                first_skill, skill_type = missing_req[0], "required"
            elif missing_pref:
                first_skill, skill_type = missing_pref[0], "preferred"
            else:
                current = skills[0] if skills else "a skill from your resume"
                return f"The current role template has no unmatched required or preferred skills in the detected list. You could deepen **{current}** through a small project, or compare your resume with another role template."
            complement = skills[0] if skills else "a language or tool already on your resume"
            return (
                f"### Suggested next skill: {first_skill}\n\n"
                f"It is listed as {skill_type} in the {role} template. Start with the fundamentals, practice it alongside {complement}, and build a small project with tests. Add it to your resume only after you have relevant experience."
            )
        if "improve" in q or "resume" in q:
            missing = ", ".join(missing_req[:3]) if missing_req else "role-relevant skills you have actually used"
            return (
                "### Resume improvement ideas\n\n"
                "1. Describe your contribution and the result in each project or experience bullet.\n"
                f"2. Consider evidence for these template requirements: {missing}. Do not list a skill you have not used.\n"
                "3. Organize the skills you can discuss into clear categories.\n"
                "4. Include working project or portfolio links that you have checked."
            )
        if "project" in q:
            project_skills = (missing_req + missing_pref)[:2] or skills[:2] or ["a role-relevant skill"]
            skill_text = " and ".join(project_skills)
            return (
                f"### Project idea for {role}\n\n"
                f"Build a small end-to-end project that applies {skill_text}. Include a README, tests, and a short explanation of your design choices. This gives you concrete work to discuss; it does not guarantee a change in the similarity score or hiring outcomes."
            )

        listed = ", ".join(skills[:5]) if skills else "no skills from the current taxonomy"
        missing = ", ".join(missing_req[:4]) if missing_req else "none from the required list"
        return (
            f"The current analysis compares your resume with **{role}** at **{score}% text similarity**.\n\n"
            f"Detected skill mentions: {listed}. Required skills not detected: {missing}.\n\n"
            "You can ask why the similarity is low, what skills are missing, what to learn next, how to improve your resume, or what project to build."
        )

    def explain_code(self, file_path: str, code_content: str, selected_lines: str = "") -> str:
        """Explains codebase files with architectural context and engineering detail."""
        basename = os.path.basename(file_path)
        language = os.path.splitext(basename)[1].lstrip(".") or "text"
        focus_code = selected_lines.strip() or code_content[:4000]
        if self.is_api_configured() and self.active_provider == "openai":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.active_key)
                prompt = f"""
File: {file_path}
{f'Selected snippet (explain this selection):' if selected_lines else 'File excerpt:'}
```{language}
{focus_code}
```

Explain this code according to:
1. Primary Purpose
2. Why it exists in the Resume Analysis & Career Guidance System
3. Important Functions / Classes
4. Inputs & Outputs
5. Connections to other modules (Preprocessor, TfidfMatcher, LangGraph Agent, etc.)
"""
                resp = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a Senior Staff Engineer. Provide deep technical explanations in markdown."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=900
                )
                return resp.choices[0].message.content
            except Exception as e:
                print(f"Code explanation API error: {e}")

        # Deterministic, file-aware explanation fallback
        return self._synthesize_code_explanation(file_path, code_content, selected_lines)

    def _synthesize_code_explanation(self, file_path: str, code_content: str, selected: str) -> str:
        """Provide a local structural explanation from the actual source text."""
        import ast
        import re

        normalized_path = file_path.replace("\\", "/")
        name = os.path.basename(normalized_path)
        lines = code_content.splitlines()
        symbols: List[str] = []
        imports: List[str] = []
        docstring = ""
        if name.endswith(".py"):
            try:
                tree = ast.parse(code_content)
                docstring = ast.get_docstring(tree) or ""
                for item in tree.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        args = ast.unparse(item.args)
                        symbols.append(f"{item.name}({args})")
                    elif isinstance(item, ast.ClassDef):
                        methods = [node.name for node in item.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
                        symbols.append(f"class {item.name}" + (f" (methods: {', '.join(methods)})" if methods else ""))
                for item in ast.walk(tree):
                    if isinstance(item, ast.Import):
                        imports.extend(alias.name for alias in item.names)
                    elif isinstance(item, ast.ImportFrom):
                        imports.append(f"{item.module or '.'} ({', '.join(alias.name for alias in item.names)})")
            except SyntaxError:
                symbols.append("Python source could not be parsed as a complete module")
        else:
            symbols = re.findall(r"(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|const)\s+([A-Za-z_$][\w$]*)", code_content)
            imports = re.findall(r"from\s+[\"']([^\"']+)[\"']|import\s+[\"']([^\"']+)[\"']", code_content)
            imports = [next(item for item in match if item) for match in imports]

        architecture = {
            "backend/app.py": "FastAPI application routes connect the browser to resume extraction, the LangGraph workflow, taxonomy files, chat, reports, presentation data, and the source explorer.",
            "backend/extractor.py": "ResumeExtractor parses uploaded PDF or text bytes and returns extracted text plus file metadata; the upload route calls it before analysis.",
            "ml/preprocessor.py": "ResumePreprocessor cleans extracted text and detects contact details and common resume sections; the first workflow node calls it.",
            "ml/skill_extractor.py": "SkillExtractor loads data/skills.json and finds taxonomy terms and aliases in resume text; the skill extraction node uses its categorized output.",
            "ml/tfidf_matcher.py": "CareerMatcher builds TF-IDF vectors for resume text and curated role templates, then ranks them with cosine similarity. The score is textual similarity, not hiring probability.",
            "ml/gap_analyzer.py": "SkillGapAnalyzer compares detected skills with required and preferred skills for the chosen role template and orders missing skills for study.",
            "agents/workflow.py": "This module compiles the LangGraph StateGraph and invokes its ordered processing nodes for the workflow API route.",
            "agents/nodes.py": "Each function is a workflow node: it updates analysis state, records a trace entry, and passes results to the following node.",
            "agents/state.py": "TypedDict definitions describe the values stored and passed between LangGraph nodes.",
            "llm/provider.py": "LLMProvider uses the configured OpenAI API when available and otherwise generates local, rule-based guidance; numerical career similarity stays in the ML matcher.",
            "reports/generator.py": "ReportGenerator formats workflow results as Markdown and ReportLab PDF output for the reports API.",
            "data/skills.json": "This JSON file is the maintainable skill taxonomy read by SkillExtractor.",
            "data/career_roles.json": "This JSON file defines the role templates and their required and preferred skills for the matcher and gap analyzer.",
            "frontend/src/api.ts": "This client wraps the app's HTTP endpoints; pages call these functions to upload resumes and request analysis, guidance, reports, and project files.",
        }
        connection = architecture.get(normalized_path, f"This is an actual workspace file at `{normalized_path}`; its imports and exported definitions show how it connects to the rest of the project.")
        overview = docstring.strip() or connection
        symbol_text = ", ".join(symbols[:18]) if symbols else "No top-level functions or classes were detected."
        import_text = ", ".join(dict.fromkeys(imports[:18])) if imports else "No imports were detected."
        selected_text = selected.strip()
        scope = "The explanation is focused on the selected excerpt." if selected_text else "The explanation describes the full file structure."
        excerpt = f"\n\n#### Selected excerpt\n```\n{selected_text[:4000]}\n```" if selected_text else ""

        return f"""### Local Code Explanation: `{normalized_path}` ({len(lines)} lines)

#### What it does
{overview}

#### Why it exists
{connection}

#### Important functions and types
{symbol_text}

#### Inputs and outputs
{', '.join(symbols[:8]) if symbols else 'See the file definitions above.'} These signatures show the explicit inputs; the implementation and returned values are visible in the source. {scope}

#### Connections
Imports found in this file: {import_text}. {connection}
{excerpt}

This explanation is generated locally from the source structure. Configure `OPENAI_API_KEY` to request a deeper LLM explanation.
"""
