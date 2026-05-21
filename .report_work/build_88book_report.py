from pathlib import Path
import shutil

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = Path(r"C:\Users\quang\Downloads\N5.docx")
OUT = ROOT / "Bao_cao_do_an_88Book_theo_mau_N5.docx"


REPLACEMENTS = {
    "BÀI TẬP LỚN": "BÁO CÁO ĐỒ ÁN",
    "Đề bài: XÂY DỰNG WEBSITE BÁN SÁCH TRỰC TUYẾN": "Đề tài: XÂY DỰNG WEBSITE BÁN SÁCH TRỰC TUYẾN 88BOOK",
    "Frontend chạy bằng gì?": "Frontend",
    "Backend chạy bằng gì?": "Backend",
    "Database chạy bằng gì?": "Database",
    "Reh các màn hình chính.": "React quản lý state giao diện và tổ chức các màn hình chính.",
}


def replace_in_paragraph(paragraph):
    if not paragraph.runs:
        return
    full = "".join(run.text for run in paragraph.runs)
    new = full
    for old, repl in REPLACEMENTS.items():
        new = new.replace(old, repl)
    if new == full:
        return

    paragraph.runs[0].text = new
    for run in paragraph.runs[1:]:
        run.text = ""


def iter_paragraphs(doc):
    for paragraph in doc.paragraphs:
        yield paragraph
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    yield paragraph


def main():
    shutil.copyfile(TEMPLATE, OUT)
    doc = Document(OUT)

    for paragraph in iter_paragraphs(doc):
        replace_in_paragraph(paragraph)

    # Keep document metadata aligned with the deliverable.
    props = doc.core_properties
    props.title = "Báo cáo đồ án 88Book"
    props.subject = "Xây dựng website bán sách trực tuyến 88Book"
    props.keywords = "88Book, React, Vite, Node.js, Express, SQL Server, báo cáo đồ án"
    props.comments = "Created from N5 reference structure and adapted for the 88Book project."

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
