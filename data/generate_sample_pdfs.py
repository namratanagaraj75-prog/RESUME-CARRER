"""
Generate real PDF versions of the sample resumes using ReportLab.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def txt_to_pdf(txt_path, pdf_path):
    with open(txt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=3
    )

    story = []
    if lines:
        story.append(Paragraph(lines[0].strip(), title_style))
    if len(lines) > 1:
        story.append(Paragraph(lines[1].strip(), body_style))
        story.append(Spacer(1, 8))

    for line in lines[2:]:
        line = line.strip()
        if not line:
            story.append(Spacer(1, 4))
            continue
        if line.isupper() and len(line) < 35:
            story.append(Paragraph(line, section_style))
        else:
            safe_text = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(safe_text, body_style))

    doc.build(story)
    print(f"Generated PDF: {pdf_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(base_dir, 'sample_resumes')
    for fname in os.listdir(sample_dir):
        if fname.endswith('.txt'):
            txt_file = os.path.join(sample_dir, fname)
            pdf_file = os.path.join(sample_dir, fname.replace('.txt', '.pdf'))
            txt_to_pdf(txt_file, pdf_file)
