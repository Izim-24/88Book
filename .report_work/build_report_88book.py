# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(r"C:\Users\quang\Desktop\88Book-main\88Book-main")
OUT = ROOT / "Bao_cao_project_88Book.docx"
DIAGRAM_DIR = ROOT / ".report_work" / "diagrams"
SHOT_DIR = ROOT / ".report_work" / "screenshots_real"


FONT = "Times New Roman"
GREEN = RGBColor(64, 87, 47)
MUTED = RGBColor(92, 76, 55)
LIGHT_GREEN = "E8F0DF"
LIGHT_TAN = "F7F1E7"
BORDER = "8A7A61"


def set_run_font(run, size=None, bold=None, italic=None, color=None):
    run.font.name = FONT
    run._element.rPr.rFonts.set(qn("w:ascii"), FONT)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color is not None:
        run.font.color.rgb = color


def apply_doc_styles(doc: Document):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.49)
    section.footer_distance = Inches(0.49)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = FONT
    normal._element.rPr.rFonts.set(qn("w:ascii"), FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    normal.font.size = Pt(12)
    normal.paragraph_format.line_spacing = 1.15
    normal.paragraph_format.space_after = Pt(6)

    for name, size, color, before, after in [
        ("Title", 20, GREEN, 0, 10),
        ("Heading 1", 16, GREEN, 16, 8),
        ("Heading 2", 14, GREEN, 12, 6),
        ("Heading 3", 12, MUTED, 8, 4),
    ]:
        style = styles[name]
        style.font.name = FONT
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = color
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.line_spacing = 1.15

    for name in ["List Bullet", "List Number"]:
        style = styles[name]
        style.font.name = FONT
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
        style.font.size = Pt(12)
        style.paragraph_format.space_after = Pt(3)
        style.paragraph_format.line_spacing = 1.15


def add_footer(section):
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = footer.add_run("88Book - Báo cáo đồ án | Trang ")
    set_run_font(r, size=10, color=MUTED)
    add_field(footer, "PAGE")


def add_field(paragraph, field_code: str):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = field_code
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    fld_text = OxmlElement("w:t")
    fld_text.text = ""
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(fld_text)
    run._r.append(fld_end)
    set_run_font(run, size=10, color=MUTED)


def paragraph(text="", style=None, align=None, before=None, after=None, bold=False):
    p = doc.add_paragraph(style=style)
    if align is not None:
        p.alignment = align
    if before is not None:
        p.paragraph_format.space_before = Pt(before)
    if after is not None:
        p.paragraph_format.space_after = Pt(after)
    if text:
        r = p.add_run(text)
        set_run_font(r, bold=bold)
    return p


def add_text(text, style=None):
    p = doc.add_paragraph(style=style)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(text)
    set_run_font(r)
    return p


def add_bullet(text):
    p = doc.add_paragraph(style="List Bullet")
    r = p.add_run(text)
    set_run_font(r)
    return p


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_text(cell, text, bold=False, color=None):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(str(text))
    set_run_font(run, size=10.5, bold=bold, color=color)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def set_cell_width(cell, width_in):
    width = int(width_in * 1440)
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(width))
    tc_w.set(qn("w:type"), "dxa")


def set_table_borders(table, color=BORDER):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "6")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def table(rows, widths, header=True):
    t = doc.add_table(rows=len(rows), cols=len(widths))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    t.style = "Table Grid"
    set_table_borders(t)
    for r_i, row in enumerate(rows):
        for c_i, value in enumerate(row):
            cell = t.cell(r_i, c_i)
            set_cell_width(cell, widths[c_i])
            is_header = header and r_i == 0
            set_cell_text(cell, value, bold=is_header, color=GREEN if is_header else None)
            if is_header:
                shade_cell(cell, LIGHT_GREEN)
    paragraph(after=4)
    return t


