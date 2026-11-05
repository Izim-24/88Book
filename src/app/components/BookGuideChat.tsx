import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { Book } from "./BookCard";
import { formatVND } from "../utils/format";

interface Props {
  books: Book[];
  personalized: Book[];
  onViewDetails: (book: Book) => void;
  onAddToCart: (book: Book) => void;
}

interface ChatMessage { role: "guide" | "reader"; text: string; books?: Book[] }

const categoryWords: Record<string, string[]> = {
  Mystery: ["trinh tham", "bi an", "detective", "mystery"],
  Romance: ["lang man", "tinh yeu", "romance"],
  Science: ["khoa hoc", "science"],
  Fantasy: ["gia tuong", "fantasy", "phieu luu"],
  Biography: ["tieu su", "biography", "nhan vat"],
  "Self-Help": ["phat trien ban than", "thoi quen", "self help", "ky nang"],
  Psychology: ["tam ly", "psychology"],
  Business: ["kinh doanh", "business", "tai chinh"],
  Fiction: ["tieu thuyet", "fiction", "van hoc"],
  Cooking: ["nau an", "am thuc", "cooking"],
  Classic: ["kinh dien", "classic"],
  Manga: ["truyen tranh", "manga"],
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9$]+/g, " ").trim();

function recommend(text: string, books: Book[], personalized: Book[]) {
  const query = normalize(text);
  const categories = Object.entries(categoryWords).filter(([, words]) => words.some((word) => query.includes(word))).map(([category]) => category);
  const budgetMatch = normalize(text).match(/(?:duoi|under|toi da|max|khong qua|<)\s*(\d[\d.,\s]*)(?:\s*(?:vnd|dong|₫|k|nghin|ngan))?/);
  const budgetDigits = budgetMatch?.[1].replace(/[^\d]/g, "") || "";
  const budget = budgetDigits ? Number(budgetDigits) * (/\d\s*(?:k|nghin|ngan)\b/.test(query) ? 1000 : 1) : null;
  const terms = query.split(" ").filter((word) => word.length > 2 && !["sach", "cuon", "muon", "thich", "cho", "toi", "hay", "book", "read", "the", "about"].includes(word));
  const preferredIds = new Set(personalized.map((book) => String(book.id)));
  const ranked = books.filter((book: any) => Number(book.quantity ?? 1) > 0)
    .filter((book) => !categories.length || categories.includes(book.category))
    .filter((book) => budget == null || Number(book.price) <= budget)
    .map((book) => {
      const details = normalize(`${book.title} ${book.author} ${book.description}`);
      const termHits = terms.filter((word) => details.includes(word)).length;
      const score = termHits * 3 + (preferredIds.has(String(book.id)) ? 2 : 0) + Number(book.rating || 0) / 10;
      return { book, score };
    })
    .filter(({ score }) => categories.length > 0 || budget != null || score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3).map(({ book }) => book);

  if (!ranked.length) return { text: "Mình chưa thấy sách phù hợp trong catalog. Bạn thử đổi thể loại hoặc tăng ngân sách nhé.", books: [] };
  const reason = categories.length ? `thể loại ${categories.join(", ")}` : budget != null ? `ngân sách dưới ${formatVND(budget)}` : "gu đọc bạn mô tả";
  return { text: `Dựa trên ${reason}, bạn có thể xem các sách còn hàng này:`, books: ranked };
}

export function BookGuideChat({ books, personalized, onViewDetails, onAddToCart }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "guide", text: "Chào bạn! Bạn thích thể loại nào, chủ đề gì và ngân sách khoảng bao nhiêu? Mình sẽ gợi ý từ sách đang có trong cửa hàng." },
  ]);

  const send = (value: string) => {
    const text = value.trim();
    if (!text) return;
    const answer = recommend(text, books, personalized);
    setMessages((current) => [...current, { role: "reader", text }, { role: "guide", ...answer }]);
    setInput("");
  };

  return <div className="fixed bottom-4 right-4 z-[90]">
    {open && <div role="dialog" aria-label="Book guide chat" className="mb-3 w-[min(380px,calc(100vw-2rem))] h-[min(560px,75vh)] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary text-primary-foreground">
        <div><p className="font-semibold">Book guide · Demo</p><p className="text-xs opacity-85">Gợi ý theo catalog và sở thích, chưa kết nối mô hình AI</p></div>
        <button type="button" aria-label="Close book guide" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.map((message, index) => <div key={index} className={message.role === "reader" ? "ml-8" : "mr-6"}>
          <p className={`rounded-xl px-3 py-2 text-sm ${message.role === "reader" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{message.text}</p>
          {message.books?.map((book) => <div key={book.id} className="mt-2 flex gap-3 rounded-lg border border-border p-2">
            <img src={book.coverImage} alt="" className="h-16 w-12 object-cover rounded" />
            <div className="min-w-0"><p className="text-sm font-semibold truncate">{book.title}</p><p className="text-xs text-muted-foreground">{book.author} · {formatVND(book.price)}</p>
              <div className="flex gap-3 mt-1 text-xs text-primary"><button type="button" onClick={() => onViewDetails(book)}>Details</button><button type="button" onClick={() => onAddToCart(book)}>Add to cart</button></div>
            </div>
          </div>)}
        </div>)}
      </div>
      {messages.length === 1 && <div className="flex flex-wrap gap-1 px-4 pb-2">{["Trinh thám", "Lãng mạn", "Khoa học", "Sách dưới 100.000 ₫"].map((sample) => <button key={sample} type="button" onClick={() => send(sample)} className="text-xs rounded-full border border-border px-2 py-1 hover:bg-secondary">{sample}</button>)}</div>}
      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex gap-2 border-t border-border p-3">
        <input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Describe your reading taste" placeholder="Thể loại, chủ đề, ngân sách..." className="flex-1 min-w-0 rounded-lg border border-border px-3 py-2 text-sm bg-background" />
        <button type="submit" disabled={!input.trim()} aria-label="Send message" className="rounded-lg bg-primary text-primary-foreground px-3 disabled:opacity-50"><Send className="w-4 h-4" /></button>
      </form>
    </div>}
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close book guide" : "Open book guide"} className="ml-auto flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-xl"><MessageCircle className="w-5 h-5" /> {open ? "Close" : "Book guide"}</button>
  </div>;
}
