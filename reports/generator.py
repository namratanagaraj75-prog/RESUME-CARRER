"""
Report Generation Engine
Generates professional academic and executive reports in Markdown, JSON, and PDF formats.
"""
import os
import json
from datetime import datetime
from typing import Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportGenerator:
    def __init__(self, output_dir: str = None):
        if output_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            output_dir = os.path.join(base_dir, "reports", "generated")
        os.makedirs(output_dir, exist_ok=True)
        self.output_dir = output_dir

    def generate_markdown_report(self, state: Dict[str, Any], report_type: str = "comprehensive") -> str:
        prep = state.get("preprocessed_data", {})
        contact = prep.get("contact_info", {})
        skills_data = state.get("extracted_skills", {})
        matches = state.get("career_match_results", {})
        gap = state.get("skill_gap_results", {})
        guidance = state.get("llm_guidance", {})
        roadmap = state.get("roadmap", [])
        trace = state.get("workflow_trace", [])

        top_match = matches.get("top_match", {})
        candidate_name = contact.get("name", "Candidate")
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        md = f"""# AI-POWERED RESUME ANALYSIS & CAREER GUIDANCE REPORT
**Candidate**: {candidate_name}  
**Generated Date**: {now_str}  
**System**: AI Resume Analysis & Career Guidance System (LangGraph + scikit-learn TF-IDF)

---

## 1. RESUME ANALYSIS SUMMARY
- **Email**: {contact.get('email', 'N/A')} | **Phone**: {contact.get('phone', 'N/A')}
- **Top Role Template Match**: {top_match.get('title', 'N/A')}
- **Cosine Similarity**: {top_match.get('match_percentage', 0.0)}% (TF-IDF text similarity)
- **Detected Skill Mentions**: {skills_data.get('total_count', 0)} taxonomy matches in the resume
- **Template Alignment**: {guidance.get('alignment_label', 'Text similarity')}

> **Executive Assessment**:  
> {guidance.get('executive_summary', 'No summary generated.')}

---

## 2. DETECTED SKILLS TAXONOMY
"""
        by_cat = skills_data.get("by_category", {})
        for cat, items in by_cat.items():
            formatted_cat = cat.replace("_", " ").title()
            skill_list = ", ".join([f"{item['name']} (x{item['frequency']})" for item in items])
            md += f"- **{formatted_cat}**: {skill_list}\n"

        md += f"""
---

## 3. MATHEMATICAL CAREER MATCHING (SCIKIT-LEARN TF-IDF)
Cosine Similarity Metric: $\\cos(\\theta) = \\frac{{\\mathbf{{A}} \\cdot \\mathbf{{B}}}}{{\\|\\mathbf{{A}}\\| \\|\\mathbf{{B}}\\|}}$

| Role Title | Category | Cosine Similarity | Match % | Required Terms Detected | Required Terms Not Detected |
| :--- | :--- | :--- | :--- | :--- | :--- |
"""
        for r in matches.get("rankings", [])[:6]:
            md += f"| **{r.get('title')}** | {r.get('category')} | {r.get('similarity_score')} | {r.get('match_percentage')}% | {len(r.get('matched_required_skills', []))} | {len(r.get('missing_required_skills', []))} |\n"

        md += f"""
---

## 4. ROLE TEMPLATE SKILL COVERAGE: {gap.get('target_role_title', 'Target Role')}
- **Required Skill Terms Detected**: {gap.get('required_match_rate', 0)}%
- **Overall Template Skill Coverage**: {gap.get('overall_readiness_score', 0)}%

### Critical Missing Skills (Priority 1)
"""
        for item in gap.get("prioritized_learning", []):
            if item.get("priority_level") == 1:
                md += f"- **{item['skill']}**: {item['reason']}\n"

        md += "\n### Secondary Skills (Priority 2)\n"
        for item in gap.get("prioritized_learning", []):
            if item.get("priority_level") == 2:
                md += f"- **{item['skill']}**: {item['reason']}\n"

        md += f"""
---

## 5. CAREER PROGRESSION ROADMAP (16-WEEK TIMELINE)
"""
        for stage in roadmap:
            md += f"### Stage {stage['stage_number']}: {stage['stage_name']} ({stage['timeline']})\n"
            md += f"*{stage['description']}*\n"
            for d in stage.get("deliverables", []):
                md += f"- **Deliverable**: {d}\n"
            for a in stage.get("action_items", []):
                md += f"  - {a}\n"
            md += "\n"

        md += f"""
---

## 6. LANGGRAPH AGENT WORKFLOW TRACE
Total pipeline steps executed: {len(trace)}

| Step | Node Name | Duration | Status | Summary |
| :--- | :--- | :--- | :--- | :--- |
"""
        for idx, t in enumerate(trace, 1):
            md += f"| {idx} | `{t['node_name']}` | {t['duration_ms']} ms | {t['status']} | {t['summary']} |\n"

        return md

    def generate_pdf_report(self, state: Dict[str, Any], filename: str = None) -> str:
        """Generates a styled, academic-grade PDF report."""
        if not filename:
            cand = state.get("preprocessed_data", {}).get("contact_info", {}).get("name", "candidate")
            safe_name = "".join(c for c in cand if c.isalnum() or c in (' ', '_')).rstrip().replace(' ', '_').lower()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"career_report_{safe_name}_{timestamp}.pdf"

        file_path = os.path.join(self.output_dir, filename)

        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=3
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
            spaceAfter=10
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1E3A8A'),
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#334155'),
            spaceAfter=2
        )
        callout_style = ParagraphStyle(
            'Callout',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=4,
            spaceAfter=6
        )

        story = []

        # Title Block
        story.append(Paragraph("AI-POWERED RESUME ANALYSIS & CAREER GUIDANCE REPORT", title_style))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y - %H:%M:%S')}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=8))

        prep = state.get("preprocessed_data", {})
        contact = prep.get("contact_info", {})
        matches = state.get("career_match_results", {})
        top_match = matches.get("top_match", {})
        gap = state.get("skill_gap_results", {})
        guidance = state.get("llm_guidance", {})

        # Executive Metrics Table
        summary_data = [
            [
                Paragraph(f"<b>Candidate:</b> {contact.get('name', 'N/A')}", body_style),
                Paragraph(f"<b>Top Role Template:</b> {top_match.get('title', 'N/A')}", body_style),
                Paragraph(f"<b>Cosine Similarity:</b> {top_match.get('match_percentage', 0.0)}%", body_style)
            ],
            [
                Paragraph(f"<b>Email:</b> {contact.get('email', 'N/A')}", body_style),
                Paragraph(f"<b>Template Skill Coverage:</b> {gap.get('overall_readiness_score', 0.0)}%", body_style),
                Paragraph(f"<b>Detected Skills:</b> {state.get('extracted_skills', {}).get('total_count', 0)}", body_style)
            ]
        ]
        t = Table(summary_data, colWidths=[200, 180, 160])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 6))

        # Executive Assessment
        story.append(Paragraph("1. ROLE TEMPLATE ALIGNMENT", h2_style))
        story.append(Paragraph(f"<b>Label:</b> {guidance.get('alignment_label', 'Text similarity')}", body_style))
        story.append(Paragraph(guidance.get('executive_summary', ''), callout_style))

        # Career Matching Table
        story.append(Paragraph("2. MATHEMATICAL ML MATCHING (TF-IDF & COSINE SIMILARITY)", h2_style))
        role_table_data = [["Role Title", "Category", "Cosine Sim", "Match %", "Req Terms Detected", "Req Terms Missing"]]
        for r in matches.get("rankings", [])[:5]:
            role_table_data.append([
                r.get('title'),
                r.get('category'),
                str(r.get('similarity_score')),
                f"{r.get('match_percentage')}%",
                str(len(r.get('matched_required_skills', []))),
                str(len(r.get('missing_required_skills', [])))
            ])
        rt = Table(role_table_data, colWidths=[150, 110, 80, 70, 65, 65])
        rt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F1F5F9')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ALIGN', (2,0), (-1,-1), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(rt)
        story.append(Spacer(1, 6))

        # Skill Gaps
        story.append(Paragraph(f"3. SKILL GAP REMEDIATION: {gap.get('target_role_title', 'Target Role')}", h2_style))
        missing_req = gap.get("missing_required", [])
        if missing_req:
            story.append(Paragraph(f"<b>Required Terms Not Detected:</b> {', '.join(missing_req)}", body_style))
        else:
            story.append(Paragraph("<b>Required Terms Not Detected:</b> None from the selected role template.", body_style))

        missing_pref = gap.get("missing_preferred", [])
        if missing_pref:
            story.append(Paragraph(f"<b>Preferred Growth Skills:</b> {', '.join(missing_pref)}", body_style))

        # Workflow execution trace
        story.append(Paragraph("4. LANGGRAPH AGENT WORKFLOW TRACE", h2_style))
        trace = state.get("workflow_trace", [])
        trace_data = [["Node", "Duration", "Status", "Execution Summary"]]
        for item in trace:
            trace_data.append([
                item.get('node_name').replace('node_', ''),
                f"{item.get('duration_ms')}ms",
                item.get('status'),
                Paragraph(item.get('summary', ''), body_style)
            ])
        tt = Table(trace_data, colWidths=[100, 60, 70, 310])
        tt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7.5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(tt)

        doc.build(story)
        return file_path
