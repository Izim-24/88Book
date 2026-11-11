# 88Book: implemented system

This document describes the React, Express and SQL Server application in this repository. The broader diagrams in `docs/design/` are a proposed future design, not a list of implemented integrations. `88book-current-system.xmi` contains an importable UML model of the current actors, classes, methods and relationships. XMI does not preserve diagram coordinates in Visual Paradigm.

## System context

```mermaid
flowchart LR
  Guest[Guest] --> Web[88Book React web app]
  Buyer[Buyer] --> Web
  Admin[Administrator] --> Web
  Web -->|JSON and JWT| API[Express REST API]
  API --> DB[(SQL Server)]
  API --> Covers[(Local book cover uploads)]
  Web -->|Browser speech recognition| Speech[Speech recognition API]
  API -->|Optional book guide| AI[Configured AI provider]
```

The application has no payment gateway, shipping carrier integration, payment webhooks or automated confirmation email. New orders use cash on delivery. Tracking shown by the application is based on internal order states and a separate demo view.

## Current use cases

```mermaid
flowchart LR
  Guest --> Browse[Browse and search books]
  Guest --> Image[Search by cover image]
  Guest --> Voice[Search by voice]
  Guest --> Auth[Register or sign in]
  Buyer --> Cart[Manage cart and wishlist]
  Buyer --> Checkout[Place COD order]
  Buyer --> Orders[View, track or cancel order]
  Buyer --> Profile[Manage profile and addresses]
  Admin --> Catalog[Manage books and recommendations]
  Admin --> Users[Manage users]
  Admin --> Fulfil[Update order status]
```

Image search uses the implemented cover matching/OCR flow. Voice search converts speech to text and searches the catalog. Neither depends on a vector database.

## Database relationships

```mermaid
erDiagram
  users ||--o{ books : administers
  users ||--o{ cart_items : owns
  books ||--o{ cart_items : selected_in
  users ||--o{ orders : places
  orders ||--|{ order_items : contains
  books ||--o{ order_items : ordered_as
  users ||--o{ user_addresses : saves
  users ||--o{ wishlists : saves
  books ||--o{ wishlists : appears_in
  books ||--o| recommendations : featured_as
  users ||--o{ book_search_history : records
  users |o--o{ voice_search_queries : records
```

`orders.shipping_address` stores a snapshot of the delivery details supplied at checkout. `order_items.price` stores the book price at purchase time. The database migration adds nonnegative price/stock and positive quantity checks; it will report an error if existing rows violate them, so correct those rows before applying it.

## Checkout and cancellation

```mermaid
sequenceDiagram
  actor Buyer
  participant Web as React checkout
  participant API as Order API
  participant DB as SQL Server transaction
  Buyer->>Web: Enter delivery details and place order
  Web->>API: POST /api/orders (address, cash_on_delivery)
  API->>DB: Lock and read cart with current book prices
  DB-->>API: Cart items
  API->>API: Calculate subtotal, 8% tax, shipping
  API->>DB: Insert order and item snapshots
  loop Each item
    API->>DB: Decrement stock only if enough remains
  end
  alt Stock and writes succeed
    API->>DB: Delete cart and commit
    API-->>Web: Order ID and server total
  else Error or insufficient stock
    API->>DB: Roll back all writes
    API-->>Web: Error
  end
```

```mermaid
stateDiagram-v2
  [*] --> accepted
  accepted --> shipped
  shipped --> delivered
  accepted --> cancelled
```

Only an accepted order can be cancelled. Cancellation and stock restoration happen in the same transaction. Admin status updates follow the same state graph.

## Pricing and runtime

- The shared `calculateOrderTotals` function is used by cart, checkout and order creation. It applies 8% tax, a 30,000 ₫ shipping fee and free shipping at 1,000,000 ₫ subtotal.
- The server calculates the saved total from database prices; it does not trust a client total.
- The checkout never asks for or stores card credentials. A real online payment option would require a payment provider and separate payment state.
- Frontend: `npm run dev` at the repository root. Backend: `npm run dev` in `backend/`. Database: `npm run migrate` in `backend/` after configuring `.env` and SQL Server.