def add_caption(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run(text)
    set_run_font(r, size=10.5, italic=True, color=MUTED)
    return p


def add_picture(path, caption, width=6.2):
    if not Path(path).exists():
        add_text(f"[Thiếu hình: {path}]")
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    run = p.add_run()
    run.add_picture(str(path), width=Inches(width))
    add_caption(caption)


def add_callout(title, body):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    set_table_borders(t, "D7C6A4")
    cell = t.cell(0, 0)
    set_cell_width(cell, 6.3)
    shade_cell(cell, LIGHT_TAN)
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(title)
    set_run_font(r, size=11.5, bold=True, color=GREEN)
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run(body)
    set_run_font(r2, size=11)
    paragraph(after=4)


def create_clean_erd():
    from PIL import Image, ImageDraw, ImageFont

    out = DIAGRAM_DIR / "erd_clean.png"
    W, H = 1800, 1320
    img = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(img)
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 48)
        font_head = ImageFont.truetype("arialbd.ttf", 28)
        font = ImageFont.truetype("arial.ttf", 22)
        font_small = ImageFont.truetype("arial.ttf", 19)
        font_rel = ImageFont.truetype("arial.ttf", 21)
    except Exception:
        font_title = font_head = font = font_small = font_rel = ImageFont.load_default()

    draw.text((W / 2, 40), "ERD cơ sở dữ liệu 88Book", anchor="mm", fill=(46, 61, 35), font=font_title)
    draw.text(
        (W / 2, 92),
        "Bản đồ bảng và khóa ngoại chính trong database SQL Server book_store",
        anchor="mm",
        fill=(89, 90, 72),
        font=font,
    )

    boxes = {
        "users": (70, 150, 425, 395, ["id PK", "email UNIQUE", "password", "full_name", "role"]),
        "books": (500, 150, 855, 395, ["id PK", "title, author", "price, category", "quantity, rating", "admin_id FK"]),
        "orders": (930, 150, 1285, 395, ["id PK", "user_id FK", "total_amount", "status", "shipping_address"]),
        "order_items": (1360, 150, 1730, 395, ["id PK", "order_id FK", "book_id FK", "quantity", "price"]),
        "cart_items": (70, 475, 425, 705, ["id PK", "user_id FK", "book_id FK", "quantity"]),
        "wishlists": (500, 475, 855, 705, ["id PK", "user_id FK", "book_id FK", "UNIQUE(user, book)"]),
        "user_addresses": (930, 475, 1285, 720, ["id PK", "user_id FK", "label, name", "street, city", "is_default"]),
        "recommendations": (1360, 475, 1730, 705, ["id PK", "book_id FK UNIQUE", "sort_order"]),
    }

    def draw_box(name, x1, y1, x2, y2, fields):
        draw.rounded_rectangle([x1, y1, x2, y2], radius=20, outline=(99, 121, 72), width=3, fill=(253, 251, 247))
        draw.rounded_rectangle([x1, y1, x2, y1 + 58], radius=20, outline=(99, 121, 72), width=3, fill=(232, 240, 223))
        draw.rectangle([x1, y1 + 31, x2, y1 + 58], outline=(232, 240, 223), width=0, fill=(232, 240, 223))
        draw.line([x1, y1 + 58, x2, y1 + 58], fill=(99, 121, 72), width=3)
        draw.text((x1 + 18, y1 + 26), name, anchor="lm", fill=(46, 61, 35), font=font_head)
        y = y1 + 78
        for field in fields:
            draw.text((x1 + 20, y), field, fill=(32, 32, 32), font=font)
            y += 30

    for name, (x1, y1, x2, y2, fields) in boxes.items():
        draw_box(name, x1, y1, x2, y2, fields)

    # Relationship summary is kept in a separate band so no connector can obscure table names.
    band = (70, 780, 1730, 1240)
    draw.rounded_rectangle(band, radius=24, outline=(126, 92, 45), width=3, fill=(255, 252, 244))
    draw.text((100, 815), "Quan hệ chính", fill=(91, 65, 35), font=font_head)

    relationships = [
        ("users.id", "1-n", "books.admin_id", "Admin quản lý sách"),
        ("users.id", "1-n", "cart_items.user_id", "Người mua có nhiều dòng giỏ hàng"),
        ("books.id", "1-n", "cart_items.book_id", "Một sách xuất hiện ở nhiều giỏ hàng"),
        ("users.id", "1-n", "orders.user_id", "Người mua tạo đơn hàng"),
        ("orders.id", "1-n", "order_items.order_id", "Một đơn gồm nhiều dòng sản phẩm"),
        ("books.id", "1-n", "order_items.book_id", "Dòng đơn tham chiếu sách"),
        ("users.id", "1-n", "user_addresses.user_id", "Người mua lưu nhiều địa chỉ"),
        ("users.id + books.id", "n-n", "wishlists", "Bảng trung gian sách yêu thích"),
        ("books.id", "1-1", "recommendations.book_id", "Sách được ghim đề xuất"),
    ]

    def draw_relation(x, y, left, rel, right, note):
        draw.rounded_rectangle([x, y, x + 760, y + 66], radius=12, outline=(212, 191, 151), width=2, fill=(255, 255, 255))
        draw.text((x + 24, y + 33), left, anchor="lm", fill=(38, 38, 38), font=font_rel)
        draw.line([x + 250, y + 33, x + 330, y + 33], fill=(126, 92, 45), width=3)
        draw.ellipse([x + 244, y + 27, x + 256, y + 39], fill=(126, 92, 45))
        draw.ellipse([x + 324, y + 27, x + 336, y + 39], fill=(126, 92, 45))
        draw.text((x + 290, y + 17), rel, anchor="mm", fill=(126, 92, 45), font=font_small)
        draw.text((x + 355, y + 19), right, fill=(38, 38, 38), font=font_rel)
        draw.text((x + 355, y + 45), note, fill=(95, 95, 84), font=font_small)

    for idx, item in enumerate(relationships):
        col = idx % 2
        row = idx // 2
        draw_relation(100 + col * 815, 865 + row * 76, *item)

    note = "Ghi chú: PK là khóa chính, FK là khóa ngoại; database được seed bằng database/init.sql."
    draw.text((W / 2, H - 35), note, anchor="mm", fill=(90, 76, 55), font=font_small)
    img.save(out)
    return out


