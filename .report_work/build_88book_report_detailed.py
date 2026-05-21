from pathlib import Path
import shutil

from docx import Document
from docx.oxml import OxmlElement
from docx.text.paragraph import Paragraph
from docx.table import Table
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = Path(r"C:\Users\quang\Downloads\N5.docx")
OUT = ROOT / "Bao_cao_do_an_88Book_chi_tiet_API_CRUD_theo_mau_N5.docx"


REPLACEMENTS = {
    "BÀI TẬP LỚN": "BÁO CÁO ĐỒ ÁN",
    "Đề bài: XÂY DỰNG WEBSITE BÁN SÁCH TRỰC TUYẾN": "Đề tài: XÂY DỰNG WEBSITE BÁN SÁCH TRỰC TUYẾN 88BOOK",
    "Frontend chạy bằng gì?": "Frontend",
    "Backend chạy bằng gì?": "Backend",
    "Database chạy bằng gì?": "Database",
    "Reh các màn hình chính.": "React quản lý state giao diện và tổ chức các màn hình chính.",
}


FRONTEND_DETAIL = [
    ("2.2.1. React 18", [
        "Công dụng: React là thư viện chính để xây dựng giao diện theo mô hình component. Trong 88Book, các phần như Navigation, BookCard, BrowsePage, CartPage, CheckoutPage, AccountPage và AdminDashboard được tách thành component để dễ tái sử dụng và bảo trì.",
        "Cách hoạt động: file src/main.tsx mount React app vào phần tử root trong index.html. Component gốc src/app/App.tsx giữ state trang hiện tại, danh sách sách, modal chi tiết sách và điều phối các màn hình chính. Khi người dùng thao tác, state thay đổi và React tự render lại phần giao diện liên quan.",
        "Trong project: React kết hợp Context API để chia sẻ trạng thái đăng nhập và giỏ hàng cho nhiều component mà không phải truyền props qua nhiều tầng.",
    ]),
    ("2.2.2. Vite", [
        "Công dụng: Vite là công cụ chạy dev server và build frontend. Vite giúp khởi động nhanh, hỗ trợ hot reload khi sửa code và đóng gói source thành thư mục dist khi triển khai.",
        "Cách hoạt động: vite.config.ts cấu hình React plugin, Tailwind plugin, server chạy ở cổng 5174 và alias @ trỏ về thư mục src. Khi chạy npm run dev, Vite phục vụ ứng dụng ở http://localhost:5174.",
        "Cách chạy: mở terminal tại thư mục gốc project, chạy npm install nếu chưa cài dependency, sau đó chạy npm run dev. Khi cần build bản production, chạy npm run build để tạo output trong dist.",
    ]),
    ("2.2.3. Tailwind CSS 4 và CSS theme", [
        "Công dụng: Tailwind CSS hỗ trợ viết style theo utility class, còn các file src/styles/theme.css, tailwind.css, index.css và fonts.css chứa theme, layout, animation và font cho toàn bộ giao diện.",
        "Cách hoạt động: src/styles/index.css import các file style chính, sau đó được nạp vào ứng dụng từ entry React. Các component dùng className để gắn style, đồng thời một số class/theme dùng chung được quản lý trong CSS riêng để giao diện thống nhất.",
        "Trong project: Tailwind được dùng cùng các component UI nội bộ như button, input, card, badge, tabs để tạo trải nghiệm đồng nhất cho trang duyệt sách, giỏ hàng, tài khoản và admin.",
    ]),
    ("2.2.4. API client", [
        "Công dụng: src/api/client.js là lớp trung gian để frontend gọi backend. File này gom các request đăng nhập, sách, giỏ hàng, đơn hàng, user và admin vào một nơi, giúp component không phải tự viết fetch lặp lại.",
        "Cách hoạt động: API client dùng base URL http://localhost:5000/api hoặc biến môi trường VITE_API_URL. Với request cần đăng nhập, token JWT trong localStorage được gửi qua header Authorization: Bearer <token>.",
        "Lợi ích: khi backend đổi domain, cổng hoặc header, chỉ cần sửa API client thay vì sửa rải rác trong nhiều component.",
    ]),
    ("2.2.5. Context API: AuthContext và CartContext", [
        "AuthContext quản lý đăng ký, đăng nhập, đăng xuất, lưu token và thông tin người dùng. Khi app khởi động, context kiểm tra localStorage để khôi phục phiên đăng nhập nếu còn token.",
        "CartContext quản lý danh sách sách trong giỏ hàng, số lượng item, thao tác thêm/sửa/xóa/clear giỏ. Context này gọi các API cart ở backend và cập nhật badge giỏ hàng trên Navigation.",
        "Cách hoạt động tổng quát: component gọi hàm trong context, context gọi API client, backend xử lý dữ liệu, context nhận kết quả rồi cập nhật state để UI render lại.",
    ]),
    ("2.2.6. Luồng chạy frontend", [
        "Bước 1: trình duyệt mở http://localhost:5174 và tải index.html do Vite phục vụ.",
        "Bước 2: src/main.tsx khởi tạo React app, bọc ứng dụng bằng AuthProvider và CartProvider.",
        "Bước 3: App.tsx tải danh sách sách từ backend, hiển thị trang chủ hoặc trang duyệt sách.",
        "Bước 4: khi user tìm kiếm, lọc, thêm giỏ hàng hoặc checkout, frontend gọi API tương ứng và cập nhật giao diện theo dữ liệu trả về.",
    ]),
]


