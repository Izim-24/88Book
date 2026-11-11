import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const id = (value) => value.replace(/[^A-Za-z0-9_]/g, "_");
const classes = {
  User: { attributes: ["id:int", "email:string", "password:string", "full_name:string", "role:string", "created_at:date"], operations: [] },
  Book: { attributes: ["id:int", "title:string", "author:string", "description:string", "price:real", "category:string", "isbn:string", "quantity:int", "image_url:string", "admin_id:int", "rating:real"], operations: [] },
  CartItem: { attributes: ["id:int", "user_id:int", "book_id:int", "quantity:int"], operations: [] },
  Order: { attributes: ["id:int", "user_id:int", "total_amount:real", "status:string", "shipping_address:string", "payment_method:string", "created_at:date"], operations: [] },
  OrderItem: { attributes: ["id:int", "order_id:int", "book_id:int", "admin_id:int", "quantity:int", "price:real"], operations: [] },
  UserAddress: { attributes: ["id:int", "user_id:int", "name:string", "street:string", "city:string", "state:string", "zip_code:string", "country:string"], operations: [] },
  Wishlist: { attributes: ["id:int", "user_id:int", "book_id:int"], operations: [] },
  Recommendation: { attributes: ["id:int", "book_id:int", "sort_order:int"], operations: [] },
  BookSearchHistory: { attributes: ["id:int", "user_id:int", "query:string", "created_at:date"], operations: [] },
  VoiceSearchQuery: { attributes: ["id:int", "user_id:int", "recognized_text:string", "lang:string", "created_at:date"], operations: [] },
  AuthController: { attributes: [], operations: ["registerUser", "loginUser", "getCurrentUser", "createAdminAccount"] },
  BookController: { attributes: [], operations: ["getAllBooks", "getBookById", "createBook", "updateBook", "deleteBook"] },
  CartController: { attributes: [], operations: ["getCart", "addToCart", "updateCartItem", "removeFromCart", "clearCart"] },
  OrderController: { attributes: [], operations: ["createOrder", "getUserOrders", "getOrderDetails", "cancelOrder", "updateOrderStatus"] },
  UserController: { attributes: [], operations: ["getUserProfile", "updateUserProfile", "getUserAddresses", "addAddress", "getUserWishlist"] },
  SearchController: { attributes: [], operations: ["searchBooksByImage", "searchBooksByVoice", "recordSearch"] },
  AdminController: { attributes: [], operations: ["getAdminStats", "getAdminUsers", "getAdminOrders", "updateOrderStatus"] },
};

const relations = [
  ["User", "Book", "administers", "1", "0..*"],
  ["User", "CartItem", "owns", "1", "0..*"],
  ["Book", "CartItem", "selected in", "1", "0..*"],
  ["User", "Order", "places", "1", "0..*"],
  ["Order", "OrderItem", "contains", "1", "1..*"],
  ["Book", "OrderItem", "ordered as", "1", "0..*"],
  ["User", "UserAddress", "saves", "1", "0..*"],
  ["User", "Wishlist", "saves", "1", "0..*"],
  ["Book", "Wishlist", "wishlisted as", "1", "0..*"],
  ["Book", "Recommendation", "featured as", "1", "0..1"],
  ["User", "BookSearchHistory", "records", "1", "0..*"],
  ["User", "VoiceSearchQuery", "records", "0..1", "0..*"],
];

const actorUseCases = {
  Guest: ["Browse catalog", "Search by image", "Search by voice", "Register and sign in"],
  Buyer: ["Manage cart and wishlist", "Place COD order", "View and cancel order", "Manage profile and addresses"],
  Administrator: ["Manage books", "Manage users", "Manage recommendations", "Update order status"],
};

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<xmi:XMI xmi:version="2.5.1" xmlns:xmi="http://www.omg.org/spec/XMI/20131001" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML">',
  '  <uml:Model xmi:id="model_88book_current" name="88BookCurrentSystem">',
  '    <packagedElement xmi:type="uml:Package" xmi:id="pkg_types" name="Primitive Types">',
  ...["int", "string", "real", "date"].map((name) => `      <packagedElement xmi:type="uml:PrimitiveType" xmi:id="type_${name}" name="${name}"/>`),
  '    </packagedElement>',
  '    <packagedElement xmi:type="uml:Package" xmi:id="pkg_domain" name="SQL Server Entities">',
];