doc = Document()
apply_doc_styles(doc)
add_footer(doc.sections[0])
clean_erd = create_clean_erd()

# Cover page
p = paragraph("TRƯỜNG/ĐƠN VỊ ĐÀO TẠO: [Điền tên trường]", align=WD_ALIGN_PARAGRAPH.CENTER, after=2, bold=True)
set_run_font(p.runs[0], size=13, bold=True)
p = paragraph("KHOA/BỘ MÔN: [Điền khoa/bộ môn]", align=WD_ALIGN_PARAGRAPH.CENTER, after=26, bold=True)
set_run_font(p.runs[0], size=13, bold=True)

p = paragraph("BÁO CÁO ĐỒ ÁN", align=WD_ALIGN_PARAGRAPH.CENTER, after=8, bold=True)
set_run_font(p.runs[0], size=22, bold=True, color=GREEN)
p = paragraph("XÂY DỰNG WEBSITE BÁN SÁCH TRỰC TUYẾN 88BOOK", align=WD_ALIGN_PARAGRAPH.CENTER, after=20, bold=True)
set_run_font(p.runs[0], size=18, bold=True, color=GREEN)

table([
    ["Môn học", "[Điền tên môn học]"],
    ["Giảng viên hướng dẫn", "[Điền tên giảng viên]"],
    ["Nhóm thực hiện", "[Điền tên nhóm]"],
    ["Sinh viên", "[Điền danh sách sinh viên]"],
    ["Ngày hoàn thiện", "15/05/2026"],
], [2.1, 4.1], header=False)

