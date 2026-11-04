from pathlib import Path
from copy import deepcopy
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path(r'D:\STUDY\88Book')
OUT = ROOT / 'deliverables'
VP = OUT / 'visual_paradigm'
FIG = OUT / 'figures'
for p in (OUT, VP, FIG): p.mkdir(parents=True, exist_ok=True)
SOURCE = Path(r'C:\Users\Izim\Documents\Codex\2026-10-14\t\outputs\tieuluan_V1_04_09_MinhLQ_550_VPStyle_Routed.docx')
TARGET = OUT / 'Multimodal_Ecommerce_Search_Chapters_1_to_4.docx'

FONT = r'C:\Windows\Fonts\arial.ttf'
FONTB = r'C:\Windows\Fonts\arialbd.ttf'
def font(size, bold=False): return ImageFont.truetype(FONTB if bold else FONT, size)
def canvas(name, title, boxes, edges, size=(1900, 1200)):
    im = Image.new('RGB', size, 'white'); d = ImageDraw.Draw(im)
    d.text((55, 35), title, fill='#13243a', font=font(38, True))
    for b in boxes:
        x,y,w,h,head,lines = b
        d.rounded_rectangle((x,y,x+w,y+h), 12, fill='#f7f9fc', outline='#273c55', width=3)
        d.rounded_rectangle((x,y,x+w,y+54), 12, fill='#dce9f5', outline='#273c55', width=3)
        d.rectangle((x,y+42,x+w,y+54), fill='#dce9f5')
        head_size=27
        while d.textbbox((0,0),head,font=font(head_size,True))[2] > w-30 and head_size>17: head_size-=1
        d.text((x+15,y+10),head,fill='#102a43',font=font(head_size,True))
        for i,line in enumerate(lines):
            line_size=23
            while d.textbbox((0,0),line,font=font(line_size))[2] > w-32 and line_size>17: line_size-=1
            d.text((x+17,y+70+i*36),line,fill='#263747',font=font(line_size))
    for x1,y1,x2,y2,label in edges:
        d.line((x1,y1,x2,y2), fill='#334e68', width=4)
        if label: d.text(((x1+x2)//2+8,(y1+y2)//2-30),label,fill='#9b2c2c',font=font(22,True))
    im.save(FIG / name)

canvas('figure11_analysis_classes.png','Figure 11. Analysis classes and responsibilities',[
 (70,170,470,205,'SearchUI <<boundary>>',['+submitQuery()', '+showResults()', '+showError()']),
 (700,170,500,205,'SearchController <<control>>',['+validate()', '+search()', '+findOrder()']),
 (1370,170,460,205,'SearchQuery <<entity>>',['mode, text, imageRef','filters, topK']),
 (700,510,500,240,'SearchService <<control>>',['+retrieveCandidates()', '+rank()', '+applyFilters()']),
 (70,845,470,220,'Product <<entity>>',['productId, title, category','price, imageUri, availability']),
 (700,845,500,220,'SearchResult <<entity>>',['productId, textScore','imageScore, finalScore, rank']),
 (1370,845,460,220,'Order <<entity>>',['orderId, customerId','status, total, createdAt'])],
 [(540,272,700,272,'calls'),(1200,272,1370,272,'creates'),(950,375,950,510,'delegates'),(700,670,540,950,'reads 0..*'),(950,750,950,845,'returns 0..*')])

canvas('figure12_data_model.png','Figure 12. Logical relational data model',[
 (70,150,460,225,'CUSTOMER',['PK customer_id','email UNIQUE, status','created_at']),
 (720,150,470,225,'ORDER_HEADER',['PK order_id','FK customer_id','status, total, created_at']),
 (1370,150,460,225,'ORDER_LINE',['PK order_line_id','FK order_id, FK product_id','qty, unit_price_snapshot']),
 (70,740,460,225,'CATEGORY',['PK category_id','name UNIQUE']),
 (720,740,470,225,'PRODUCT',['PK product_id','FK category_id','title, price, availability']),
 (1370,740,460,225,'PRODUCT_IMAGE',['PK image_id','FK product_id','uri, provenance, version'])],
 [(530,262,720,262,'1 to 0..*'),(1190,262,1370,262,'1 to 1..*'),(530,852,720,852,'1 to 0..*'),(1190,852,1370,852,'1 to 0..*'),(1530,375,980,740,'product 1 to lines 0..*')])

canvas('figure13_design_classes.png','Figure 13. Design classes and interfaces',[
 (50,160,430,215,'SearchController',['+search(request): ResultPage','+getOrder(id): OrderDTO']),
 (590,160,430,215,'SearchService',['+execute(query): ResultPage','-rank(candidates): List']),
 (1130,160,330,215,'QueryNormalizer',['+normalize(text): String','+validate(filters): void']),
 (1520,160,330,215,'ImageDescriptor',['+extract(bytes): Vector','+similarity(a,b): double']),
 (50,690,430,240,'OrderRepository <<interface>>',['+findOwned(customer,id)','+findLatestOwned(customer)']),
 (590,690,430,240,'ProductRepository <<interface>>',['+findEligible(filters): List','+findById(id): Product']),
 (1130,690,330,240,'Ranker',['+scoreText(q,p): double','+combine(t,i): double']),
 (1520,690,330,240,'PostgresProductRepository',['+findEligible(filters)','+findById(id)'])],
 [(480,270,590,270,'uses'),(1020,270,1130,270,'uses'),(1460,270,1520,270,'uses'),(800,375,800,690,'uses'),(1010,375,1295,690,'scores')])

canvas('figure14_layers.png','Figure 14. Layered design and dependencies',[
 (100,170,1700,155,'Presentation layer',['SearchUI, OrderLookupUI, request/response DTOs']),
 (100,405,1700,155,'Application layer',['SearchController, SearchService, OrderQueryService']),
 (100,640,1700,155,'Domain layer',['SearchQuery, Product, SearchResult, Ranker, business rules']),
 (100,875,1700,155,'Infrastructure layer',['Postgres repositories, image adapter, logging, database'])],
 [(950,325,950,405,'calls'),(950,560,950,640,'uses'),(950,795,950,875,'ports/adapters')])

doc = Document(SOURCE)
anchor = next(p for p in doc.paragraphs if p.text.strip() == 'CONCLUSION' and p.style.name == 'Heading 1')
def place(obj):
    anchor._p.addprevious(obj._element)
    return obj
def para(text='', style=None, boldlead=None):
    p=doc.add_paragraph(style=style)
    if boldlead and text.startswith(boldlead):
        p.add_run(boldlead).bold=True; p.add_run(text[len(boldlead):])
    else: p.add_run(text)
    return place(p)
def table(headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers))
    t.style='Table Grid'
    for c,v in zip(t.rows[0].cells, headers): c.text=v
    for row in rows:
        cells=t.add_row().cells
        for c,v in zip(cells,row): c.text=str(v)
    if widths:
        for row in t.rows:
            for c,w in zip(row.cells,widths): c.width=Inches(w)
    anchor._p.addprevious(t._element)
    return t
def figure(file, caption, width=6.55):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(FIG/file),width=Inches(width)); place(p)
    para(caption)

