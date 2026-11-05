import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { chatAPI } from "../../api/client";
import type { Book } from "./BookCard";
import { formatVND } from "../utils/format";

interface Props {
  books: Book[];
  personalized: Book[];
  onViewDetails: (book: Book) => void;
  onAddToCart: (book: Book) => void;
}

interface ChatMessage {
  role: "guide" | "reader";
  text: string;
  books?: Book[];
  intro?: boolean;
  error?: boolean;
}

const intro: ChatMessage = {
  role: "guide",
  text: "Chào bạn! Bạn đang tìm sách về chủ đề gì? Mình có thể trò chuyện và gợi ý sách đang có trong cửa hàng.",
  intro: true,
};

export function BookGuideChat({ books, personalized, onViewDetails, onAddToCart }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([intro]);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    chatAPI.getStatus().then((result: any) => setConfigured(result.success ? Boolean(result.configured) : null));
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, open]);

  const send = async (value: string) => {
    const text = value.trim();
    if (!text || busy) return;
    const history = messages.filter((item) => !item.intro && !item.error).slice(-8).map((item) => ({
      role: item.role === "reader" ? "user" : "assistant",
      content: item.text,
    }));
    setMessages((current) => [...current, { role: "reader", text }]);
    setInput("");
    setBusy(true);
    try {
      const result: any = await chatAPI.send(text, history, personalized.map((book) => Number(book.id)));
      if (!result.success) throw new Error(result.message || "Không thể kết nối Book guide.");
      const recommended: Book[] = (result.books || []).map((item: any) =>
        books.find((book) => String(book.id) === String(item.id)) || {
          ...item,
          id: String(item.id),
          price: Number(item.price),
          rating: Number(item.rating) || 0,
          coverImage: item.image_url || "",
        }
      );
      setMessages((current) => [...current, { role: "guide", text: result.reply, books: recommended }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "guide",
        text: error instanceof Error ? error.message : "Book guide tạm thời không khả dụng.",
        error: true,
      }]);
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed bottom-4 right-4 z-[90]">
    {open && <div role="dialog" aria-label="Book guide chat" className="mb-3 w-[min(380px,calc(100vw-2rem))] h-[min(560px,75vh)] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary text-primary-foreground">
        <div><p className="font-semibold">Book guide</p><p className="text-xs opacity-85">Trợ lý AI chọn sách</p></div>
        <button type="button" aria-label="Close book guide" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
      </div>
      {configured === false && <p className="px-4 py-2 text-xs bg-amber-50 text-amber-900">AI chưa được cấu hình trên server. Vui lòng liên hệ quản trị viên.</p>}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.map((message, index) => <div key={index} className={message.role === "reader" ? "ml-8" : "mr-6"}>
          <p className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${message.role === "reader" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{message.text}</p>
          {message.books?.map((book) => <div key={book.id} className="mt-2 flex gap-3 rounded-lg border border-border p-2">
            {book.coverImage && <img src={book.coverImage} alt="" className="h-16 w-12 object-cover rounded" />}
            <div className="min-w-0"><p className="text-sm font-semibold truncate">{book.title}</p><p className="text-xs text-muted-foreground">{book.author} · {formatVND(book.price)}</p>
              <div className="flex gap-3 mt-1 text-xs text-primary"><button type="button" onClick={() => onViewDetails(book)}>Chi tiết</button><button type="button" onClick={() => onAddToCart(book)}>Thêm vào giỏ</button></div>
            </div>
          </div>)}
        </div>)}
        {busy && <p className="mr-6 rounded-xl bg-secondary px-3 py-2 text-sm">Đang trả lời…</p>}
        <div ref={endRef} />
      </div>
      {messages.length === 1 && <div className="flex flex-wrap gap-1 px-4 pb-2">{["Gợi ý sách trinh thám", "Sách cho người mới đọc", "Sách dưới 100.000 ₫"].map((sample) => <button key={sample} type="button" disabled={busy} onClick={() => send(sample)} className="text-xs rounded-full border border-border px-2 py-1 hover:bg-secondary">{sample}</button>)}</div>}
      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex gap-2 border-t border-border p-3">
        <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} aria-label="Nhắn cho Book guide" placeholder="Hỏi về sách hoặc mô tả sở thích..." className="flex-1 min-w-0 rounded-lg border border-border px-3 py-2 text-sm bg-background" />
        <button type="submit" disabled={!input.trim() || busy} aria-label="Gửi tin nhắn" className="rounded-lg bg-primary text-primary-foreground px-3 disabled:opacity-50"><Send className="w-4 h-4" /></button>
      </form>
    </div>}
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close book guide" : "Open book guide"} className="ml-auto flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-xl"><MessageCircle className="w-5 h-5" /> {open ? "Đóng" : "Book guide"}</button>
  </div>;
}