add_callout(
    "Ghi chú về phạm vi báo cáo",
    "Báo cáo bám cấu trúc mẫu N1.pdf và trình bày theo thông tin thực tế của project 88Book. "
    "Các thông tin trường, môn học, giảng viên và thành viên nhóm được để placeholder để nhóm tự điền trước khi nộp.",
)
doc.add_page_break()

# TOC
p = paragraph("MỤC LỤC", style="Heading 1", align=WD_ALIGN_PARAGRAPH.CENTER)
run = p.runs[0]
set_run_font(run, size=18, bold=True, color=GREEN)
toc_p = doc.add_paragraph()
toc_p.paragraph_format.space_after = Pt(12)
add_field(toc_p, 'TOC \\o "1-3" \\h \\z \\u')

# Chapter 1
paragraph("CHƯƠNG 1: GIỚI THIỆU CHUNG", style="Heading 1")
paragraph("1.1. Tổng quan đề tài", style="Heading 2")
add_text(
    "88Book là project xây dựng website bán sách trực tuyến theo mô hình ba lớp gồm giao diện người dùng, API backend và cơ sở dữ liệu SQL Server. "
    "Trong mã nguồn giao diện hiện tại, nhãn thương hiệu hiển thị là BookHaven; báo cáo sử dụng tên đề tài 88Book theo yêu cầu của đồ án."
)
add_text(
    "Hệ thống cho phép khách truy cập xem danh sách sách, tìm kiếm và xem chi tiết; người mua có thể đăng ký, đăng nhập, quản lý giỏ hàng, đặt hàng, lưu wishlist và quản lý địa chỉ; quản trị viên có thể quản lý người dùng, sách, đơn hàng và danh sách đề xuất."
)

paragraph("1.2. Lý do chọn đề tài", style="Heading 2")
for item in [
    "Thương mại điện tử là bài toán phổ biến, dễ kiểm chứng nhưng vẫn đủ rộng để thể hiện đầy đủ phân tích, thiết kế, cài đặt và kiểm thử.",
    "Bán sách trực tuyến có các nghiệp vụ rõ ràng như tìm kiếm sản phẩm, giỏ hàng, thanh toán, quản lý đơn và phân quyền quản trị.",
    "Đề tài phù hợp để áp dụng stack hiện đại React/Vite ở frontend, Node.js/Express ở backend và SQL Server ở tầng dữ liệu.",
]:
    add_bullet(item)

paragraph("1.3. Mục tiêu", style="Heading 2")
table([
    ["Nhóm mục tiêu", "Nội dung"],
    ["Người dùng cuối", "Dễ tìm sách, xem thông tin, quản lý giỏ hàng, đặt hàng và theo dõi tài khoản."],
    ["Quản trị viên", "Quản lý người dùng, sách, đề xuất và trạng thái đơn hàng qua giao diện admin."],
    ["Kỹ thuật", "Tách lớp rõ frontend/backend/database, dùng API REST, JWT và schema quan hệ trên SQL Server."],
    ["Báo cáo", "Trình bày đầy đủ công nghệ, kiến trúc, use case, CSDL, giao diện thật và kiểm thử."],
], [1.6, 4.6])

paragraph("1.4. Đối tượng sử dụng", style="Heading 2")
for item in [
    "Guest: truy cập trang chủ, duyệt sách, tìm kiếm/lọc, xem chi tiết và chuyển đến đăng nhập/đăng ký.",
    "Buyer: đăng nhập, thêm sách vào giỏ, checkout, quản lý hồ sơ, địa chỉ, wishlist và lịch sử đơn hàng.",
    "Admin: quản trị dữ liệu người dùng, sách, đơn hàng và recommendation.",
]:
    add_bullet(item)

paragraph("1.5. Phương pháp thực hiện", style="Heading 2")
add_text(
    "Nhóm tiếp cận theo quy trình: khảo sát yêu cầu, phân tích actor và use case, thiết kế dữ liệu quan hệ, cài đặt từng tầng, chạy seed dữ liệu, kiểm thử API và kiểm thử giao diện trên môi trường local."
)