p=para('CHAPTER 4. DESIGN', 'Heading 1'); p.paragraph_format.page_break_before=True
para('This chapter converts the analysis model into implementable classes, a relational schema, layer responsibilities, and a code skeleton. It keeps two boundaries explicit: the present prototype supports multimodal product discovery and customer-scoped order lookup; checkout, payment and fulfillment are modeled for a later release. Design decisions below use the same identifiers and ranking rules as Chapters 1–3 so that diagrams, database objects and code can be traced to requirements.')

para('4.1 Class diagram in analysis', 'Heading 2')
para('The analysis class model records concepts and responsibilities without prescribing database tables or framework classes. SearchUI is a boundary object, SearchController and SearchService are control objects, and SearchQuery, Product, SearchResult, Customer and Order are entities. Voice input is represented by a corrected transcript, while an image query carries a temporary image reference or descriptor. This distinction prevents the voice interface from being mistaken for an implemented speech recognizer.')
figure('figure11_analysis_classes.png','Figure 11. Updated analysis class diagram showing boundary, control and entity responsibilities.')
table(['Class','Main responsibility','Key relationship'],[
 ('SearchUI','Collect text, transcript, image and filters; display results and errors.','Calls one SearchController per request.'),
 ('SearchController','Validate request shape and coordinate search or owned-order lookup.','Delegates to SearchService or OrderQueryService.'),
 ('SearchQuery','Hold mode, normalized text, optional image descriptor, filters and topK.','One query produces zero or more SearchResult objects.'),
 ('SearchResult','Pair one Product with component scores, final score and stable rank.','References exactly one Product.'),
 ('Customer and Order','Represent ownership and after-sales lookup.','One Customer owns zero or more Orders; each Order has one owner.')])
