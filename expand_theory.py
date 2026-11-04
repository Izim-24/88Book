from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement

BASE=Path(r'D:\STUDY\88Book\deliverables')
SOURCE=BASE/'Multimodal_Ecommerce_Search_Chapters_1_to_4_Final_Style.docx'
TARGET=BASE/'Multimodal_Ecommerce_Search_Chapters_1_to_4_Expanded.docx'
doc=Document(SOURCE)
black=RGBColor(0,0,0)
if 'Equation' not in doc.styles:
    s=doc.styles.add_style('Equation',WD_STYLE_TYPE.PARAGRAPH)
else: s=doc.styles['Equation']
s.font.name='Cambria Math'; s.font.size=Pt(11.5); s.font.color.rgb=black
s.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER
s.paragraph_format.space_before=Pt(4); s.paragraph_format.space_after=Pt(7)
s.paragraph_format.keep_together=True

def heading_anchor(prefix):
    return next(p for p in doc.paragraphs if p.style.name.startswith('Heading') and p.text.startswith(prefix))
def insert(anchor, text, style='Normal'):
    p=doc.add_paragraph(style=style)
    r=p.add_run(text); r.font.name='Times New Roman'; r.font.size=Pt(11.5 if style=='Normal' else 11.5)
    r.font.color.rgb=black
    if style.startswith('Heading'): r.bold=True
    anchor._p.addprevious(p._p)
    return p
def eq(anchor, formula):
    p=doc.add_paragraph(style='Equation')
    math=OxmlElement('m:oMath'); run=OxmlElement('m:r'); txt=OxmlElement('m:t')
    txt.text=formula; run.append(txt); math.append(run); p._p.append(math)
    anchor._p.addprevious(p._p)
    return p

# Chapter 1: distinguish requirements engineering theory from local planning heuristics.
a=heading_anchor('1.8 Prioritization')
insert(a,'Theoretical basis for verifiable requirements','Heading 3')
insert(a,'Requirements engineering links an observed stakeholder need to a statement that can be examined and later tested. ISO/IEC/IEEE 29148 distinguishes verification of a requirement (is the statement well formed?) from validation (does the set describe the system stakeholders actually need?) [8]. A search requirement therefore needs both a precise input/output contract and evidence that the feature solves a real product-discovery problem. For example, “fast image search” is not verifiable until the test population, catalog size, latency percentile, device class and measurement boundary are specified.')
insert(a,'An acceptance criterion can be written as a predicate over inputs, system state and outputs. Let q be a submitted query, c the eligible catalog and R(q,c) the returned ranked list. For a valid request with topK = k, the observable contract is that every returned item satisfies the hard filters, the list contains at most k items, and ordering follows the documented score and tie rule. For invalid input, the expected result is a defined validation error rather than an arbitrary empty list. This formulation helps separate a testable requirement from a proposed interface design.')
eq(a,'Valid(q) ⇒ |R(q,c)| ≤ k  ∧  ∀p ∈ R(q,c): Eligible(p,q)')
insert(a,'A complete requirements record should identify source, rationale, priority, acceptance test and dependency. “Source” is evidence such as an observed task or stakeholder statement; it is not a claim that every request is automatically in scope. Requirements with uncertain provenance can be retained as hypotheses and tested with a prototype before implementation. This reduces the chance that a design choice, such as a particular embedding model, is mistaken for a business requirement.')

a=heading_anchor('1.10 Example')
insert(a,'Traceability and change impact as measurable controls','Heading 3')
insert(a,'Traceability is a graph from needs to requirements, use cases, design elements and tests. A forward link shows that a need is implemented; a backward link explains why a model element exists. A practical coverage measure is the share of approved requirements linked to at least one executable or reviewable verification case. It measures documentation coverage, not software quality: a linked test may still be weak or incorrect.')
eq(a,'Traceability coverage = requirements with verification evidence / approved requirements')
insert(a,'Suppose seven approved requirements exist and six have a linked verification case. Coverage is 6/7 = 85.7%. The missing link should be investigated before claiming the release is fully checked. When a change request alters the price filter from a strict upper bound to an inclusive bound, the analyst follows links to SearchQuery validation, the repository query, ranking examples, acceptance tests and user-facing filter wording. This is more reliable than editing a single sentence and assuming the rest of the design remains consistent.')
insert(a,'Priority can be recorded with a decision rationale rather than an opaque numeric score. User value, risk reduction, dependency and implementation effort are relevant factors, but weights are context-dependent. In this case, ownership checks and valid query handling are prerequisites for trustworthy search and order lookup; a learned visual embedding is an improvement candidate after a reproducible baseline and held-out evaluation exist. The distinction prevents project planning from presenting an arbitrary weight formula as an industry standard.')

