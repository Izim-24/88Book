CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(500),
    created_at TIMESTAMP
);

CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    parent_id INT
);

CREATE TABLE products (
    product_id INT PRIMARY KEY,
    category_id INT,
    name VARCHAR(255),
    brand VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    image_url VARCHAR(500),
    stock INT,
    created_at TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE product_embeddings (
    embedding_id INT PRIMARY KEY,
    product_id INT,
    embedding_vector TEXT,
    model_version VARCHAR(50),
    created_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE carts (
    cart_id INT PRIMARY KEY,
    customer_id INT,
    created_date TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE cart_items (
    cart_item_id INT PRIMARY KEY,
    cart_id INT,
    product_id INT,
    quantity INT,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date TIMESTAMP,
    total_amount DECIMAL(12,2),
    status VARCHAR(50),
    shipping_address VARCHAR(500),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE payments (
    payment_id INT PRIMARY KEY,
    order_id INT,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    amount DECIMAL(12,2),
    status VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE search_histories (
    search_id INT PRIMARY KEY,
    customer_id INT,
    search_type VARCHAR(20),
    query_text TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE voice_search_queries (
    voice_query_id INT PRIMARY KEY,
    search_id INT,
    audio_path VARCHAR(500),
    recognized_text TEXT,
    FOREIGN KEY (search_id) REFERENCES search_histories(search_id)
);

CREATE TABLE image_search_queries (
    image_query_id INT PRIMARY KEY,
    search_id INT,
    image_path VARCHAR(500),
    query_embedding TEXT,
    FOREIGN KEY (search_id) REFERENCES search_histories(search_id)
);