para('Relationship update. SearchQuery to SearchResult is one-to-many with lower bound zero because a valid query may return no matches. Product to SearchResult is one-to-many over time because the same catalog item may appear in several queries. Customer to Order is one-to-many; the service must derive customer identity from the authenticated session and must never trust a customer ID supplied solely by the caller. These multiplicities make empty search results and ownership checks explicit.')
para('The analysis diagram deliberately omits persistence technology, HTTP route names and concrete image algorithms. It describes what information moves between responsibilities. The source XMI package in the companion folder contains the class elements and their associations for Visual Paradigm import; after importing, arrange the model into an Analysis Class Diagram if the chosen VP version does not restore layout from XMI.')

para('4.2 Data model and database', 'Heading 2')
para('The logical relational model separates mutable catalog facts from purchase-time snapshots. PRODUCT stores current title, category, price and availability. ORDER_LINE stores quantity, title and unit price as they were confirmed for the order, so later catalog edits cannot rewrite purchase history. PRODUCT_IMAGE stores image origin and version, allowing derived visual features to be refreshed or removed when an asset changes. Search requests need not persist raw uploaded images; transient processing reduces unnecessary retention.')
figure('figure12_data_model.png','Figure 12. Logical database model for catalog, customer and order data.')
table(['Table','Primary key','Foreign keys and important constraints'],[
 ('CATEGORY','category_id','name unique and nonempty.'),
 ('PRODUCT','product_id','category_id references CATEGORY; price >= 0; availability enumerated.'),
 ('PRODUCT_IMAGE','image_id','product_id references PRODUCT; version > 0; provenance recorded.'),
 ('CUSTOMER','customer_id','email unique; account status constrained.'),
 ('ORDER_HEADER','order_id','customer_id references CUSTOMER; total >= 0; state constrained.'),
 ('ORDER_LINE','order_line_id','order_id references ORDER_HEADER; product_id references PRODUCT; quantity > 0; unit_price_snapshot >= 0.')])
para('Referential rules. A category may contain zero or many products; a product belongs to exactly one category. A product may have zero or many images, and each image belongs to one product. A customer may own zero or many orders. Every order must contain at least one order line at the time it becomes confirmed; this cross-row invariant is enforced by checkout application logic or a transaction-level database mechanism. An order line refers to a product identifier for traceability while retaining independent title and price snapshots.')
para('Index and transaction choices. Index PRODUCT(category_id, availability, price) for filter-first retrieval, ORDER_HEADER(customer_id, created_at DESC) for latest-order lookup, and ORDER_LINE(order_id) for order detail. A product title search may add a DBMS-specific full-text index after evaluation. Checkout must recheck stock and price inside a transaction, use a stable idempotency key, and reconcile uncertain payment outcomes before retrying. The PostgreSQL DDL in the companion folder can be imported through Visual Paradigm Reverse DDL to generate an editable ERD; it is a design schema, not a claim that checkout is implemented in the current prototype.')