# Chapter 2: formal model semantics and cross-model consistency.
a=heading_anchor('2.7 Data analysis')
insert(a,'Multiplicity, invariants and purchase-time values','Heading 3')
insert(a,'A UML multiplicity states how many instances at one association end may be related to one instance at the other end [9]. In the domain model, one Customer may own 0..* Orders, but each Order has exactly one Customer. One confirmed Order has 1..* OrderLines. These are distinct from database nullability: a foreign key can enforce that an order references an existing customer, while the “at least one line for each confirmed order” rule involves rows in another table and requires application transaction logic or a suitable database mechanism.')
insert(a,'An invariant is a condition that must remain true whenever an object or transaction reaches a valid state. Quantity is a positive integer; total and unit price are nonnegative; topK is positive; and every returned order belongs to the authenticated customer. The value of an order is computed from purchase-time line snapshots, not from today’s mutable PRODUCT price. The simplified formula below excludes tax and discounts that would need explicit fields and rules in a production checkout.')
eq(a,'Order subtotal = Σ(i = 1..n) quantity_i × unitPriceSnapshot_i')
insert(a,'For two units at 120,000 VND and one at 80,000 VND, the subtotal is 320,000 VND. If the catalog later changes the first price to 130,000 VND, the historical subtotal remains 320,000 VND because ORDER_LINE stores 120,000 VND as its snapshot. This example explains why a purchase record references a product identifier yet retains a separate title and price at the time of confirmation. It also clarifies that the current search prototype does not execute checkout.')

a=heading_anchor('2.12 Chapter conclusion')
insert(a,'Cross-model verification procedure','Heading 3')
insert(a,'A use-case model, activity diagram, sequence diagram, class diagram and state model are different views of the same behavior. Their agreement can be checked systematically. Each use-case step should have an actor or component responsible for it; each decision branch should appear in an alternate or exception flow; each message should name an operation supplied by a participant; and each persisted fact should have an owner in the data model. The OMG UML specification provides the semantics of classes, properties, associations and multiplicities used in this review [9].')
insert(a,'Consider a payment timeout. The use case must describe the uncertain outcome; the activity diagram must branch to reconciliation; the sequence must carry an idempotency key and provider reference; and the order state model must avoid jumping straight to “paid.” If only the sequence diagram includes a retry, the models contradict one another. A reviewer can therefore trace one exceptional scenario across all views instead of checking each diagram in isolation.')
eq(a,'Consistency check = requirement ↔ use case ↔ interaction ↔ state/data ↔ test')
insert(a,'The arrows denote required trace links, not numeric equality. A missing link is a review item. The same method applies to search: the strict price bound in Chapter 1 must match the data rule, repository predicate and boundary test in Chapters 2 and 4. This cross-model audit is especially useful when a diagram is revised in Visual Paradigm because an updated image alone does not guarantee that the prose, SQL and code still agree.')

# Chapter 3: retrieval, multimodal scores and evaluation measures.
a=heading_anchor('3.5 Voice search')
insert(a,'Vector-space retrieval as an extension beyond the baseline','Heading 3')
insert(a,'The prototype uses token overlap for lexical ranking. A larger catalog can compare this baseline with a vector-space method. Term frequency tf(t,d) measures occurrences of term t in product document d; inverse document frequency reduces the influence of terms present in many products. A common weighting is tf-idf, followed by cosine normalization, as described in the information-retrieval literature [10]. This is a candidate design for later evaluation, not a claim about the current implementation.')
eq(a,'tfidf(t,d) = tf(t,d) × log(N / df(t))')
insert(a,'Here N is the number of indexed product documents and df(t) is the number containing t. A term found in nearly every description has a small idf and contributes little discrimination. A rare model number can be highly discriminative, although a system must still handle misspellings and variants. After transforming query and product documents into weighted vectors, cosine similarity compares their direction and reduces the effect of document length.')
eq(a,'cos(q,d) = (q · d) / (||q|| × ||d||)')
insert(a,'For a tiny twelve-product fixture, IDF estimates are unstable and the added machinery may not improve relevance. Any replacement of the current lexical score should be evaluated against the same held-out queries, with preprocessing, candidate filters and tie-breaks fixed. The key engineering question is whether the method improves task success for unseen queries, not merely whether it uses a more sophisticated model.')

