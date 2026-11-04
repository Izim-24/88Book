from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.text.paragraph import Paragraph
from docx.shared import Inches, Pt, RGBColor

root = Path(r'D:\STUDY\88Book\deliverables')
source = root / 'Multimodal_Ecommerce_Search_Chapters_1_to_4_Diagrams_Refined.docx'
target = root / 'Multimodal_Ecommerce_Search_Chapters_1_to_4_No_Header_Centered_Cover.docx'
doc = Document(source)

# Clear every header variant without changing page geometry or footer content.
for section in doc.sections:
    for header in (section.header, section.first_page_header, section.even_page_header):
        for paragraph in header.paragraphs:
            paragraph.clear()
        for table in list(header.tables):
            table._element.getparent().remove(table._element)

cover_table = doc.tables[0]
assert cover_table.cell(0, 0).text.strip() == 'STUDENT INFORMATION'
assert cover_table.cell(1, 0).text.strip() == 'Student name'
details = [
    'Student name: Lê Quang Minh',
    'Student ID: B23DCCN550',
    'Class: E23TNTT01-B',
    'Course: Information Systems Analysis and Design',
]
for index, line in enumerate(details):
    element = OxmlElement('w:p')
    cover_table._tbl.addprevious(element)
    paragraph = Paragraph(element, cover_table._parent)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Inches(0.72) if index == 0 else Pt(0)
    paragraph.paragraph_format.space_after = Pt(5)
    run = paragraph.add_run(line)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11.5)
    run.font.color.rgb = RGBColor(0, 0, 0)
cover_table._tbl.getparent().remove(cover_table._tbl)

# Replace the five spacer lines before the old cover table with one deliberate gap.
for paragraph in doc.paragraphs:
    if paragraph.text == 'Requirements, Analysis, AI Applications and Design':
        next_element = paragraph._p.getnext()
        while next_element is not None and next_element.tag.endswith('}p'):
            next_paragraph = Paragraph(next_element, paragraph._parent)
            if next_paragraph.text.strip():
                break
            following = next_element.getnext()
            next_element.getparent().remove(next_element)
            next_element = following
        break

# Keep the city and year separated from the centered student block.
for paragraph in doc.paragraphs:
    if paragraph.text.strip() == 'Hanoi, 2026':
        paragraph.paragraph_format.space_before = Inches(1.15)
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        break

doc.save(target)
print(target)