para('4.3 Class diagram in design', 'Heading 2')
para('The design model refines the analysis controls into interfaces and methods. SearchController owns the entry point and response mapping. QueryNormalizer validates topK, known category and nonnegative price, then normalizes text. SearchService asks ProductRepository for eligible products, obtains image descriptors when needed, calls Ranker, and returns a ResultPage. ProductRepository and OrderRepository are ports; Postgres implementations belong to infrastructure. This division lets a deterministic fixture repository support tests while the application contract remains stable.')
figure('figure13_design_classes.png','Figure 13. Design class diagram with attributes, methods, interfaces and dependencies.')
table(['Design element','Representative operation','Rule or contract'],[
 ('QueryNormalizer','normalize(text), validate(filters)','Trim and collapse whitespace; reject topK <= 0 and negative max price.'),
 ('ProductRepository','findEligible(filters), findById(id)','Apply hard category, availability and price constraints before ranking.'),
 ('ImageDescriptor','extract(bytes), similarity(a,b)','Return a versioned, normalized descriptor; invalid bytes fail safely.'),
 ('Ranker','scoreText(query,product), combine(text,image)','For combined mode use 0.5 text + 0.5 image; break equal scores by productId.'),
 ('OrderRepository','findOwned(customerId,orderId)','Every lookup includes authenticated ownership in the query.')])
para('Relationship update. SearchController has a dependency on SearchService, not ownership of products. SearchService depends on repository interfaces and ranking collaborators. PostgresProductRepository realizes ProductRepository; this permits replacement without changing domain logic. SearchResult is a value object created for each ranked candidate, so its lifetime belongs to one response. The design makes association direction and implementation dependencies explicit rather than depicting every reference as an undirected line.')

para('4.4 Layers, classes and relationships', 'Heading 2')
para('The presentation layer accepts requests and renders results. The application layer coordinates use cases and enforces authorization boundaries. The domain layer contains entities, ranking rules and repository contracts. The infrastructure layer implements database access and image-processing adapters. Dependency arrows point inward toward stable contracts; infrastructure implements ports defined above it. An external speech recognizer, payment gateway or carrier is an optional adapter, not a hidden responsibility of the domain model.')
figure('figure14_layers.png','Figure 14. Layered architecture and permitted dependency direction.')
table(['Layer','Classes or interfaces','Permitted dependency'],[
 ('Presentation','SearchUI, OrderLookupUI, SearchRequestDTO, ResultDTO','Application APIs only.'),
 ('Application','SearchController, SearchService, OrderQueryService','Domain entities and ports.'),
 ('Domain','SearchQuery, Product, SearchResult, Ranker, ProductRepository, OrderRepository','No HTTP or SQL dependencies.'),
 ('Infrastructure','PostgresProductRepository, PostgresOrderRepository, ImageDescriptorAdapter','Implements domain ports; accesses DB or external services.')])
para('A combined search follows one path: SearchUI sends text, image reference and filters to SearchController; QueryNormalizer constructs a valid SearchQuery; ProductRepository returns the eligible candidate set; ImageDescriptorAdapter computes or retrieves descriptors; Ranker calculates component scores and the equal-weight fusion score; SearchService sorts by descending score and then ascending productId and returns at most topK results. Each hard filter is applied before scoring, so a visually similar item cannot bypass a price or category rule. Missing image input in a combined request is a validation error, while a temporary image-processing failure produces a recoverable response rather than fabricated scores.')
para('The layer view also identifies deployment seams. The current local prototype may implement repository ports with JSON fixtures. A production deployment can replace those adapters with PostgreSQL and a versioned descriptor store. The service contract and acceptance tests should stay the same, while measured relevance and latency determine whether a learned embedding is justified.')

para('4.5 Generated code from the layer model', 'Heading 2')
para('The Java skeleton in the companion folder mirrors Figure 14. Package presentation contains request handling and DTOs; application contains orchestration; domain contains immutable query and result models, Ranker and repository interfaces; infrastructure contains database adapters. Visual Paradigm can generate class shells from its imported model, while the supplied skeleton makes method contracts and package ownership concrete. Code generation does not generate business-rule correctness automatically: method bodies, transactions, error mapping and tests require implementation and review.')
table(['Package','Class file','Purpose'],[
 ('presentation','SearchController.java','Accept a request and delegate to the application service.'),
 ('application','SearchService.java','Coordinate validation, candidate retrieval, ranking and topK.'),
 ('domain','SearchQuery.java, Product.java, SearchResult.java','Typed state and response values.'),
 ('domain','ProductRepository.java, Ranker.java','Stable retrieval port and deterministic scoring.'),
 ('infrastructure','PostgresProductRepository.java','SQL-backed adapter implementing ProductRepository.')])