a=heading_anchor('3.7 Packaging OCR')
insert(a,'Visual descriptor geometry and score calibration','Heading 3')
insert(a,'The baseline image descriptor in this project is a 48-component vector: sixteen color-histogram bins for each RGB channel after resizing to 64 × 64 pixels. Dividing by its Euclidean length produces a unit vector. The dot product of two such unit vectors equals their cosine similarity. This captures global color distribution but not object shape, texture position, brand text or category. A blue shirt against a blue background may appear similar to an unrelated blue object; a crop or category filter can reduce this failure mode.')
eq(a,'h_norm = h / ||h||₂ ;   S_image(a,b) = h_norm(a) · h_norm(b)')
insert(a,'Text and image signals should be placed on comparable scales before a weighted sum is interpreted. In the current prototype both component scores are constrained to [0,1], and combined search uses equal weights. For a candidate with text score 0.67 and image score 0.82, the fused score is 0.745. The calculation is transparent, but equal weighting is a demonstration policy; a larger held-out dataset is needed to determine whether different weights help. Hard category, availability and price filters remain outside the soft score.')
eq(a,'S_fusion = 0.5 × S_text + 0.5 × S_image = 0.5 × 0.67 + 0.5 × 0.82 = 0.745')
insert(a,'When a modality is missing or fails, the system should not silently substitute a fabricated value. Text-only search uses its text score; an invalid combined request returns a validation error; and a temporary image-adapter failure offers a recoverable path. This distinction matters for explainability because the displayed result should correspond to the signals that were actually computed. A production design can log component scores and descriptor versions for debugging without retaining raw user images indefinitely.')

a=heading_anchor('3.10 Prototype test results')
insert(a,'Evaluation formulas and a worked ranking example','Heading 3')
insert(a,'Offline retrieval tests require a fixed query set and independent relevance judgments. Precision@k is the fraction of the first k results that are relevant; Recall@k is the fraction of all relevant catalog items retrieved in those first k positions. If three of the top five are relevant and the catalog contains four relevant items, Precision@5 = 3/5 = 0.60 and Recall@5 = 3/4 = 0.75. Both values depend on the declared relevance set and should be reported by search mode and category [10].')
eq(a,'Precision@k = relevant items in Top_k / k ;   Recall@k = relevant items in Top_k / all relevant items')
insert(a,'Reciprocal rank measures how soon the first relevant item appears: RR = 1/r, where r is its rank, and MRR averages RR over queries. If the first relevant result appears at position 2, RR = 0.5. NDCG gives greater credit to relevant items near the top and can use graded labels, for example 0 (irrelevant), 1 (partly relevant) and 2 (highly relevant). Its ideal-ranking denominator makes results comparable across queries with different relevance distributions [10].')
eq(a,'DCG@k = Σ(i = 1..k) (2^{rel_i} − 1) / log₂(i + 1) ;   NDCG@k = DCG@k / IDCG@k')
insert(a,'Voice recognition needs a different diagnostic measure. Word Error Rate counts substitutions S, deletions D and insertions I relative to N reference words: WER = (S + D + I)/N [12]. A single wrong number or brand can harm search even if WER is low, so task success and transcript correction rate must accompany WER. Likewise, the prototype’s 11/13 scenario result is a descriptive fraction for that curated fixture set, not an estimate of performance on all shoppers, unseen images or live speech.')
eq(a,'WER = (S + D + I) / N')

# Chapter 4: database theory, contracts, dependencies and generated code.
a=heading_anchor('4.3 Class diagram in design')
insert(a,'Functional dependencies and normalisation','Heading 3')
insert(a,'Relational design begins by identifying keys and functional dependencies. In PRODUCT, product_id determines the catalog title, category, price and availability at a given version. In ORDER_LINE, order_line_id determines order_id, product_id, quantity and purchase-time snapshots. A table with repeated order headers for every line would create update anomalies: changing a customer or order status would require synchronized edits to several rows. Separating ORDER_HEADER and ORDER_LINE represents a one-to-many relationship and keeps facts with their natural keys.')
eq(a,'product_id → {title, category_id, currentPrice, availability}')
insert(a,'First normal form requires atomic fields; second normal form removes dependencies on part of a composite key; third normal form removes non-key attributes that depend transitively on a key through another non-key attribute. These are design checks, not a promise that every useful database contains no repeated values. The order line deliberately stores a title and price snapshot because historical purchase facts must remain stable when PRODUCT changes. A snapshot is an attribute of the order event, not a redundant copy of today’s catalog state.')
insert(a,'Primary keys identify rows, foreign keys preserve references, and CHECK constraints protect row-local rules such as quantity > 0. PostgreSQL documentation notes that a CHECK constraint should not be used to enforce a condition involving other table rows; a confirmed order having at least one line therefore needs transaction logic or a suitable trigger [11]. The DDL import package expresses the row-local constraints and references, while the report states the remaining cross-row invariant explicitly.')