BACKEND_DETAIL = [
    ("2.3.3. Node.js và Express", [
        "Công dụng: Node.js chạy JavaScript phía server, Express xây dựng REST API cho frontend sử dụng. Backend tập trung trong thư mục backend.",
        "Cách hoạt động: backend/server.js tạo Express app, bật CORS, đọc JSON body, mount các route /api/auth, /api/users, /api/books, /api/cart, /api/orders và /api/admin, đồng thời cung cấp /api/health để kiểm tra server.",
        "Cách chạy: cd backend, chạy npm install nếu chưa cài dependency, sau đó chạy npm run dev trong môi trường phát triển hoặc npm start để chạy server bằng Node.",
    ]),
    ("2.3.4. Kiến trúc routes - controllers", [
        "Routes định nghĩa endpoint và middleware cần dùng. Ví dụ books.js xử lý các URL liên quan đến sách, cart.js xử lý giỏ hàng, orders.js xử lý đặt hàng.",
        "Controllers chứa logic nghiệp vụ chính. Ví dụ authController xử lý đăng ký/đăng nhập, bookController xử lý tìm kiếm/lọc/CRUD sách, orderController tạo đơn hàng và cập nhật trạng thái.",
        "Cách tách này giúp route ngắn gọn, controller dễ đọc, đồng thời tiện mở rộng thêm chức năng mới.",
    ]),
    ("2.3.5. Xác thực JWT và phân quyền", [
        "Công dụng: JWT giúp backend nhận biết user đã đăng nhập mà không cần lưu session trên server. Sau khi đăng nhập thành công, backend trả token cho frontend.",
        "Cách hoạt động: frontend lưu token vào localStorage và gửi kèm trong header Authorization. Middleware authenticateToken kiểm tra token, giải mã user id/role rồi gắn thông tin user vào request.",
        "Phân quyền: middleware authorizeRole kiểm tra role buyer/admin. Các API admin như quản lý sách, user, recommendation và đơn hàng chỉ cho phép tài khoản admin truy cập.",
    ]),
    ("2.3.6. Kết nối SQL Server bằng mssql", [
        "Công dụng: thư viện mssql giúp backend kết nối và truy vấn Microsoft SQL Server.",
        "Cách hoạt động: backend/config/database.js đọc thông tin host, user, password, database từ biến môi trường, tạo connection pool và cung cấp helper query để controller sử dụng.",
        "Lợi ích: kết nối database được quản lý tập trung, giảm lặp code và giúp việc thay đổi cấu hình database dễ hơn.",
    ]),
    ("2.3.7. Các nhóm API chính", [
        "Auth API: đăng ký, đăng nhập, lấy thông tin user hiện tại, tạo tài khoản admin.",
        "Books API: lấy danh sách sách, tìm kiếm/lọc/sắp xếp, xem recommendation, thêm/sửa/xóa sách.",
        "Cart API: lấy giỏ hàng, thêm sách, cập nhật số lượng, xóa item và xóa toàn bộ giỏ.",
        "Orders API: tạo đơn, xem lịch sử đơn, hủy đơn, admin xem và cập nhật trạng thái đơn.",
        "Users/Admin API: cập nhật hồ sơ, đổi mật khẩu, địa chỉ, wishlist, thống kê và quản lý user.",
    ]),
]