para('For example, Ranker.combine(textScore, imageScore) returns 0.5 × textScore + 0.5 × imageScore only when both component scores are valid numbers in [0,1]. SearchService applies stable ordering using finalScore descending and productId ascending. ProductRepository receives validated filter values and never interpolates user text into SQL. OrderRepository queries by both orderId and session-derived customerId. These contracts are visible in the class files so a reviewer can compare code with the diagrams and the requirements matrix.')
para('Verification follows traceability. FR-01/FR-04 map to SearchController, SearchService, ProductRepository and Ranker; tests cover empty input, price boundary, category filtering, score calculation, tie-break and topK. The authenticated order requirement maps to OrderQueryService and OrderRepository; negative tests attempt cross-customer access. Database tests verify foreign keys, positive quantities and snapshot retention. Figure and source identifiers are aligned across the report and import package.')
para('Chapter 4 conclusion. The design provides an analysis model, relational schema, refined class model, layer view and code contracts for the same system. XMI and DDL give Visual Paradigm editable model data; the figure images make the intended layout and relationships visible in this report. Before implementation, the team should confirm the actual database dialect, image retention policy, category taxonomy and payment-provider contract.')

# Add static contents entries before the first contents CONCLUSION entry.
toc_anchor = next(p for p in doc.paragraphs if p.text.strip()=='CONCLUSION' and p.style.name=='Normal')
for line in ['CHAPTER 4. DESIGN','4.1 Class diagram in analysis','4.2 Data model and database','4.3 Class diagram in design','4.4 Layers, classes and relationships','4.5 Generated code from the layer model']:
    p=doc.add_paragraph(line); toc_anchor._p.addprevious(p._element)

# Update title, subtitle, conclusion and references in-place.
for p in doc.paragraphs:
    if p.text.strip() == 'Requirements, Analysis and AI Applications': p.text='Requirements, Analysis, AI Applications and Design'
    if p.style.name=='Normal' and p.text.startswith('The report defines a traceable requirements and analysis baseline'):
        p.text='The report defines a traceable requirements, analysis and design baseline for a multimodal e-commerce product-search system. Chapters 1–3 establish stakeholder needs, use cases, data and AI evaluation. Chapter 4 translates the same scope into analysis and design classes, a relational schema, a layered architecture and code contracts. The prototype demonstrates text, transcript, image and combined search against a small local catalog, plus customer-scoped order lookup. Checkout and payment remain modeled future scope. The next work should test the imported models in Visual Paradigm, implement adapters against the selected database, improve query coverage and evaluate relevance on held-out data.'

doc.core_properties.title='Multimodal E-Commerce Search System: Requirements, Analysis, AI Applications and Design'
doc.save(TARGET)

# Portable UML 2.1 / XMI 2.1 model data for Visual Paradigm.
XMI='http://www.omg.org/spec/XMI/20110701'; UML='http://www.omg.org/spec/UML/20110701'
ET.register_namespace('xmi',XMI); ET.register_namespace('uml',UML)
root=ET.Element('{%s}XMI'%XMI,{'{%s}version'%XMI:'2.1'})
model=ET.SubElement(root,'{%s}Model'%UML,{'{%s}id'%XMI:'model_search','name':'MultimodalEcommerceSearch'})
def cls(i,name,attrs=(),ops=(),interface=False):
    e=ET.SubElement(model,'packagedElement',{'{%s}type'%XMI:'uml:Interface' if interface else 'uml:Class','{%s}id'%XMI:i,'name':name})
    for j,(n,t) in enumerate(attrs):
        a=ET.SubElement(e,'ownedAttribute',{'{%s}id'%XMI:f'{i}_a{j}','name':n})
        ET.SubElement(a,'type',{'{%s}type'%XMI:'uml:PrimitiveType','href':f'http://www.omg.org/spec/UML/20110701/PrimitiveTypes.xmi#{t}'})
    for j,n in enumerate(ops): ET.SubElement(e,'ownedOperation',{'{%s}id'%XMI:f'{i}_o{j}','name':n})
    return e
