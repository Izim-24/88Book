from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT=Path(r'D:\STUDY\88Book\deliverables\redrawn_diagrams')
OUT.mkdir(parents=True,exist_ok=True)
FONT=r'C:\Windows\Fonts\arial.ttf'; BOLD=r'C:\Windows\Fonts\arialbd.ttf'
def ft(n,b=False): return ImageFont.truetype(BOLD if b else FONT,n)
INK='#111827'; BLUE='#cbeefa'; BLUE_DARK='#8fd1eb'; LINE='#1f2937'; MUTED='#52616b'

class Diagram:
    def __init__(self,w,h):
        self.im=Image.new('RGB',(w,h),'white'); self.d=ImageDraw.Draw(self.im); self.w=w; self.h=h
    def txt(self,xy,s,size=26,bold=False,fill=INK,anchor=None):
        self.d.text(xy,s,font=ft(size,bold),fill=fill,anchor=anchor)
    def label(self,x,y,s,size=24):
        b=self.d.textbbox((x,y),s,font=ft(size,True),anchor='mm')
        self.d.rectangle((b[0]-8,b[1]-4,b[2]+8,b[3]+4),fill='white')
        self.txt((x,y),s,size,True,anchor='mm')
    def box(self,x,y,w,h,title,attrs=(),methods=(),kind=None):
        self.d.rectangle((x,y,x+w,y+h),fill='white',outline=INK,width=3)
        self.d.rectangle((x,y,x+w,y+75),fill=BLUE_DARK,outline=INK,width=3)
        if kind: self.txt((x+w//2,y+6),f'<<{kind}>>',18,anchor='mt')
        self.txt((x+w//2,y+48 if kind else y+37),title,29,True,anchor='mm')
        yy=y+90
        for line in attrs:
            self.txt((x+16,yy),line,25); yy+=33
        if methods:
            sep=max(yy+5,y+h-33*len(methods)-21)
            self.d.line((x,sep,x+w,sep),fill=INK,width=2)
            yy=sep+9
            for line in methods:
                self.txt((x+16,yy),line,24); yy+=32
        return x,y,w,h
    def path(self,points,label=None,label_at=None,dashed=False,arrow=False):
        for a,b in zip(points,points[1:]):
            if dashed:
                dx=b[0]-a[0]; dy=b[1]-a[1]; dist=abs(dx)+abs(dy)
                if dist==0: continue
                for t in range(0,dist,20):
                    u=min(t+11,dist); p=(a[0]+dx*t/dist,a[1]+dy*t/dist); q=(a[0]+dx*u/dist,a[1]+dy*u/dist)
                    self.d.line((p,q),fill=LINE,width=3)
            else: self.d.line((a,b),fill=LINE,width=3)
        if arrow:
            a,b=points[-2],points[-1]
            if b[0]>a[0]: tri=[b,(b[0]-18,b[1]-9),(b[0]-18,b[1]+9)]
            elif b[0]<a[0]: tri=[b,(b[0]+18,b[1]-9),(b[0]+18,b[1]+9)]
            elif b[1]>a[1]: tri=[b,(b[0]-9,b[1]-18),(b[0]+9,b[1]-18)]
            else: tri=[b,(b[0]-9,b[1]+18),(b[0]+9,b[1]+18)]
            self.d.polygon(tri,fill=LINE)
        if label and label_at: self.label(*label_at,label)
    def group(self,x,y,w,h,name):
        self.d.rounded_rectangle((x,y,x+w,y+h),radius=12,outline='#7f9fb0',width=3)
        bb=self.d.textbbox((0,0),name,font=ft(27,True))
        self.d.rectangle((x+18,y-20,x+38+bb[2],y+23),fill='white')
        self.txt((x+26,y-15),name,27,True)
    def save(self,name): self.im.save(OUT/name)

# 11: analysis class relationships, separated into product discovery and order ownership.
d=Diagram(1800,1450)
d.group(45,65,1710,920,'PRODUCT DISCOVERY')
d.box(95,145,480,285,'SearchUI',['- queryText: String','- imageRef: String?','- filters: FilterSet'],['+ submitQuery()','+ showResults()'],'boundary')
d.box(660,145,480,285,'SearchController',['- session: Session','- request: SearchRequest'],['+ validate()','+ search()'],'control')
d.box(1225,145,480,285,'SearchQuery',['- mode: SearchMode','- text: String','- topK: int','- filters: FilterSet'],[],'entity')
d.box(95,630,480,285,'Product',['- productId: String','- title: String','- price: Decimal','- availability: State'],[],'entity')
d.box(660,630,480,285,'SearchService',['- products: ProductRepo','- ranker: Ranker'],['+ retrieve()','+ rank()'],'control')
d.box(1225,630,480,285,'SearchResult',['- productId: String','- textScore: double','- imageScore: double','- finalScore: double'],[],'entity')
d.path([(575,295),(660,295)],arrow=True)
d.path([(1140,295),(1225,295)],arrow=True)
d.path([(900,430),(900,630)],'delegates',(986,530),arrow=True)
d.path([(660,775),(575,775)],arrow=True)
d.path([(1140,775),(1225,775)],arrow=True)
d.group(300,1060,1200,310,'ORDER OWNERSHIP')
d.box(365,1115,480,205,'Customer',['- customerId: String','- email: String'],[],'entity')
d.box(955,1115,480,205,'Order',['- orderId: String','- status: OrderState','- total: Decimal'],[],'entity')
d.path([(845,1215),(955,1215)],'owns',(900,1182),arrow=True)
d.label(900,1260,'1 : 0..*',20)
d.save('figure11_analysis_classes.png')

# 12: six physical tables in the importable SQL schema; every FK line has a distinct lane.
d=Diagram(1800,1300)
d.box(60,115,490,330,'CUSTOMER',['PK  customer_id: BIGINT','UQ  email: VARCHAR(255)','    status: VARCHAR(20)','    created_at: TIMESTAMP'])
d.box(655,115,490,330,'ORDER_HEADER',['PK  order_id: BIGINT','FK  customer_id: BIGINT','UQ  idempotency_key','    status: VARCHAR(30)','    total: NUMERIC(14,2)'])
d.box(1250,115,490,330,'ORDER_LINE',['PK  order_line_id: BIGINT','FK  order_id: BIGINT','FK  product_id: VARCHAR(40)','    quantity: INTEGER','    unit_price_snapshot: NUMERIC'])
d.box(60,825,490,330,'CATEGORY',['PK  category_id: BIGINT','UQ  name: VARCHAR(120)'])
d.box(655,825,490,330,'PRODUCT',['PK  product_id: VARCHAR(40)','FK  category_id: BIGINT','    title: VARCHAR(255)','    price: NUMERIC(14,2)','    availability: VARCHAR(20)'])
d.box(1250,825,490,330,'PRODUCT_IMAGE',['PK  image_id: BIGINT','FK  product_id: VARCHAR(40)','    image_uri: VARCHAR(500)','    provenance: VARCHAR(255)','    image_version: INTEGER'])
d.path([(550,280),(655,280)],'1 : 0..*',(602,246),arrow=True)
d.path([(1145,280),(1250,280)],'1 : 0..*',(1197,246),arrow=True)
d.path([(550,990),(655,990)],'1 : 0..*',(602,956),arrow=True)
d.path([(1145,990),(1250,990)],'1 : 0..*',(1197,956),arrow=True)
d.path([(900,825),(900,625),(1495,625),(1495,445)],'product 1 : lines 0..*',(1200,590),arrow=True)
d.txt((70,1200),'PK = primary key     FK = foreign key     UQ = unique constraint',26,fill=MUTED)
d.save('figure12_data_model.png')

# 13: design classes expose types, operations and a separate order-query collaboration.
d=Diagram(1800,1600)
d.group(45,65,1710,1030,'SEARCH COLLABORATION')
d.box(65,130,500,300,'SearchController',['- service: SearchService'],['+ search(req): ResultPage','+ getOrder(id): OrderDTO'])
d.box(650,130,500,300,'SearchService',['- repo: ProductRepository','- ranker: Ranker'],['+ execute(q): ResultPage','- rank(items): List<Result>'])
d.box(1235,130,500,300,'QueryNormalizer',['- taxonomy: Set<String>'],['+ normalize(text): String','+ validate(q): SearchQuery'])
d.box(65,680,500,300,'ProductRepository',['+ findEligible(filters): List','+ findById(id): Product'],[],'interface')
d.box(650,680,500,300,'Ranker',['- textWeight: double = 0.5','- imageWeight: double = 0.5'],['+ scoreText(q,p): double','+ combine(t,i): double'])
d.box(1235,680,500,300,'ImageDescriptor',['- version: String'],['+ extract(bytes): Vector','+ similarity(a,b): double'])
d.path([(565,280),(650,280)],'calls',(607,248),arrow=True)
d.path([(1150,280),(1235,280)],'uses',(1192,248),arrow=True)
d.path([(900,430),(900,680)],'scores',(974,560),arrow=True)
d.path([(650,355),(610,355),(610,830),(565,830)],'reads',(610,615),arrow=True)
d.path([(1150,355),(1195,355),(1195,830),(1235,830)],'extracts',(1195,615),arrow=True)
d.group(45,1195,1710,335,'ORDER LOOKUP AND ADAPTERS')
d.box(85,1255,520,220,'PostgresProductRepository',['- dataSource: DataSource'],['+ findEligible(filters): List'])
d.box(655,1255,500,220,'OrderQueryService',['- orders: OrderRepository'],['+ findOwned(session,id): DTO'])
d.box(1235,1255,500,220,'OrderRepository',['+ findOwned(customer,id)','+ findLatestOwned(customer)'],[],'interface')
d.path([(590,1255),(590,900),(565,900)],'realizes',(660,1080),dashed=True,arrow=True)
d.path([(1155,1370),(1235,1370)],'uses',(1195,1338),arrow=True)
d.save('figure13_design_classes.png')

# 14: package lanes make dependencies and responsibility boundaries explicit.
d=Diagram(1800,1350)
rows=[
 (80,120,'PRESENTATION','SearchUI / SearchRequestDTO','OrderLookupUI / OrderDTO','Validation messages and result display'),
 (80,390,'APPLICATION','SearchController / SearchService','OrderQueryService','Coordinates use cases and authorization'),
 (80,660,'DOMAIN','SearchQuery / Product / Ranker','ProductRepository / OrderRepository','Entities, score rules and repository ports'),
 (80,930,'INFRASTRUCTURE','PostgresProductRepository','PostgresOrderRepository','SQL, image adapter and logging')]
for x,y,name,left,middle,right in rows:
    d.d.rounded_rectangle((x,y,x+1640,y+190),radius=10,fill='white',outline=INK,width=3)
    d.d.rectangle((x,y,x+1640,y+48),fill=BLUE_DARK,outline=INK,width=3)
    d.txt((x+18,y+10),name,30,True)
    for bx,bw,txt in [(x+25,500,left),(x+555,500,middle),(x+1085,520,right)]:
        d.d.rounded_rectangle((bx,y+72,bx+bw,y+155),radius=7,fill=BLUE,outline='#64889a',width=2)
        d.txt((bx+15,y+93),txt,25)
d.path([(330,310),(330,390)],'calls',(410,350),arrow=True)
d.path([(860,580),(860,660)],'uses ports',(965,620),arrow=True)
d.path([(1400,930),(1400,850)],'implements',(1510,890),dashed=True,arrow=True)
d.txt((88,1180),'Rule: presentation → application → domain; infrastructure implements domain ports.',28,True)
d.txt((88,1225),'Hard filters run before ranking; customer ownership is checked at repository access.',26)
d.save('figure14_layers.png')

# 6: analysis-level order data model. Distinct rows keep every association outside boxes.
d=Diagram(1800,1500)
d.box(60,100,490,320,'CUSTOMER',['PK  customer_id','    email','    display_name','    created_at'])
d.box(655,100,490,320,'CART',['PK  cart_id','FK  customer_id','    status','    updated_at'])
d.box(1250,100,490,320,'CART_ITEM',['PK  cart_item_id','FK  cart_id','FK  product_id','    quantity > 0'])
d.box(60,650,490,320,'ORDER',['PK  order_id','FK  customer_id','    status','    total','    created_at'])
d.box(655,650,490,320,'ORDER_LINE',['PK  order_line_id','FK  order_id','FK  product_id','    quantity > 0','    unit_price_snapshot'])
d.box(1250,650,490,320,'PRODUCT',['PK  product_id','    title','    category_id','    price','    availability'])
d.box(60,1180,490,250,'PAYMENT',['PK  payment_id','FK  order_id','    amount, state','    provider_ref'])
d.path([(550,260),(655,260)],'1 : 0..1',(602,225),arrow=True)
d.path([(1145,260),(1250,260)],'1 : 0..*',(1197,225),arrow=True)
d.path([(300,420),(300,650)],'1 : 0..*',(395,535),arrow=True)
d.path([(550,810),(655,810)],'1 : 0..*',(602,775),arrow=True)
d.path([(1145,810),(1250,810)],'0..* : 1',(1197,775),arrow=True)
d.path([(1500,420),(1500,650)],'0..* : 1',(1600,535),arrow=True)
d.path([(350,970),(350,1180)],'1 : 0..*',(450,1075),arrow=True)
d.txt((665,1250),'Order lines retain purchase-time price snapshots.',27,True)
d.txt((665,1295),'Payment and checkout are analyzed future scope in this prototype.',25,fill=MUTED)
d.save('figure6_order_data_model.png')

# 9: workflow with two discrete rows; each connector has its own clear corridor.
d=Diagram(1800,1060)
def flow_box(x,y,n,title,detail):
    d.d.rounded_rectangle((x,y,x+370,y+220),radius=16,fill='#eaf5fb',outline=INK,width=3)
    d.d.ellipse((x+14,y+20,x+74,y+80),fill=BLUE_DARK,outline=INK,width=2)
    d.txt((x+44,y+50),str(n),27,True,anchor='mm')
    d.txt((x+95,y+28),title,26,True)
    for j,line in enumerate(detail): d.txt((x+25,y+105+j*34),line,24)
flow_box(45,160,1,'Publish listing',['Seller submits product;','admin approves catalog.'])
flow_box(485,160,2,'Discover product',['Customer searches and','reviews product facts.'])
flow_box(925,160,3,'Review checkout',['Cart, address, price','and stock are rechecked.'])
flow_box(1365,160,4,'Open pending order',['Draft and request key','are saved durably.'])
flow_box(1365,615,5,'Record payment',['Provider result or COD','status is recorded.'])
flow_box(925,615,6,'Track delivery',['Carrier events update','shipment status.'])
flow_box(485,615,7,'Reconcile',['Finance resolves fees,','refunds and reports.'])
d.path([(415,270),(485,270)],arrow=True)
d.path([(855,270),(925,270)],arrow=True)
d.path([(1295,270),(1365,270)],arrow=True)
d.path([(1550,380),(1550,615)],arrow=True)
d.path([(1365,725),(1295,725)],arrow=True)
d.path([(925,725),(855,725)],arrow=True)
d.d.rounded_rectangle((490,925,850,995),radius=30,fill=BLUE,outline=INK,width=3)
d.txt((670,960),'END',29,True,anchor='mm')
d.path([(670,835),(670,925)],arrow=True)
d.save('figure9_workflow.png')

# 5: checkout activity with exception branches kept in dedicated side corridors.
d=Diagram(1800,1450)
for x,name in [(30,'SHOPPER'),(610,'CHECKOUT SYSTEM'),(1190,'PAYMENT PROVIDER')]:
    d.d.rectangle((x,65,x+560,1350),outline=INK,width=3)
    d.d.rectangle((x,65,x+560,125),fill=BLUE_DARK,outline=INK,width=3)
    d.txt((x+280,94),name,28,True,anchor='mm')
def action(x,y,w,label):
    d.d.rounded_rectangle((x,y,x+w,y+92),radius=13,fill=BLUE,outline=INK,width=3)
    d.txt((x+w//2,y+46),label,25,True,anchor='mm')
def decision(cx,cy,label):
    pts=[(cx,cy-75),(cx+115,cy),(cx,cy+75),(cx-115,cy)]
    d.d.polygon(pts,fill=BLUE,outline=INK,width=3)
    d.txt((cx,cy),label,24,True,anchor='mm')
action(105,170,390,'Review cart and address')
action(695,170,390,'Recheck price and stock')
decision(890,395,'Valid?')
action(105,500,390,'Resolve cart changes')
action(695,565,390,'Calculate final total')
action(105,725,390,'Select payment method')
action(695,725,390,'Create payment intent')
action(1275,725,390,'Authorize payment')
decision(1470,945,'Approved?')
action(1275,1105,390,'Offer retry or new method')
action(695,1105,390,'Persist confirmed order')
action(105,1105,390,'Show order confirmation')
d.path([(495,216),(695,216)],arrow=True)
d.path([(890,262),(890,320)],arrow=True)
d.path([(775,395),(570,395),(570,546),(495,546)],'[no]',(650,367),arrow=True)
d.path([(105,546),(75,546),(75,216),(105,216)],'edit cart',(100,410),arrow=True)
d.path([(890,470),(890,565)],'[yes]',(960,520),arrow=True)
d.path([(695,611),(555,611),(555,680),(300,680),(300,725)],arrow=True)
d.path([(495,771),(695,771)],arrow=True)
d.path([(1085,771),(1275,771)],arrow=True)
d.path([(1470,817),(1470,870)],arrow=True)
d.path([(1355,945),(1125,945),(1125,1151),(1085,1151)],'[yes]',(1195,915),arrow=True)
d.path([(1585,945),(1710,945),(1710,1151),(1665,1151)],'[no]',(1690,910),arrow=True)
d.path([(695,1151),(495,1151)],arrow=True)
d.txt((55,1385),'Decline or timeout does not confirm an order; retries reuse an idempotency key.',25,fill=MUTED)
d.save('figure5_checkout_activity.png')

print('generated',len(list(OUT.glob('figure*.png'))),'diagrams')