API_OVERVIEW_TABLE = [
    ["Nhóm API", "Endpoint chính", "Quyền truy cập", "Công dụng"],
    ["Health", "GET /api/health", "Public", "Kiểm tra backend đang chạy và trả timestamp."],
    ["Auth", "POST /api/auth/register; POST /api/auth/login; GET /api/auth/me; POST /api/auth/admin", "Public, User, Admin", "Đăng ký, đăng nhập, lấy user hiện tại và tạo admin."],
    ["Books", "GET /api/books; GET /api/books/recommendations; GET /api/books/:id; POST/PUT/DELETE /api/books", "Public, Admin", "Duyệt sách, xem chi tiết, recommendation và CRUD sách."],
    ["Cart", "GET/POST /api/cart; PUT /api/cart/:cartItemId; DELETE /api/cart/:cartItemId; DELETE /api/cart", "User", "Xem giỏ, thêm sách, cập nhật số lượng, xóa item hoặc xóa toàn bộ giỏ."],
    ["Orders", "POST/GET /api/orders; GET /api/orders/:orderId; PUT /api/orders/:orderId/cancel; PUT /api/orders/:orderId/approve; PUT /api/orders/:orderId/status; GET /api/orders/admin/pending", "User, Admin", "Tạo đơn, xem đơn, hủy đơn, duyệt đơn và cập nhật trạng thái."],
    ["Users", "GET/PUT /api/users/profile; PUT /api/users/change-password; GET/POST/PUT/DELETE /api/users/addresses; GET/POST/DELETE /api/users/wishlist; GET /api/users/public/:userId", "Public, User", "Hồ sơ, đổi mật khẩu, địa chỉ, wishlist và xem hồ sơ public."],
    ["Admin", "GET/POST/PUT/DELETE /api/admin/users; GET /api/admin/books; GET/PUT /api/admin/recommendations; GET /api/admin/orders; GET /api/admin/stats; PUT /api/admin/orders/:orderId/status", "Admin", "Quản lý user, sách, recommendation, đơn hàng và thống kê."],
]


CRUD_TABLE = [
    ["Module", "Create", "Read", "Update", "Delete"],
    ["Auth/User", "POST /api/auth/register; POST /api/auth/admin", "GET /api/auth/me; GET /api/users/profile; GET /api/users/public/:userId", "PUT /api/users/profile; PUT /api/users/change-password; PUT /api/admin/users/:userId/role", "DELETE /api/admin/users/:userId"],
    ["Books", "POST /api/books", "GET /api/books; GET /api/books/:id; GET /api/books/recommendations; GET /api/admin/books", "PUT /api/books/:id", "DELETE /api/books/:id"],
    ["Cart", "POST /api/cart", "GET /api/cart", "PUT /api/cart/:cartItemId", "DELETE /api/cart/:cartItemId; DELETE /api/cart"],
    ["Orders", "POST /api/orders", "GET /api/orders; GET /api/orders/:orderId; GET /api/orders/admin/pending; GET /api/admin/orders", "PUT /api/orders/:orderId/cancel; PUT /api/orders/:orderId/approve; PUT /api/orders/:orderId/status", "Chưa có xóa đơn; dùng trạng thái cancel để hủy."],
    ["Addresses", "POST /api/users/addresses", "GET /api/users/addresses", "PUT /api/users/addresses/:id", "DELETE /api/users/addresses/:id"],
    ["Wishlist", "POST /api/users/wishlist", "GET /api/users/wishlist", "Không cần update riêng; thêm/xóa theo bookId.", "DELETE /api/users/wishlist/:bookId"],
    ["Recommendations", "Không tạo từng item riêng qua API public; admin cập nhật danh sách.", "GET /api/books/recommendations; GET /api/admin/recommendations", "PUT /api/admin/recommendations", "Xóa bằng cách cập nhật danh sách recommendation mới."],
]