for (const [name, spec] of Object.entries(classes)) {
  if (name.endsWith("Controller")) continue;
  lines.push(`      <packagedElement xmi:type="uml:Class" xmi:id="class_${name}" name="${name}">`);
  for (const attribute of spec.attributes) {
    const [field, type] = attribute.split(":");
    lines.push(`        <ownedAttribute xmi:id="attr_${name}_${field}" name="${field}" type="type_${type}"/>`);
  }
  lines.push("      </packagedElement>");
}

for (const [left, right, label, leftMany, rightMany] of relations) {
  const relationId = `association_${left}_${right}`;
  const multiplicity = (value, prefix) => {
    const [lower, upper] = value.includes("..") ? value.split("..") : [value, value];
    return `<lowerValue xmi:type="uml:LiteralInteger" xmi:id="${prefix}_lower" value="${lower}"/><upperValue xmi:type="uml:LiteralUnlimitedNatural" xmi:id="${prefix}_upper" value="${upper === "*" ? "-1" : upper}"/>`;
  };
  lines.push(`      <packagedElement xmi:type="uml:Association" xmi:id="${relationId}" name="${escape(label)}" memberEnd="${relationId}_a ${relationId}_b">`);
  lines.push(`        <ownedEnd xmi:type="uml:Property" xmi:id="${relationId}_a" type="class_${left}">${multiplicity(leftMany, `${relationId}_a`)}</ownedEnd>`);
  lines.push(`        <ownedEnd xmi:type="uml:Property" xmi:id="${relationId}_b" type="class_${right}">${multiplicity(rightMany, `${relationId}_b`)}</ownedEnd>`);
  lines.push("      </packagedElement>");
}
lines.push("    </packagedElement>");

lines.push('    <packagedElement xmi:type="uml:Package" xmi:id="pkg_api" name="Express Controllers">');
for (const [name, spec] of Object.entries(classes)) {
  if (!name.endsWith("Controller")) continue;
  lines.push(`      <packagedElement xmi:type="uml:Class" xmi:id="class_${name}" name="${name}">`);
  for (const operation of spec.operations) {
    lines.push(`        <ownedOperation xmi:id="operation_${name}_${operation}" name="${operation}"/>`);
  }
  lines.push("      </packagedElement>");
}
lines.push("    </packagedElement>");

lines.push('    <packagedElement xmi:type="uml:Package" xmi:id="pkg_usecases" name="Current Use Cases">');
for (const [actor, useCases] of Object.entries(actorUseCases)) {
  lines.push(`      <packagedElement xmi:type="uml:Actor" xmi:id="actor_${actor}" name="${actor}"/>`);
  for (const useCase of useCases) {
    const useCaseId = `usecase_${id(useCase)}`;
    lines.push(`      <packagedElement xmi:type="uml:UseCase" xmi:id="${useCaseId}" name="${escape(useCase)}"/>`);
    const associationId = `association_${actor}_${id(useCase)}`;
    lines.push(`      <packagedElement xmi:type="uml:Association" xmi:id="${associationId}" memberEnd="${associationId}_a ${associationId}_b">`);
    lines.push(`        <ownedEnd xmi:type="uml:Property" xmi:id="${associationId}_a" type="actor_${actor}"/>`);
    lines.push(`        <ownedEnd xmi:type="uml:Property" xmi:id="${associationId}_b" type="${useCaseId}"/>`);
    lines.push("      </packagedElement>");
  }
}
lines.push("    </packagedElement>", "  </uml:Model>", "</xmi:XMI>");

writeFileSync(fileURLToPath(new URL("./88book-current-system.xmi", import.meta.url)), `${lines.join("\n")}\n`, "utf8");