# Chapter 2
paragraph("CHƯƠNG 2: NỀN TẢNG KỸ THUẬT VÀ CÔNG NGHỆ SỬ DỤNG", style="Heading 1")
paragraph("2.1. Tổng quan stack công nghệ", style="Heading 2")
table([
    ["Tầng", "Công nghệ chạy chính", "Chi tiết trong project", "Cổng/lệnh chạy"],
    ["Frontend", "React 18 + Vite 6 + Tailwind CSS 4", "Mã nguồn trong src/app, component TSX/JSX; dùng lucide-react, Radix UI và CSS utility.", "npm run dev, http://localhost:5174"],
    ["Backend", "Node.js + Express", "Thư mục backend, ES Modules, REST API, CORS, dotenv, mssql, JWT, bcryptjs.", "cd backend && npm run dev, http://localhost:5000/api"],
    ["Database", "Microsoft SQL Server", "Database book_store, script database/init.sql, bảng users/books/cart/orders/address/wishlist/recommendations.", "SQL Server 1433, sqlcmd -i database/init.sql"],
], [1.0, 1.6, 2.6, 1.4])

paragraph("2.2. Frontend chạy bằng gì?", style="Heading 2")
add_text(
    "Frontend chạy bằng React trên Vite. Vite đóng vai trò dev server và bundler, phục vụ ứng dụng tại cổng 5174. "
    "React quản lý state giao diện, các component như Navigation, BrowsePage, CartPage, CheckoutPage, AccountPage và AdminDashboard tạo thành các màn hình chính. Tailwind CSS 4 và các component UI nội bộ đảm nhiệm style."
)
table([
    ["Thành phần", "Phiên bản/nguồn", "Vai trò"],
    ["React", "18.3.1 (peerDependencies)", "Xây dựng giao diện component, state và render UI."],
    ["Vite", "^6.4.2", "Dev server, build frontend, hot reload trong quá trình phát triển."],
    ["Tailwind CSS", "4.1.12", "Utility CSS và theme giao diện."],
    ["lucide-react", "0.487.0", "Icon cho navigation, cart, user, admin, wishlist."],
    ["Radix UI", "label/separator/slot/tabs", "Nền tảng một số control UI như tabs trong trang tài khoản/admin."],
], [1.5, 1.8, 2.9])

paragraph("2.3. Backend chạy bằng gì?", style="Heading 2")
add_text(
    "Backend chạy bằng Node.js với framework Express. File server khởi động API ở cổng 5000, định nghĩa middleware JSON, CORS, route auth, users, books, cart, orders và admin. "
    "Backend dùng JWT để xác thực, middleware authorizeRole để phân quyền admin, và thư viện mssql để kết nối SQL Server."
)
table([
    ["Thư viện backend", "Phiên bản", "Chức năng"],
    ["express", "^4.22.1", "Xây dựng REST API và route."],
    ["mssql", "11.0.1", "Kết nối và truy vấn Microsoft SQL Server."],
    ["jsonwebtoken", "9.0.2", "Tạo và xác minh JWT cho auth."],
    ["bcryptjs", "2.4.3", "Hash mật khẩu khi đăng ký tài khoản mới; hỗ trợ so khớp seed password."],
    ["dotenv", "16.0.3", "Đọc cấu hình môi trường từ backend/.env."],
    ["nodemon", "^3.1.14", "Tự khởi động lại backend khi phát triển."],
], [1.6, 1.2, 3.4])