cls('SearchUI','SearchUI',ops=['submitQuery','showResults','showError'])
cls('SearchController','SearchController',ops=['search','getOrder'])
cls('SearchService','SearchService',ops=['execute','retrieveCandidates'])
cls('QueryNormalizer','QueryNormalizer',ops=['normalize','validate'])
cls('ImageDescriptor','ImageDescriptor',ops=['extract','similarity'])
cls('Ranker','Ranker',ops=['scoreText','combine'])
cls('SearchQuery','SearchQuery',[('mode','String'),('text','String'),('imageRef','String'),('topK','Integer')])
cls('Product','Product',[('productId','String'),('title','String'),('price','Real'),('availability','String')])
cls('SearchResult','SearchResult',[('textScore','Real'),('imageScore','Real'),('finalScore','Real'),('rank','Integer')])
cls('Customer','Customer',[('customerId','String'),('email','String')])
cls('Order','Order',[('orderId','String'),('status','String'),('total','Real')])
cls('ProductRepository','ProductRepository',ops=['findEligible','findById'],interface=True)
cls('OrderRepository','OrderRepository',ops=['findOwned','findLatestOwned'],interface=True)
cls('PostgresProductRepository','PostgresProductRepository',ops=['findEligible','findById'])
def assoc(i,name,a,b,am='1',bm='*'):
    e=ET.SubElement(model,'packagedElement',{'{%s}type'%XMI:'uml:Association','{%s}id'%XMI:i,'name':name,'memberEnd':f'{i}_left {i}_right'})
    for side,typ,mult in [('left',a,am),('right',b,bm)]:
        end=ET.SubElement(e,'ownedEnd',{'{%s}id'%XMI:f'{i}_{side}','type':typ,'association':i})
        ET.SubElement(end,'lowerValue',{'{%s}type'%XMI:'uml:LiteralInteger','{%s}id'%XMI:f'{i}_{side}_lo','value':'0' if mult.startswith('0') or mult=='*' else '1'})
        ET.SubElement(end,'upperValue',{'{%s}type'%XMI:'uml:LiteralUnlimitedNatural','{%s}id'%XMI:f'{i}_{side}_hi','value':'*' if '*' in mult else '1'})
assoc('a_query_result','queryResults','SearchQuery','SearchResult','1','0..*')
assoc('a_product_result','productResults','Product','SearchResult','1','0..*')
assoc('a_customer_order','customerOrders','Customer','Order','1','0..*')
ET.ElementTree(root).write(VP/'multimodal_search_uml21.xmi',encoding='utf-8',xml_declaration=True)

(VP/'multimodal_search_postgresql.sql').write_text('''-- PostgreSQL design schema; import with Visual Paradigm Tools > DB > Reverse DDL.
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
''',encoding='utf-8')

(VP/'README.txt').write_text('''Visual Paradigm import package for Chapter 4

1. UML classes: Project > Import > XMI...; select multimodal_search_uml21.xmi. This is UML 2.1 model data. Create or auto-layout class diagrams after import if your VP version does not reconstruct diagram coordinates.
2. ERD: Tools > DB > Reverse DDL...; select multimodal_search_postgresql.sql, choose PostgreSQL and UTF-8, and enable Generate ERD.
3. The PNG files in ../figures show the intended layout and can be used for comparison. They are report figures, not editable VP diagrams.
4. Use a new VP project for the first import because importing XMI into an existing project can merge or overwrite matching model elements.
5. SQL is a design schema for the full commerce flow. The supplied prototype implements only search and customer-scoped order lookup.

Official VP guidance:
https://www.visual-paradigm.com/support/documents/vpuserguide/124/221/6864_importingxmi.html
https://circle.visual-paradigm.com/docs/database-design-engineering/database-management-guide/how-to-reverse-engineer-erd-from-ddl/
''',encoding='utf-8')
print(TARGET)