DATABASE_DETAIL = [
    ("2.4.1. SQL Server và database book_store", [
        "Công dụng: SQL Server lưu toàn bộ dữ liệu nghiệp vụ của hệ thống như tài khoản, sách, giỏ hàng, đơn hàng, địa chỉ, wishlist và recommendation.",
        "Cách hoạt động: backend gửi câu lệnh SQL qua thư viện mssql. SQL Server lưu dữ liệu theo bảng quan hệ, bảo đảm khóa chính, khóa ngoại và ràng buộc unique để dữ liệu nhất quán.",
        "Database chính trong project là book_store, được tạo từ script database/init.sql.",
    ]),
    ("2.4.2. Schema dữ liệu", [
        "users lưu thông tin tài khoản, mật khẩu đã hash, họ tên và role.",
        "books lưu tên sách, tác giả, mô tả, giá, thể loại, ISBN, tồn kho, ảnh, rating và admin tạo sách.",
        "cart_items lưu từng dòng sách trong giỏ hàng theo user.",
        "orders và order_items lưu thông tin đơn hàng, tổng tiền, trạng thái, địa chỉ giao hàng và chi tiết từng sách trong đơn.",
        "user_addresses, wishlists và recommendations hỗ trợ địa chỉ giao hàng, danh sách yêu thích và sách đề xuất trên hệ thống.",
    ]),
    ("2.4.3. Migration và seed data", [
        "database/init.sql là script tổng hợp dùng để tạo database, tạo bảng, migrate một số cột cũ và thêm dữ liệu mẫu.",
        "database/migrations/run.js tạo các bảng quan trọng khi chạy migration từ Node.js. Các script add-rating-column.js và add_wishlist_address.js bổ sung rating, wishlist và địa chỉ.",
        "Seed data có tài khoản admin@bookhaven.local / Admin@123 và buyer@bookhaven.local / Buyer@123, cùng danh sách sách mẫu để demo nhanh.",
    ]),
    ("2.4.4. Cách chạy database", [
        "Cách thủ công: mở SQL Server Management Studio, kết nối SQL Server local, mở database/init.sql và chạy toàn bộ script.",
        "Cách bằng command line: dùng sqlcmd để chạy script database/init.sql nếu máy đã cài SQL Server tools.",
        "Cách bằng Docker: docker-compose.yml có thể hỗ trợ dựng môi trường SQL Server/backend khi máy có Docker và cấu hình biến môi trường phù hợp.",
    ]),
]


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


def paragraph_after(anchor, text="", bold=False, italic=False, size=12):
    new_p = OxmlElement("w:p")
    if isinstance(anchor, Paragraph):
        anchor._p.addnext(new_p)
        parent = anchor._parent
    elif isinstance(anchor, Table):
        anchor._tbl.addnext(new_p)
        parent = anchor._parent
    else:
        anchor.addnext(new_p)
        parent = None
    p = Paragraph(new_p, parent)
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    p.paragraph_format.first_line_indent = Inches(0.3) if not bold else None
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    return p


def table_after(anchor, rows):
    doc = anchor.part.document
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = "Table Grid"
    for r_idx, row in enumerate(rows):
        for c_idx, value in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = value
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.name = "Times New Roman"
                    run.font.size = Pt(10.5)
                    if r_idx == 0:
                        run.bold = True
                p.paragraph_format.space_after = Pt(0)
    if isinstance(anchor, Paragraph):
        anchor._p.addnext(table._tbl)
    elif isinstance(anchor, Table):
        anchor._tbl.addnext(table._tbl)
    return table


def find_paragraph(doc, text):
    for paragraph in doc.paragraphs:
        if paragraph.text.strip().replace("\xa0", "") == text:
            return paragraph
    raise ValueError(f"Cannot find paragraph: {text}")


def remove_original_short_paragraphs(doc):
    for needle in [
        "Frontend chạy bằng React trên Vite.",
        "Backend chạy bằng Node.js với framework Express.",
        "Database chạy bằng Microsoft SQL Server local,",
    ]:
        for p in list(doc.paragraphs):
            if p.text.strip().startswith(needle):
                p._element.getparent().remove(p._element)
                break


def insert_detail_block(anchor, blocks, intro=None, summary_table=None):
    current = anchor
    if intro:
        current = paragraph_after(current, intro)
    if summary_table:
        current = table_after(current, summary_table)
    for title, bullets in blocks:
        current = paragraph_after(current, title, bold=True)
        for bullet in bullets:
            current = paragraph_after(current, bullet)
    return current