a=heading_anchor('4.4 Layers, classes and relationships')
insert(a,'Operation contracts and design refinements','Heading 3')
insert(a,'A design class is more precise than an analysis concept because it declares operations, types, visibility and dependencies. The SearchService.execute operation has preconditions: topK > 0, the category is recognized if present, the price bound is nonnegative, and the requested mode has the required input. Its postconditions state that every returned product passed hard filters, no more than topK results are present, and the list is ordered by score with a stable product-ID tie. A failed precondition produces a documented validation response rather than an undefined score.')
eq(a,'Pre(SearchService.execute): topK > 0 ∧ maxPrice ≥ 0 (when supplied)')
eq(a,'Post(SearchService.execute): |results| ≤ topK ∧ sorted(results, score↓, productId↑)')
insert(a,'The repository interface expresses what the application needs without exposing SQL. PostgresProductRepository realizes that interface and binds parameters rather than interpolating request text. Similarly, OrderRepository.findOwned receives a customer identity derived from the session. A unit test can replace each repository with an in-memory fixture, while an integration test checks the SQL implementation against the schema. The separation makes the class diagram a useful contract rather than a decorative picture.')

a=heading_anchor('4.5 Generated code')
insert(a,'Dependency direction and computational cost','Heading 3')
insert(a,'The presentation layer depends on application use cases; application logic depends on domain contracts; infrastructure implements those contracts. A domain class must not import an HTTP controller, database driver or provider SDK. This is an architectural invariant that can be checked by inspecting package imports. In the multimodal path, the same SearchService can use a JSON fixture repository in the prototype and a PostgreSQL adapter later without changing the Ranker contract.')
insert(a,'A simple ranking loop over n eligible candidates and descriptor dimension d performs work proportional to n × d for image comparisons, followed by ordering. Sorting all n scores costs O(n log n); maintaining only the best k candidates with a heap can reduce the ordering step to O(n log k). These are asymptotic explanations, not measured latency claims. Actual response time also depends on candidate filtering, image decoding, I/O, cache behavior and model inference. A performance requirement must name a catalog scale and a measurement environment before setting a target.')
eq(a,'T_bruteforce(n,d,k) ≈ O(n d + n log n) ;   T_topk(n,d,k) ≈ O(n d + n log k)')
insert(a,'Latency can be budgeted by stage to reveal bottlenecks: request validation, candidate retrieval, optional descriptor extraction, scoring and response serialization. Measuring each stage is more actionable than reporting only the total. If image extraction dominates, a cache keyed by image hash and model version may help; if database filtering dominates, inspect indexes and query plans. The cache must be invalidated when an image or model version changes so stale vectors do not silently alter ranking.')

a=next(p for p in doc.paragraphs if p.text.startswith('Chapter 4 conclusion.'))
insert(a,'Limits of structural code generation','Heading 3')
insert(a,'Code generation from a class model is strongest at repeatable structure: packages, class names, attributes, interfaces and method signatures. It does not infer the correct ranking policy, validate uploaded bytes, guarantee authenticated ownership, implement a distributed payment transaction or choose safe error responses. Those behaviors require explicit contracts and tests. The supplied Java skeleton demonstrates the package boundaries and text-mode ranking path; IMAGE and COMBINED modes deliberately require a real descriptor adapter rather than fabricated scores.')
insert(a,'A useful review compares four artifacts for each operation: the requirement statement, diagram signature, generated or hand-written code, and acceptance test. For example, the strict price condition appears in the requirement, ProductRepository query, SQL predicate and boundary test at exactly the threshold. Any mismatch is a defect even when code compiles. This review also guards against assuming that importing XMI into Visual Paradigm has validated the business logic: XMI preserves model structure, while correctness depends on the semantics implemented behind that structure.')

# Human-readable primary references for the added theory.
for line in [
 '[8] ISO/IEC/IEEE, ISO/IEC/IEEE 29148:2018, Systems and software engineering - Life cycle processes - Requirements engineering. https://www.iso.org/standard/72089.html',
 '[9] Object Management Group, Unified Modeling Language (UML), Version 2.5.1, 2017. https://www.omg.org/spec/UML/2.5.1/PDF',
 '[10] C. D. Manning, P. Raghavan and H. Schutze, Introduction to Information Retrieval, Cambridge University Press, 2008. https://nlp.stanford.edu/IR-book/',
 '[11] PostgreSQL Global Development Group, PostgreSQL Documentation, Constraints. https://www.postgresql.org/docs/current/ddl-constraints.html',
 '[12] P. Jamshid Lou and M. Johnson, End-to-End Speech Recognition and Disfluency Removal, Findings of EMNLP, 2020. https://aclanthology.org/2020.findings-emnlp.186/',
]:
    p=doc.add_paragraph(line)
    for r in p.runs: r.font.name='Times New Roman'; r.font.size=Pt(11.5); r.font.color.rgb=black

doc.save(TARGET)
print(TARGET)
