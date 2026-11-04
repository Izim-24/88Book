from pathlib import Path
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

BASE=Path(r'D:\STUDY\88Book\deliverables')
SOURCE=BASE/'Multimodal_Ecommerce_Search_Chapters_1_to_4.docx'
TARGET=BASE/'Multimodal_Ecommerce_Search_Chapters_1_to_4_Reference_Style.docx'
doc=Document(SOURCE)
black=RGBColor(0,0,0)
sec=doc.sections[0]
sec.page_width=Inches(8.2677)
sec.page_height=Inches(11.6929)
sec.top_margin=Inches(0.85)
sec.bottom_margin=Inches(0.72)
sec.left_margin=Inches(0.80)
sec.right_margin=Inches(0.80)
sec.footer_distance=Inches(0.40)
sec.different_first_page_header_footer=True

def set_style(name, size, bold=False, align=None, before=0, after=0, line=1.15, keep_next=False):
    s=doc.styles[name]
    s.font.name='Times New Roman'; s.font.size=Pt(size); s.font.bold=bold; s.font.color.rgb=black
    s.paragraph_format.space_before=Pt(before); s.paragraph_format.space_after=Pt(after)
    s.paragraph_format.line_spacing=line
    s.paragraph_format.keep_with_next=keep_next
    if align is not None: s.paragraph_format.alignment=align
    return s
set_style('Normal',12,False,WD_ALIGN_PARAGRAPH.JUSTIFY,0,5,1.24)
set_style('Title',18,True,WD_ALIGN_PARAGRAPH.CENTER,0,10,1.15,True)
set_style('Heading 1',16,True,WD_ALIGN_PARAGRAPH.CENTER,14,16,1.15,True)
set_style('Heading 2',13,True,WD_ALIGN_PARAGRAPH.LEFT,12,7,1.15,True)
set_style('Heading 3',12,True,WD_ALIGN_PARAGRAPH.LEFT,9,5,1.15,True)
if 'Reference Caption' not in doc.styles:
    s=doc.styles.add_style('Reference Caption',WD_STYLE_TYPE.PARAGRAPH)
else: s=doc.styles['Reference Caption']
s.font.name='Times New Roman'; s.font.size=Pt(11); s.font.color.rgb=black
s.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER
s.paragraph_format.space_before=Pt(5); s.paragraph_format.space_after=Pt(11)
s.paragraph_format.line_spacing=1.15
s.paragraph_format.keep_with_next=False

ch1=next(i for i,p in enumerate(doc.paragraphs) if p.style.name=='Heading 1' and p.text.startswith('CHAPTER 1.'))
chapter4=next(p for p in doc.paragraphs if p.style.name=='Heading 1' and p.text.strip()=='CHAPTER 4. DESIGN')
assert chapter4.text.strip()=='CHAPTER 4. DESIGN'

caption_rx=re.compile(r'^(Figure|Table)\s+(\d+(?:\.\d+)?)\.?\s*[:.]?\s*(.*)$',re.I)
prev_kind=''
for i,p in enumerate(doc.paragraphs):
    text=p.text.strip()
    if not text: continue
    if i<ch1:
        # Cover and contents retain their semantic placement, but use the reference typography.
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.color.rgb=black
            if i>15: r.font.size=Pt(16 if p.style.name=='Heading 1' else 10.5)
        if p.style.name=='Heading 1':
            p.alignment=WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before=Pt(0)
            p.paragraph_format.space_after=Pt(13)
        elif i>15:
            p.paragraph_format.space_after=Pt(1)
            p.paragraph_format.line_spacing=1.0
            p.alignment=WD_ALIGN_PARAGRAPH.LEFT
        elif i in (6,7,8):
            p.alignment=WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after=Pt(7)
        continue
    if p.style.name.startswith('Heading'):
        for r in p.runs:
            r.font.name='Times New Roman'; r.font.color.rgb=black
            r.font.bold=True
            r.font.size=Pt(16 if p.style.name=='Heading 1' else 13 if p.style.name=='Heading 2' else 12)
        p.paragraph_format.first_line_indent=Pt(0)
        if p.style.name=='Heading 1' and (text.startswith('CHAPTER ') or text in ('CONCLUSION','REFERENCES')):
            p.paragraph_format.page_break_before=True
        prev_kind='heading'
        continue
    m=caption_rx.match(text)
    if m:
        p.style=doc.styles['Reference Caption']
        prefix=f'{m.group(1)} {m.group(2)}:'
        suffix=m.group(3).strip()
        p.clear()
        r=p.add_run(prefix+' '); r.bold=True; r.font.name='Times New Roman'; r.font.size=Pt(11); r.font.color.rgb=black
        r=p.add_run(suffix); r.italic=True; r.font.name='Times New Roman'; r.font.size=Pt(11); r.font.color.rgb=black
        prev_kind='caption'; continue
    p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent=Inches(0.23) if prev_kind=='body' else Pt(0)
    p.paragraph_format.space_after=Pt(5)
    p.paragraph_format.line_spacing=1.24
    p.paragraph_format.widow_control=True
    for r in p.runs:
        r.font.name='Times New Roman'; r.font.size=Pt(12); r.font.color.rgb=black
    prev_kind='body'

def set_borders(cell):
    tcPr=cell._tc.get_or_add_tcPr()
    borders=tcPr.first_child_found_in('w:tcBorders')
    if borders is None:
        borders=OxmlElement('w:tcBorders'); tcPr.append(borders)
    for edge in ('top','left','bottom','right'):
        tag=qn('w:'+edge); el=borders.find(tag)
        if el is None: el=OxmlElement('w:'+edge); borders.append(el)
        el.set(qn('w:val'),'single'); el.set(qn('w:sz'),'6'); el.set(qn('w:color'),'000000')
    for shd in list(tcPr.findall(qn('w:shd'))): tcPr.remove(shd)
    mar=tcPr.first_child_found_in('w:tcMar')
    if mar is None: mar=OxmlElement('w:tcMar'); tcPr.append(mar)
    for edge in ('top','left','bottom','right'):
        tag=qn('w:'+edge); el=mar.find(tag)
        if el is None: el=OxmlElement('w:'+edge); mar.append(el)
        el.set(qn('w:w'),'90'); el.set(qn('w:type'),'dxa')

for t in doc.tables:
    t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=True
    for ri,row in enumerate(t.rows):
        for cell in row.cells:
            set_borders(cell); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for p in cell.paragraphs:
                p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY if ri else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before=Pt(0); p.paragraph_format.space_after=Pt(0)
                p.paragraph_format.line_spacing=1.15
                for r in p.runs:
                    r.font.name='Times New Roman'; r.font.size=Pt(10.5); r.font.color.rgb=black
                    if ri==0: r.bold=True
    # Remove any table-level shading; keep white background throughout.
    tblPr=t._tbl.tblPr
    for shd in list(tblPr.findall(qn('w:shd'))): tblPr.remove(shd)

# Centered page numbers from the second page onward.
footer=sec.footer.paragraphs[0]
footer.clear(); footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
begin=OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'),'begin')
instr=OxmlElement('w:instrText'); instr.set(qn('xml:space'),'preserve'); instr.text=' PAGE '
separate=OxmlElement('w:fldChar'); separate.set(qn('w:fldCharType'),'separate')
display=OxmlElement('w:t'); display.text='1'
end=OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'),'end')
for el in (begin,instr,separate,display,end):
    run=footer.add_run(); run.font.name='Times New Roman'; run.font.size=Pt(10); run.font.color.rgb=black
    run._r.append(el)

doc.save(TARGET)
print(TARGET)