paragraph("2.4. Database chạy bằng gì?", style="Heading 2")
add_text(
    "Database chạy bằng Microsoft SQL Server local, cổng 1433, database book_store. Script database/init.sql tạo schema và seed dữ liệu demo gồm tài khoản admin, buyer, 10 sách, địa chỉ, wishlist và đơn hàng mẫu. "
    "Backend đọc cấu hình DB_HOST, DB_PORT, DB_NAME, DB_USER và các tuỳ chọn mã hóa từ backend/.env."
)
table([
    ["Đối tượng", "Mô tả"],
    ["Database", "book_store"],
    ["Script khởi tạo", "database/init.sql"],
    ["Tài khoản seed", "admin@bookhaven.local / Admin@123; buyer@bookhaven.local / Buyer@123"],
    ["Bảng chính", "users, books, cart_items, orders, order_items, user_addresses, wishlists, recommendations"],
    ["Kiểm tra local", "SQL Server service MSSQLSERVER đang chạy, port 1433 mở, API health trả về thành công."],
], [1.8, 4.4])

# Chapter 3
paragraph("CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG", style="Heading 1")
paragraph("3.1. Tác nhân hệ thống", style="Heading 2")
table([
    ["Tác nhân", "Mô tả", "Quyền/chức năng chính"],
    ["Guest", "Người truy cập chưa đăng nhập.", "Xem trang chủ, tìm kiếm/lọc sách, xem chi tiết, đăng ký/đăng nhập."],
    ["Buyer", "Người mua đã đăng nhập.", "Quản lý giỏ hàng, checkout, hồ sơ, địa chỉ, wishlist, đơn hàng."],
    ["Admin", "Người quản trị.", "Quản lý người dùng, sách, recommendation và trạng thái đơn hàng."],
], [1.2, 2.0, 3.0])

paragraph("3.2. Yêu cầu chức năng", style="Heading 2")
for item in [
    "Quản lý xác thực: đăng ký, đăng nhập, lấy thông tin người dùng hiện tại bằng JWT.",
    "Quản lý sách: xem danh sách, tìm kiếm/lọc, xem chi tiết, quản trị thêm/sửa/xóa sách.",
    "Giỏ hàng và đặt hàng: thêm sách, cập nhật số lượng, xóa khỏi giỏ, checkout và lưu order.",
    "Tài khoản buyer: cập nhật hồ sơ, quản lý địa chỉ, xem wishlist và lịch sử đơn hàng.",
    "Quản trị: quản lý role người dùng, quản lý tồn kho sách, chọn recommendation, xem/cập nhật đơn hàng.",
]:
    add_bullet(item)

paragraph("3.3. Yêu cầu phi chức năng", style="Heading 2")
table([
    ["Nhóm yêu cầu", "Mô tả"],
    ["Bảo mật", "JWT bảo vệ API cần đăng nhập; role admin được kiểm tra ở middleware backend."],
    ["Dễ bảo trì", "Frontend, backend, database tách thư mục rõ; API client tập trung ở src/api/client.js."],
    ["Hiệu năng", "Frontend Vite nhẹ cho dev; API phân trang danh sách sách; SQL Server lưu dữ liệu quan hệ."],
    ["Khả dụng", "Có seed account và seed data để chạy demo nhanh trên môi trường local."],
], [1.6, 4.6])

paragraph("3.4. Use case tổng quan", style="Heading 2")
add_picture(DIAGRAM_DIR / "usecase.png", "Hình 3.1. Use case tổng quan hệ thống 88Book", width=6.4)

paragraph("3.5. Đặc tả use case tiêu biểu", style="Heading 2")
table([
    ["Use case", "Tác nhân", "Luồng chính", "Kết quả"],
    ["Đăng nhập", "Buyer/Admin", "Nhập email, password; backend kiểm tra user và tạo JWT.", "Người dùng vào được trang tài khoản hoặc admin."],
    ["Tìm kiếm/lọc sách", "Guest/Buyer", "Nhập từ khóa hoặc chọn category; frontend gọi API books.", "Danh sách sách phù hợp được hiển thị."],
    ["Thêm giỏ hàng", "Buyer", "Chọn sách, gọi POST /api/cart với bookId và quantity.", "Cart badge và trang giỏ hàng cập nhật."],
    ["Checkout", "Buyer", "Xác nhận thông tin nhận hàng và tổng tiền.", "Đơn hàng được tạo và giỏ hàng được xử lý."],
    ["Quản lý sách", "Admin", "Thêm/sửa/xóa sách trong dashboard.", "Dữ liệu books trong SQL Server thay đổi."],
], [1.25, 1.0, 2.8, 1.2])

