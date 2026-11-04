# Online Bookstore System Design

This is a target design for the expanded 88Book capstone system described in the
requirements prompt. It is not a claim that all designed features already exist
in the current application.

## Assumptions

- The proposed target uses a React customer/admin web client, a modular
  monolithic REST backend, PostgreSQL, S3-compatible object storage, a
  CLIP-compatible embedding model with pgvector, and external payment, shipping,
  and notification providers.
- These are design defaults, not implementation mandates. Provider-specific
  calls stay behind adapters.
- Customers can check out as registered users. Guest browsing and searching
  are allowed; checkout requires authentication.
- A checkout creates a pending order with immutable item/address/price snapshots
  and an idempotency key. Inventory is reserved transactionally with an
  expiration time.
- Prepaid orders require successful payment before fulfillment. COD orders can
  proceed without recording a collected payment. COD collection is recorded
  separately on delivery/reconciliation.
- An order can be split into shipments. Shipment creation is asynchronous and
  recoverable; order, payment, and shipment states remain separate.
- Reviews are permitted only for customers with a delivered order containing
  the reviewed book. Coupons have a single supported discount rule per
  redemption; stacking is disabled unless configured later.
- Temporary search uploads are private and short-lived. Catalog images are
  stored in object storage; embedding records contain a stable image reference,
  model/version, and vector.
- Similarity threshold and top-K are configurable. Similarity is a ranking
  signal, not a guarantee of correct identification.

## Diagram index

Each `@startuml` / `@enduml` block below is a separate diagram.

| No. | Group | Diagram |
|---:|---|---|
| 1 | Architecture | System Context |
| 2 | Architecture | High-Level Architecture |
| 3 | Architecture | UML Component |
| 4 | Architecture | Deployment |
| 5 | Business Analysis | UML Use Case |
| 6 | Business Analysis | Book Search Activity |
| 7 | Business Analysis | Shopping Cart Activity |
| 8 | Business Analysis | Checkout Activity |
| 9 | Business Analysis | Order Cancellation Activity |
| 10 | Business Analysis | Checkout and Payment Sequence |
| 11 | Business Analysis | Shipping Integration Sequence |
| 12 | Business Analysis | Shipment Tracking Activity |
| 13 | Business Analysis | Image Search Activity |
| 14 | Business Analysis | Image Search Sequence |
| 15 | Business Analysis | Order State Machine |
| 16 | Business Analysis | Payment State Machine |
| 17 | Business Analysis | Shipment State Machine |
| 18 | Database | Entity Relationship Diagram |
| 19 | Database | Logical Database Schema |
| 20 | Database | UML Domain Class |
| 21 | Integrations | Keyword Search Architecture |
| 22 | Integrations | Image Search Architecture |
| 23 | Integrations | Image Embedding Indexing Pipeline |
| 24 | Integrations | Shipping Provider Integration |
| 25 | Integrations | Payment Gateway Integration |
| 26 | Integrations | Webhook Processing and Retry |
| 27 | User Interface | Customer Website Sitemap |
| 28 | User Interface | Customer Checkout Flow |
| 29 | User Interface | Image Search User Flow |
| 30 | User Interface | Admin Dashboard Sitemap |

## Files

- `architecture.puml`: diagrams 1-4.
- `business-workflows.puml`: diagrams 5-17.
- `database.puml`: diagrams 18-20.
- `integrations.puml`: diagrams 21-26.
- `user-flows.puml`: diagrams 27-30.
- `online-bookstore.xmi`: UML interchange model for core actors, use cases,
  modules, domain classes, and relationships. It contains no vendor-specific
  diagram layout extensions.
- `diagram-guide.md`: purpose, explanation, and assumptions for all 30 diagrams.

## Visual Paradigm

`online-bookstore.xmi` is standard UML XMI 2.5.1 and is intended for import
through the XMI workflow in Visual Paradigm. Import support can vary by edition
and version; the import could not be tested here. XMI exchanges model elements
and relationships; it does not guarantee that diagram pages, coordinates,
styling, or every tool-specific element are reconstructed. The `.puml` files
are separate, readable source diagrams and are not claimed to be native `.vpp`
files or automatically editable Visual Paradigm diagrams. Recreate or arrange
diagram views in Visual Paradigm after importing the model as needed.

The PlantUML files can be rendered with a PlantUML-compatible renderer for
review. Keep the module/entity/state names aligned with the XMI model when
editing either representation.

## State ownership and integration reliability

- `Order.status` captures commercial fulfillment progress. Payment and shipment
  lifecycles are tracked independently.
- Payment webhooks are signature-verified and deduplicated by provider event
  ID. Payment requests use stable idempotency keys. Raw secrets and card
  credentials are never persisted.
- Shipment commands are persisted in an outbox in the same transaction as the
  eligibility change. A worker calls the shipping adapter with timeouts,
  retries, and an idempotency key, then records results. A reconciliation job
  retries eligible failures.
- Inventory reservation, checkout idempotency, coupon redemption, webhook
  deduplication, and provider command idempotency are enforced with database
  constraints/transactions rather than in-memory checks alone.
- A transactional inbox/outbox and retry queue provide at-least-once delivery;
  handlers must be idempotent. External provider calls and local database
  transactions are not treated as one atomic operation.

## Suggested import/review order

1. Review the system context and high-level architecture.
2. Import the XMI model and inspect actors, use cases, modules, and domain
   relationships.
3. Review database and state diagrams against the business rules above.
4. Render each PlantUML source block separately and compare it with the XMI
   model before creating or arranging Visual Paradigm diagram views.