def main():
    shutil.copyfile(TEMPLATE, OUT)
    doc = Document(OUT)

    for paragraph in iter_paragraphs(doc):
        replace_in_paragraph(paragraph)

    remove_original_short_paragraphs(doc)

    frontend_anchor = find_paragraph(doc, "2.2. Frontend")
    insert_detail_block(
        frontend_anchor,
        FRONTEND_DETAIL,
        intro=(
            "Frontend của 88Book là phần giao diện người dùng, chịu trách nhiệm hiển thị dữ liệu sách, nhận thao tác từ người dùng "
            "và gọi API backend. Tầng này được tổ chức theo component React, chạy trên Vite và dùng Tailwind/CSS theme để tạo giao diện."
        ),
        summary_table=[
            ["Thành phần", "Công dụng", "Vị trí trong project"],
            ["React 18", "Xây dựng UI theo component và render theo state.", "src/main.tsx, src/app/App.tsx, src/app/components"],
            ["Vite", "Dev server, hot reload và build frontend.", "vite.config.ts, package.json"],
            ["Tailwind CSS 4", "Styling utility và theme giao diện.", "src/styles/*.css"],
            ["API client", "Gom request tới backend REST API.", "src/api/client.js"],
            ["Context API", "Chia sẻ auth/cart state toàn app.", "src/contexts/AuthContext.jsx, CartContext.jsx"],
        ],
    )

    backend_anchor = find_paragraph(doc, "2.3. Backend")
    current = insert_detail_block(
        backend_anchor,
        [],
        intro=(
            "Backend là tầng API trung gian giữa frontend và database. Backend nhận request từ trình duyệt, kiểm tra xác thực/phân quyền, "
            "thực hiện nghiệp vụ và truy vấn SQL Server."
        ),
    )
    current = paragraph_after(current, "2.3.1. Bảng API tổng quan", bold=True)
    current = table_after(current, API_OVERVIEW_TABLE)
    current = paragraph_after(
        current,
        "Bảng API cho thấy backend được chia theo từng nhóm nghiệp vụ. Các route public phục vụ duyệt sách và đăng nhập, route user yêu cầu JWT, còn route admin yêu cầu thêm role admin.",
    )
    current = paragraph_after(current, "2.3.2. Bảng CRUD theo module", bold=True)
    current = table_after(current, CRUD_TABLE)
    current = paragraph_after(
        current,
        "Bảng CRUD giúp đối chiếu nhanh mỗi module đã hỗ trợ thao tác tạo, đọc, cập nhật và xóa ở mức API. Một số nghiệp vụ như order không xóa vật lý mà chuyển trạng thái để giữ lịch sử giao dịch.",
    )
    insert_detail_block(
        current,
        BACKEND_DETAIL,
        summary_table=[
            ["Thành phần", "Công dụng", "Vị trí trong project"],
            ["Node.js", "Môi trường chạy JavaScript phía server.", "backend/package.json"],
            ["Express", "Tạo REST API, middleware và route.", "backend/server.js, backend/routes"],
            ["JWT", "Xác thực phiên đăng nhập bằng token.", "backend/middleware/auth.js"],
            ["bcryptjs", "Hash và kiểm tra mật khẩu.", "backend/controllers/authController.js"],
            ["mssql", "Kết nối và truy vấn SQL Server.", "backend/config/database.js"],
        ],
    )

    database_anchor = find_paragraph(doc, "2.4. Database")
    insert_detail_block(
        database_anchor,
        DATABASE_DETAIL,
        intro=(
            "Database lưu dữ liệu lâu dài của hệ thống. 88Book dùng Microsoft SQL Server với mô hình dữ liệu quan hệ, "
            "phù hợp cho các nghiệp vụ có nhiều liên kết như user, sách, giỏ hàng và đơn hàng."
        ),
        summary_table=[
            ["Thành phần", "Công dụng", "Vị trí trong project"],
            ["SQL Server", "Lưu dữ liệu quan hệ.", "localhost:1433"],
            ["book_store", "Database chính của ứng dụng.", "database/init.sql"],
            ["Migrations", "Tạo/bổ sung bảng và cột.", "database/migrations"],
            ["Seed data", "Tạo tài khoản và sách demo.", "database/init.sql"],
        ],
    )

    props = doc.core_properties
    props.title = "Báo cáo đồ án chi tiết 88Book"
    props.subject = "Xây dựng website bán sách trực tuyến 88Book"
    props.keywords = "88Book, React, Vite, Tailwind, Node.js, Express, SQL Server, báo cáo đồ án"
    props.comments = "Detailed version generated from N5 reference structure and adapted for the 88Book project."

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