paragraph("3.6. Thiết kế cơ sở dữ liệu", style="Heading 2")
add_picture(clean_erd, "Hình 3.2. ERD cơ sở dữ liệu 88Book", width=6.4)
table([
    ["Bảng", "Vai trò", "Khóa/quan hệ chính"],
    ["users", "Lưu tài khoản buyer/admin.", "id PK, email UNIQUE; role phân quyền."],
    ["books", "Lưu thông tin sách, tồn kho, giá, ảnh, rating.", "admin_id FK -> users."],
    ["cart_items", "Dòng sách trong giỏ hàng.", "user_id FK -> users, book_id FK -> books."],
    ["orders", "Thông tin đơn hàng.", "user_id FK -> users."],
    ["order_items", "Chi tiết sách trong đơn.", "order_id FK -> orders, book_id FK -> books, admin_id FK -> users."],
    ["user_addresses", "Địa chỉ giao hàng của buyer.", "user_id FK -> users, ON DELETE CASCADE."],
    ["wishlists", "Sách yêu thích của buyer.", "UNIQUE(user_id, book_id), FK tới users/books."],
    ["recommendations", "Sách được admin chọn hiển thị đề xuất.", "book_id FK UNIQUE -> books."],
], [1.35, 2.35, 2.5])

# Chapter 4
paragraph("CHƯƠNG 4: CÀI ĐẶT VÀ KIỂM THỬ", style="Heading 1")
paragraph("4.1. Kiến trúc hệ thống", style="Heading 2")
add_picture(DIAGRAM_DIR / "architecture.png", "Hình 4.1. Kiến trúc ba lớp của 88Book", width=6.4)
add_text(
    "Frontend React gọi backend qua VITE_API_URL=http://localhost:5000/api. Backend Express xử lý route, middleware auth/role và truy vấn SQL Server. "
    "SQL Server lưu dữ liệu nghiệp vụ trong database book_store. Cách tách lớp này giúp giao diện, API và dữ liệu có thể phát triển, kiểm thử độc lập."
)

paragraph("4.2. Môi trường chạy local đã kiểm tra", style="Heading 2")
table([
    ["Thành phần", "Trạng thái kiểm tra", "Kết quả"],
    ["SQL Server", "Service MSSQLSERVER Running, port 1433 mở", "Đạt"],
    ["Database seed", "Chạy database/init.sql bằng sqlcmd", "book_store có users=2, books=10, orders=1, wishlists=1, addresses=1"],
    ["Backend", "npm run dev trong backend", "API chạy http://localhost:5000; GET /api/health thành công"],
    ["Frontend", "npm run dev ở root", "Vite chạy http://localhost:5174"],
    ["Login demo", "buyer/admin bằng seed account", "Cả hai đăng nhập thành công"],
], [1.4, 3.0, 1.8])

paragraph("4.3. Ảnh chụp giao diện thật", style="Heading 2")
screens = [
    ("01_home_real.png", "Hình 4.2. Trang chủ 88Book/BookHaven"),
    ("02_browse_books_real.png", "Hình 4.3. Trang danh sách sách và bộ lọc"),
    ("03_login_real.png", "Hình 4.4. Màn hình đăng nhập/đăng ký và tài khoản seed"),
    ("04_buyer_account_real.png", "Hình 4.5. Trang tài khoản buyer"),
    ("05_cart_real.png", "Hình 4.6. Trang giỏ hàng"),
    ("06_checkout_real.png", "Hình 4.7. Trang checkout"),
    ("07_admin_dashboard_real.png", "Hình 4.8. Admin dashboard: quản lý người dùng và recommendation"),
    ("08_admin_books_orders_real.png", "Hình 4.9. Admin dashboard: quản lý recommendation và sách"),
]
for name, cap in screens:
    add_picture(SHOT_DIR / name, cap, width=6.3)

