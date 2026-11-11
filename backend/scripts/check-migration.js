import pool from "../config/database.js";

const checks = [
  ["core_tables", "SELECT COUNT(*) AS n FROM sys.tables WHERE name IN ('users', 'books', 'cart_items', 'orders', 'order_items')"],
  ["invalid_books", "SELECT COUNT(*) AS n FROM books WHERE price < 0 OR quantity < 0"],
  ["invalid_cart_items", "SELECT COUNT(*) AS n FROM cart_items WHERE quantity <= 0"],
  ["invalid_order_items", "SELECT COUNT(*) AS n FROM order_items WHERE quantity <= 0"],
  ["invalid_orders", "SELECT COUNT(*) AS n FROM orders WHERE total_amount < 0"],
  ["legacy_order_statuses", "SELECT COUNT(*) AS n FROM orders WHERE status NOT IN ('accepted', 'shipped', 'delivered', 'cancelled') OR status IS NULL"],
  ["legacy_user_roles", "SELECT COUNT(*) AS n FROM users WHERE role NOT IN ('admin', 'buyer')"],
  ["legacy_columns", "SELECT CASE WHEN COL_LENGTH('books', 'seller_id') IS NULL THEN 0 ELSE 1 END + CASE WHEN COL_LENGTH('order_items', 'seller_id') IS NULL THEN 0 ELSE 1 END AS n"],
  ["legacy_sample_prices", "SELECT COUNT(*) AS n FROM books WHERE isbn IN ('9780735211292','9780062315007','9780547928227','9780307476463','9780141034355','9781501128035','9780812981605','9781452162560','9780140449266','9780062457714') AND price < 1000"],
  ["legacy_plaintext_demo_accounts", "SELECT COUNT(*) AS n FROM users WHERE email IN ('admin@bookhaven.local', 'buyer@bookhaven.local') AND LEFT(password, 2) <> CHAR(36) + '2'"],
];

for (const [name, statement] of checks) {
  try {
    const result = await pool.query(statement);
    console.log(`${name}: ${result.rows[0]?.n ?? "unknown"}`);
  } catch (error) {
    console.error(`${name}: unavailable (${error.number || error.code || error.status || error.name})`);
    process.exitCode = 1;
  }
}

await pool.close();
