import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Search, X } from "lucide-react";
import { booksAPI } from "../../api/client";
import { BookCard, type Book } from "./BookCard";
import { prepareSpeechRecognition } from "../utils/speechRecognition";

interface VoiceSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSearchText: (text: string) => void;
  onAddToCart: (book: Book) => void;
  onViewDetails: (book: Book) => void;
  onToggleWishlist: (book: Book) => void;
  wishlist: Book[];
}

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

export function VoiceSearchDialog({ open, onClose, onSearchText, onAddToCart, onViewDetails, onToggleWishlist, wishlist }: VoiceSearchDialogProps) {
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [recognitionMode, setRecognitionMode] = useState<"local" | "remote" | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Book[]>([]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const text = last?.[0]?.transcript || "";
      setRecognizedText(text);
      if (last?.isFinal) setListening(false);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error, event);
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access denied. Please allow microphone permission and try again.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please speak again.");
      } else if (event.error === "network") {
        setError("Dịch vụ nhận diện giọng nói của trình duyệt không kết nối được. Hãy thử Chrome/Edge có hỗ trợ gói tiếng Việt trên thiết bị, hoặc nhập từ khóa bên trên.");
      } else if (event.error === "language-not-supported") {
        setError("Trình duyệt chưa có gói nhận diện tiếng Việt trên thiết bị. Hãy nhập từ khóa bên trên hoặc thử trình duyệt khác.");
      } else if (event.error === "audio-capture") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (event.error === "aborted") {
        // user stopped manually — not an error
        return;
      } else {
        setError(`Speech recognition error (${event.error}). Please try again.`);
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch { /* already stopped */ }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      setListening(false);
    }
  }, [open]);

  const toggleListening = async () => {
    setError("");
    setSearched(false);
    setResults([]);
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    setRecognizedText("");
    setPreparing(true);
    try {
      const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = recognitionRef.current;
      if (!recognition || !Recognition) throw new Error("Speech recognition unavailable");
      const mode = await prepareSpeechRecognition(Recognition, recognition, "vi-VN");
      if (!openRef.current) return;
      setRecognitionMode(mode);
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone. Please try again.");
    } finally {
      setPreparing(false);
    }
  };

  const searchByVoice = async () => {
    const text = recognizedText.trim();
    if (!text || loading) return;
    setLoading(true);
    setError("");
    const response = await booksAPI.searchByVoice(text);
    setLoading(false);
    if (!response.success) return setError(response.message || "Voice search failed.");
    setResults((response.results || []).map((book: any) => ({
      ...book,
      id: String(book.id),
      price: Number(book.price),
      rating: Number(book.rating) || 0,
      coverImage: book.image_url || "",
    })));
    setSearched(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="voice-search-title" className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-5 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="voice-search-title" className="text-2xl font-bold">Search books by voice</h2>
            <p className="text-sm text-muted-foreground mt-1">Nói tên sách, tác giả hoặc thể loại bạn muốn tìm.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close voice search" className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        {!supported && (
          <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-3">
            Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.
          </p>
        )}

        <div className="flex flex-col items-center gap-4 rounded-xl border border-border p-6">
            <div className="w-full">
              <label htmlFor="voice-fallback-text" className="block text-sm font-medium mb-1">Hoặc nhập tay để tìm nhanh</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="voice-fallback-text"
                  value={recognizedText}
                  onChange={(event) => setRecognizedText(event.target.value)}
                  placeholder="Nhập tên sách, tác giả..."
                  className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2"
                />
                <button
                  type="button"
                  disabled={loading || !recognizedText.trim()}
                  onClick={searchByVoice}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
                >
                  <Search className="w-4 h-4" /> {loading ? "Đang tìm..." : "Tìm sách"}
                </button>
              </div>
            </div>

            {supported && <div className="flex items-center gap-3 w-full">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">hoặc dùng giọng nói</span>
              <div className="flex-1 border-t border-border" />
            </div>}
            {supported && <button
              type="button"
              onClick={toggleListening}
              disabled={preparing}
              aria-label={listening ? "Stop recording" : "Start recording"}
              className={`rounded-full p-6 transition-all ${listening ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground hover:opacity-90"}`}
            >
              {listening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>}
            {supported && <p className="text-sm text-muted-foreground">
              {preparing ? "Đang kiểm tra nhận diện tiếng Việt trên thiết bị..." : listening ? `Đang nghe${recognitionMode === "local" ? " trên thiết bị" : ""}... Nói xong bấm lại để dừng` : "Bấm micro để bắt đầu nói"}
            </p>}
          </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 text-red-700 p-3">{error}</p>}

        {searched && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">{results.length ? `${results.length} matching books` : "No matching books in our catalog"}</h3>
            {!results.length && (
              <div className="text-sm text-muted-foreground">
                <p>Không tìm thấy sách phù hợp. Bạn có thể:</p>
                <button type="button" onClick={() => { onSearchText(recognizedText.trim()); onClose(); }} className="mt-2 rounded-lg border border-border px-4 py-2 hover:bg-secondary">
                  Tìm trong toàn bộ danh mục với từ khóa này
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((book) => (
                <BookCard key={book.id} book={book} onAddToCart={onAddToCart} onViewDetails={(item) => { onClose(); onViewDetails(item); }} onToggleWishlist={onToggleWishlist} isWishlisted={wishlist.some((item) => item.id === book.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