paragraph("4.4. Kịch bản kiểm thử", style="Heading 2")
table([
    ["Mã", "Kịch bản", "Dữ liệu", "Kết quả mong đợi", "Kết quả"],
    ["TC01", "Kiểm tra API health", "GET /api/health", "Server trả status running", "Đạt"],
    ["TC02", "Đăng nhập buyer", "buyer@bookhaven.local / Buyer@123", "Nhận JWT và role buyer", "Đạt"],
    ["TC03", "Đăng nhập admin", "admin@bookhaven.local / Admin@123", "Nhận JWT và role admin", "Đạt"],
    ["TC04", "Tải danh sách sách", "GET /api/books", "Trả 10 sách seed", "Đạt"],
    ["TC05", "Thêm giỏ hàng", "POST /api/cart bookId=1", "Giỏ hàng có Atomic Habits", "Đạt"],
    ["TC06", "Hiển thị checkout", "Buyer có 1 item", "Tổng tiền, shipping, tax hiển thị đúng", "Đạt"],
    ["TC07", "Admin dashboard", "Role admin", "Thấy users, recommendations, books", "Đạt"],
], [0.55, 1.5, 1.55, 1.65, 0.75])

# Chapter 5
paragraph("CHƯƠNG 5: KẾT QUẢ, HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN", style="Heading 1")
paragraph("5.1. Kết quả đạt được", style="Heading 2")
for item in [
    "Xây dựng được website bán sách trực tuyến có đủ các luồng chính: duyệt sách, giỏ hàng, checkout, tài khoản và admin.",
    "Triển khai backend REST API với xác thực JWT và phân quyền buyer/admin.",
    "Thiết kế được database SQL Server quan hệ, có seed data để chạy demo nhanh.",
    "Tài liệu hóa đầy đủ công nghệ frontend, backend, database, use case, ERD, kiến trúc và ảnh giao diện thật.",
]:
    add_bullet(item)

paragraph("5.2. Hạn chế", style="Heading 2")
for item in [
    "Chức năng thanh toán hiện ở mức mô phỏng checkout, chưa tích hợp cổng thanh toán thật.",
    "Giao diện demo dùng nhãn BookHaven trong khi đề tài báo cáo là 88Book, cần thống nhất branding nếu triển khai chính thức.",
    "Recommendation hiện do admin chọn thủ công, chưa có thuật toán cá nhân hóa theo hành vi mua hàng.",
    "Chưa có bộ test tự động đầy đủ cho frontend/backend; kiểm thử hiện chủ yếu là kiểm thử thủ công và API smoke test.",
]:
    add_bullet(item)

paragraph("5.3. Hướng phát triển", style="Heading 2")
for item in [
    "Tích hợp thanh toán thật, email xác nhận đơn hàng và hóa đơn.",
    "Bổ sung review/rating từ người mua, gợi ý sách cá nhân hóa và tìm kiếm nâng cao.",
    "Hoàn thiện quản lý kho, trạng thái vận chuyển, phân trang/lọc nâng cao cho admin.",
    "Thêm test tự động bằng unit test, API integration test và end-to-end test cho luồng mua hàng.",
]:
    add_bullet(item)

paragraph("5.4. Kết luận", style="Heading 2")
add_text(
    "Project 88Book đáp ứng mục tiêu xây dựng một website bán sách trực tuyến theo kiến trúc ba lớp. "
    "Frontend React/Vite tạo trải nghiệm mua sách trực quan, backend Node.js/Express cung cấp API và xác thực JWT, còn SQL Server lưu trữ dữ liệu quan hệ. "
    "Qua quá trình chạy local, seed database, kiểm thử API và chụp giao diện thật, hệ thống đã chứng minh được các nghiệp vụ cốt lõi của một website thương mại điện tử quy mô đồ án."
)

doc.save(OUT)
print(str(OUT))
