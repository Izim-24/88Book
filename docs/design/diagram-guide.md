# Diagram Guide

The diagrams are separate PlantUML blocks in the corresponding `.puml` files.
This guide states each diagram's purpose, how to read it, and key assumptions.

## Group A — System Architecture

1. **System Context** — Defines the system boundary and external responsibilities.
   Actors use bookstore capabilities; payment, shipping, and notification
   providers remain external. Provider operations are not owned by the system.
2. **High-Level Architecture** — Shows the web clients, modular monolith,
   persistence, workers, and provider adapters. The backend is one deployable
   application with separated business modules, not a microservice fleet.
3. **UML Component** — Shows module dependencies and adapter ports. Payment and
   shipping orchestrators depend on interfaces so provider implementations can
   be replaced without coupling domain modules to vendor APIs.
4. **Deployment** — Shows a containerized application, database/vector index,
   object storage, browser clients, and external providers. HTTPS, private data
   connections, and temporary-upload isolation are assumed.

## Group B — UML and Business Analysis

5. **UML Use Case** — Assigns customer, guest, administrator, and provider
   responsibilities. Online payment and COD extend checkout as alternatives;
   authentication is required for checkout.
6. **Book Search Activity** — Describes keyword search validation, filtering,
   ranking, and pagination. Search fields and sort choices are bounded and
   allow-listed.
7. **Shopping Cart Activity** — Describes authenticated cart mutations and
   availability checks. A cart is a mutable request, not a price guarantee;
   checkout revalidates price and stock.
8. **Checkout Activity** — Shows validation, inventory locking/reservation,
   order snapshots, idempotency, payment initiation, and COD behavior. Prepaid
   gateway calls happen outside the database transaction and can be retried.
9. **Order Cancellation Activity** — Guards cancellation by ownership and
   fulfillment state, releases eligible reservations, and refunds captured
   prepaid amounts asynchronously. Cancellation is not allowed after carrier
   handoff by default.
10. **Checkout and Payment Sequence** — Shows interactions among the client,
    checkout, inventory, order, payment, database, and gateway. COD is not
    represented as money collected.
11. **Shipping Integration Sequence** — Shows durable shipment commands,
    provider calls, retryable failures, and tracking callbacks. The local
    transaction and carrier operation are not atomic.
12. **Shipment Tracking Activity** — Verifies and deduplicates provider events,
    validates transitions, stores history, and sends notifications through an
    outbox. Invalid or out-of-order events are recorded for investigation.
13. **Image Search Activity** — Validates and safely preprocesses a temporary
    image, generates a versioned embedding, and ranks top-K catalog matches.
    No accuracy guarantee is assumed.
14. **Image Search Sequence** — Shows upload handling, temporary storage,
    embedding generation, vector retrieval, and metadata lookup. Results are
    filtered to valid catalog records and image cleanup is scheduled.
15. **Order State Machine** — Defines commercial/fulfillment state transitions.
    Order state remains separate from payment and shipment state; shipment
    completion is aggregated across shipments.
16. **Payment State Machine** — Defines payment-attempt transitions and refunds.
    Each provider attempt is retained. COD is a method/collection record, not a
    `SUCCEEDED` payment before collection.
17. **Shipment State Machine** — Defines carrier fulfillment transitions,
    delivery exceptions, returns, and cancellation. Carrier events may be
    retried or arrive out of order.

## Group C — Database Design

18. **Entity Relationship Diagram** — Shows core tables and relationship
    cardinalities. Join tables model many-to-many relationships; a single order
    can have multiple payment attempts and shipments.
19. **Logical Database Schema** — Adds representative columns, key and
    constraint intent, and schema groupings. Money uses fixed-precision
    `numeric`; order item and shipping address snapshots preserve purchase-time
    values. `vector(N)` is supplied by the selected vector extension and `N`
    must match the chosen model version.
20. **UML Domain Class** — Presents domain concepts and associations independent
    of SQL storage. The class model mirrors the ERD and distinguishes order,
    payment, and shipment state.

## Group D — Search and External Integrations

21. **Keyword Search Architecture** — Separates query validation, catalog
    search, optional history, and ranking. Search history is optional and only
    tied to an authenticated customer.
22. **Image Search Architecture** — Shows the online query path from upload
    through vector retrieval to catalog metadata. Temporary uploads are private,
    and model versions prevent invalid cross-model comparisons.
23. **Image Embedding Indexing Pipeline** — Shows offline indexing on catalog
    image creation or change. An image is not searchable until its embedding
    job succeeds; retries are idempotent.
24. **Shipping Provider Integration** — Shows rate quote, service selection,
    shipment creation, event updates, and recovery. A shipping adapter isolates
    provider-specific formats and retry behavior.
25. **Payment Gateway Integration** — Shows payment-intent creation and verified
    callbacks. Provider references and attempt state are persisted; card
    credentials and provider secrets are not.
26. **Webhook Processing and Retry** — Shows signature verification, inbox
    deduplication, bounded retries, dead-letter handling, and idempotent
    processing. Durable database records are the source of recovery.

## Group E — User Interface

27. **Customer Website Sitemap** — Maps customer-facing pages and navigation.
   Guest access covers discovery; account, checkout, history, and reviews
   require authentication or appropriate eligibility.
28. **Customer Checkout Flow** — Shows address validation, shipping quote,
   coupon, total review, checkout, and alternative prepaid/COD outcomes.
   Inventory and totals are revalidated at submission.
29. **Search by Image User Flow** — Shows capture/upload validation and result,
   no-match, and error paths. The UI presents similarity as a hint rather than
   certain identification.
30. **Admin Dashboard Sitemap** — Maps administrative catalog, inventory,
   fulfillment, access, promotion, moderation, and reporting screens. Reindex
   operations are permissioned and expose failures.
