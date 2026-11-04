from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as ET

from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path(r'D:\STUDY\88Book')
OUT = ROOT / 'deliverables'
BASE = OUT / 'Multimodal_Ecommerce_Search_Chapters_1_to_4_Expanded.docx'
FINAL = OUT / 'Multimodal_Ecommerce_Search_Chapters_1_to_4_Diagrams_Refined.docx'
IMAGES = OUT / 'redrawn_diagrams'
FILES = {
    5: 'figure5_checkout_activity.png',
    6: 'figure6_order_data_model.png',
    9: 'figure9_workflow.png',
    11: 'figure11_analysis_classes.png',
    12: 'figure12_data_model.png',
    13: 'figure13_design_classes.png',
    14: 'figure14_layers.png',
}

doc = Document(BASE)
pars = doc.paragraphs
replaced = []
for figure, name in FILES.items():
    captions = [i for i, p in enumerate(pars) if p.text.strip().startswith(f'Figure {figure}:')]
    if len(captions) != 1:
        raise RuntimeError(f'Figure {figure} captions: {len(captions)}')
    idx = captions[0]
    image_par = None
    for j in range(idx - 1, max(-1, idx - 5), -1):
        if pars[j]._p.xpath('.//a:blip'):
            image_par = pars[j]
            break
    if image_par is None:
        raise RuntimeError(f'Figure {figure} image missing')
    image_par.clear()
    image_par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    image_par.add_run().add_picture(str(IMAGES / name), width=Inches(6.55))
    replaced.append(figure)
doc.save(FINAL)

# Add the two classes shown in the revised design figures to importable XMI.
xmi_path = OUT / 'visual_paradigm' / 'multimodal_search_uml21.xmi'
tree = ET.parse(xmi_path)
model = tree.getroot().find('{http://www.omg.org/spec/UML/20110701}Model')
xmi_type = '{http://www.omg.org/spec/XMI/20110701}type'
xmi_id = '{http://www.omg.org/spec/XMI/20110701}id'
existing = {item.attrib.get('name') for item in model.findall('packagedElement')}
for class_name, operations in {
    'OrderQueryService': ('findOwned',),
    'PostgresOrderRepository': ('findOwned', 'findLatestOwned'),
}.items():
    if class_name in existing:
        continue
    el = ET.SubElement(model, 'packagedElement', {xmi_type: 'uml:Class', xmi_id: class_name, 'name': class_name})
    for n, op in enumerate(operations):
        ET.SubElement(el, 'ownedOperation', {xmi_id: f'{class_name}_o{n}', 'name': op})
tree.write(xmi_path, encoding='utf-8', xml_declaration=True)

readme = OUT / 'visual_paradigm' / 'README.txt'
txt = readme.read_text(encoding='utf-8')
txt = txt.replace('The PNG files in ../figures show', 'The PNG files in ../redrawn_diagrams show')
readme.write_text(txt, encoding='utf-8')

archive = OUT / 'Visual_Paradigm_Import_Package_Refined.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for folder in ('visual_paradigm', 'redrawn_diagrams', 'generated_code'):
        for path in (OUT / folder).rglob('*'):
            if path.is_file():
                z.write(path, path.relative_to(OUT).as_posix())

print('DOCX', FINAL, FINAL.stat().st_size)
print('replaced', replaced)
print('ZIP', archive, archive.stat().st_size)
