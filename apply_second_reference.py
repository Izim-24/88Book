from pathlib import Path
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

BASE=Path(r'D:\STUDY\88Book\deliverables')
SOURCE=BASE/'Multimodal_Ecommerce_Search_Chapters_1_to_4_Reference_Style.docx'
TARGET=BASE/'Multimodal_Ecommerce_Search_Chapters_1_to_4_Final_Style.docx'
doc=Document(SOURCE)
BLACK=RGBColor(0,0,0)
sec=doc.sections[0]

# The second reference uses a small running identity line and clearer heading separation.
sec.different_first_page_header_footer=True
header=sec.header.paragraphs[0]
header.clear(); header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
r=header.add_run('Multimodal E-Commerce Search  ·  ISAD term essay')
r.font.name='Times New Roman'; r.font.size=Pt(8.5); r.font.color.rgb=BLACK
sec.header_distance=Inches(0.36)

normal=doc.styles['Normal']
normal.font.name='Times New Roman'; normal.font.size=Pt(11.5); normal.font.color.rgb=BLACK
normal.paragraph_format.line_spacing=1.25
normal.paragraph_format.space_after=Pt(6)
h1=doc.styles['Heading 1']
h1.font.name='Times New Roman'; h1.font.size=Pt(17); h1.font.bold=True; h1.font.color.rgb=BLACK
h1.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.LEFT
h1.paragraph_format.space_before=Pt(10); h1.paragraph_format.space_after=Pt(12)
h2=doc.styles['Heading 2']
h2.font.name='Times New Roman'; h2.font.size=Pt(13); h2.font.bold=True; h2.font.color.rgb=BLACK
h2.paragraph_format.space_before=Pt(15); h2.paragraph_format.space_after=Pt(6)
h3=doc.styles['Heading 3']
h3.font.name='Times New Roman'; h3.font.size=Pt(11.5); h3.font.bold=True; h3.font.color.rgb=BLACK
h3.paragraph_format.space_before=Pt(10); h3.paragraph_format.space_after=Pt(5)

def rule_under(paragraph):
    pPr=paragraph._p.get_or_add_pPr()
    pBdr=pPr.find(qn('w:pBdr'))
    if pBdr is None: pBdr=OxmlElement('w:pBdr'); pPr.append(pBdr)
    bottom=pBdr.find(qn('w:bottom'))
    if bottom is None: bottom=OxmlElement('w:bottom'); pBdr.append(bottom)
    bottom.set(qn('w:val'),'single'); bottom.set(qn('w:sz'),'5')
    bottom.set(qn('w:space'),'7'); bottom.set(qn('w:color'),'000000')

first_chapter=next(i for i,p in enumerate(doc.paragraphs) if p.style.name=='Heading 1' and p.text.startswith('CHAPTER 1.'))
for i,p in enumerate(doc.paragraphs):
    text=p.text.strip()
    if i==7: # main cover title
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.size=Pt(22); r.font.bold=True; r.font.color.rgb=BLACK
        p.paragraph_format.space_before=Pt(20); p.paragraph_format.space_after=Pt(11)
    elif i==8: # explanatory subtitle
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.size=Pt(12); r.font.italic=True; r.font.color.rgb=BLACK
        p.paragraph_format.space_after=Pt(12)
    if text=='CONTENTS':
        p.text='Contents'; p.alignment=WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs: r.font.name='Times New Roman'; r.font.size=Pt(17); r.font.bold=True; r.font.color.rgb=BLACK
        rule_under(p)
        continue
    if i<first_chapter and i>16 and text:
        p.paragraph_format.left_indent=Inches(0 if text.startswith(('CHAPTER ','CONCLUSION','REFERENCES')) else 0.25)
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.size=Pt(10.5); r.font.color.rgb=BLACK
            if text.startswith('CHAPTER '): r.bold=True
    if p.style.name=='Heading 1' and (text.startswith('CHAPTER ') or text in ('CONCLUSION','REFERENCES')):
        p.alignment=WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.keep_with_next=True
        rule_under(p)
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.size=Pt(17); r.font.bold=True; r.font.color.rgb=BLACK
    elif p.style.name=='Heading 2':
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.size=Pt(13); r.font.bold=True; r.font.color.rgb=BLACK
    elif p.style.name=='Heading 3':
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.size=Pt(11.5); r.font.bold=True; r.font.color.rgb=BLACK
    elif i>=first_chapter and p.style.name=='Normal':
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.size=Pt(11.5); r.font.color.rgb=BLACK

if 'Reference Table Caption' not in doc.styles:
    cap=doc.styles.add_style('Reference Table Caption',WD_STYLE_TYPE.PARAGRAPH)
else: cap=doc.styles['Reference Table Caption']
cap.font.name='Times New Roman'; cap.font.size=Pt(10); cap.font.bold=True; cap.font.color.rgb=BLACK
cap.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.LEFT
cap.paragraph_format.space_before=Pt(9); cap.paragraph_format.space_after=Pt(4)
cap.paragraph_format.keep_with_next=True

captions={
2:'1.1. Stakeholders and their responsibilities',
3:'1.2. Requirements elicitation methods and evidence',
4:'1.3. Prototype scope and future capabilities',
5:'1.4. Functional requirements and acceptance evidence',
6:'1.5. Requirement traceability snapshot',
7:'1.6. Elicitation questions for the order flow',
8:'2.1. Use cases, actors and expected results',
9:'2.2. Place order responsibilities and failure responses',
10:'2.3. Domain entities and key attributes',
11:'2.4. Product catalog data validation',
12:'2.5. Order state transitions',
13:'2.6. Analysis decisions and validation evidence',
14:'3.1. Recommendation approaches',
15:'3.2. Natural language query interpretation',
16:'3.3. Example of text and image score fusion',
17:'3.4. Data governance records',
18:'3.5. Evaluation plan by search mode',
19:'3.6. AI risks and mitigation',
20:'4.1. Analysis classes and relationships',
21:'4.2. Relational tables, keys and constraints',
22:'4.3. Design classes and method contracts',
23:'4.4. Layer responsibilities and dependencies',
24:'4.5. Generated code package mapping',
}
for i,t in enumerate(doc.tables,1):
    if i>1:
        p=doc.add_paragraph(style='Reference Table Caption')
        r=p.add_run('Table '+captions[i]); r.font.name='Times New Roman'; r.font.size=Pt(10); r.font.bold=True; r.font.color.rgb=BLACK
        t._tbl.addprevious(p._p)
    for ri,row in enumerate(t.rows):
        for cell in row.cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.name='Times New Roman'; r.font.size=Pt(9.5); r.font.color.rgb=BLACK
                    if ri==0: r.bold=True
            # The requested white table cells override both references' optional header shading.
            tcPr=cell._tc.get_or_add_tcPr()
            for shd in list(tcPr.findall(qn('w:shd'))): tcPr.remove(shd)

assert any(p.text.strip()=='CHAPTER 4. DESIGN' for p in doc.paragraphs)
doc.save(TARGET)
print(TARGET)
