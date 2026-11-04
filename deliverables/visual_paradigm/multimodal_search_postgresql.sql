-- PostgreSQL design schema; import with Visual Paradigm Tools > DB > Reverse DDL.
CREATE TABLE category (
  category_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
);
CREATE TABLE product (
  product_id VARCHAR(40) PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES category(category_id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(14,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  availability VARCHAR(20) NOT NULL CHECK (availability IN ('ACTIVE','OUT_OF_STOCK','INACTIVE')),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE product_image (
  image_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id VARCHAR(40) NOT NULL REFERENCES product(product_id),
  image_uri VARCHAR(500) NOT NULL,
  provenance VARCHAR(255) NOT NULL,
  image_version INTEGER NOT NULL CHECK (image_version > 0)
);
CREATE TABLE customer (
  customer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','LOCKED')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_header (
  order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customer(customer_id),
  status VARCHAR(30) NOT NULL CHECK (status IN ('PAYMENT_PENDING','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED')),
  total NUMERIC(14,2) NOT NULL CHECK (total >= 0),
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_line (
  order_line_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES order_header(order_id),
  product_id VARCHAR(40) NOT NULL REFERENCES product(product_id),
  product_title_snapshot VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_snapshot NUMERIC(14,2) NOT NULL CHECK (unit_price_snapshot >= 0)
);
CREATE INDEX idx_product_filter ON product(category_id, availability, price);
CREATE INDEX idx_order_owner_date ON order_header(customer_id, created_at DESC);
CREATE INDEX idx_order_line_order ON order_line(order_id);
