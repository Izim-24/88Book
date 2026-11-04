from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree as ET
from docx import Document
import shutil

root=Path(r'D:\STUDY\88Book\deliverables')
docx=root/'Multimodal_Ecommerce_Search_Chapters_1_to_4.docx'
doc=Document(docx)
heads=[p.text for p in doc.paragraphs if p.style.name=='Heading 1']
assert 'CHAPTER 4. DESIGN' in heads
assert all(any(p.text.startswith('4.'+str(i)) for p in doc.paragraphs) for i in range(1,6))
assert len(doc.inline_shapes)>=15
assert len(doc.tables)>=23
with ZipFile(docx) as z:
    assert z.testzip() is None
    for f in ['word/document.xml','word/styles.xml','[Content_Types].xml']:
        ET.fromstring(z.read(f))
xmi=root/'visual_paradigm'/'multimodal_search_uml21.xmi'
tree=ET.parse(xmi)
assert len(tree.findall('.//packagedElement'))>=15
sql=(root/'visual_paradigm'/'multimodal_search_postgresql.sql').read_text(encoding='utf-8')
assert sql.count('CREATE TABLE')==6 and sql.count('REFERENCES')==5
assert len(list((root/'generated_code').rglob('*.java')))==8
old=root/'generated_code'/'src'/'README.txt'
if old.exists(): old.unlink()
bundle=root/'Visual_Paradigm_Import_Package.zip'
with ZipFile(bundle,'w',ZIP_DEFLATED) as z:
    for folder in ['visual_paradigm','figures','generated_code']:
        for f in (root/folder).rglob('*'):
            if f.is_file() and f.name!='contact_sheet.png': z.write(f,f.relative_to(root))
print('Headings:',heads)
print('Paragraphs:',len(doc.paragraphs),'tables:',len(doc.tables),'figures:',len(doc.inline_shapes))
print('XMI model elements:',len(tree.findall('.//packagedElement')),'SQL tables:',sql.count('CREATE TABLE'))
print('Bundle bytes:',bundle.stat().st_size)
