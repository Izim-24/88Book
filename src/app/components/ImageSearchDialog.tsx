import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Search, X } from "lucide-react";
import { booksAPI } from "../../api/client";
import { BookCard, type Book } from "./BookCard";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;

interface ImageSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onAddToCart: (book: Book) => void;
  onViewDetails: (book: Book) => void;
  onToggleWishlist: (book: Book) => void;
  wishlist: Book[];
}

export function ImageSearchDialog({ open, onClose, onAddToCart, onViewDetails, onToggleWishlist, wishlist }: ImageSearchDialogProps) {
  const libraryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchingText, setMatchingText] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [isbn, setIsbn] = useState<string | null>(null);
  const [results, setResults] = useState<Book[]>([]);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const selectFile = (selected?: File) => {
    if (!selected) return;
    setError("");
    setSearched(false);
    setResults([]);
    setRecognizedText("");
    setIsbn(null);
    if (!allowedTypes.has(selected.type)) { setFile(null); return setError("Choose a JPEG, PNG or WebP image."); }
    if (selected.size > maxBytes) { setFile(null); return setError("Image must be 5 MB or smaller."); }
    setFile(selected);
  };

  const searchImage = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setSearched(false);
    const response = await booksAPI.searchByImage(file);
    setLoading(false);
    if (!response.success) return setError(response.message || "Could not recognize this image.");
    setRecognizedText(response.recognizedText || "");
    setIsbn(response.isbn || null);
    setResults((response.results || []).map((book: any) => ({
      ...book,
      id: String(book.id),
      price: Number(book.price),
      rating: Number(book.rating) || 0,
      coverImage: book.image_url || "",
    })));
    setSearched(true);
  };

  const matchEditedText = async () => {
    const text = recognizedText.trim();
    if (!text || matchingText) return;
    setMatchingText(true);
    setError("");
    const response = await booksAPI.searchByCoverText(text);
    setMatchingText(false);
    if (!response.success) return setError(response.message || "Could not search the cover text.");
    setIsbn(response.isbn || null);
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
      <div role="dialog" aria-modal="true" aria-labelledby="image-search-title" className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-5 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="image-search-title" className="text-2xl font-bold">Search books by cover</h2>
            <p className="text-sm text-muted-foreground mt-1">Upload a clear photo with the title, author or ISBN visible.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close image search" className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => libraryInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 hover:bg-secondary"><ImagePlus className="w-4 h-4" /> Choose image</button>
          <button type="button" onClick={() => cameraInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 hover:bg-secondary"><Camera className="w-4 h-4" /> Take photo</button>
          <input ref={libraryInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
          <input ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
        </div>

        {file && <div className="mt-5 flex flex-col sm:flex-row gap-4 items-start rounded-xl border border-border p-3">
          {preview && <img src={preview} alt="Selected book cover" className="h-36 w-28 rounded-md object-contain bg-secondary" />}
          <div className="min-w-0 flex-1">
            <p className="font-medium break-all">{file.name}</p>
            <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · JPEG, PNG or WebP · maximum 5 MB</p>
            <button type="button" disabled={loading} onClick={searchImage} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 disabled:opacity-50"><Search className="w-4 h-4" /> {loading ? "Reading cover..." : "Find books"}</button>
          </div>
        </div>}

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 text-red-700 p-3">{error}</p>}
        {searched && <div className="mt-6 space-y-4">
          {isbn && <p className="text-sm">Detected ISBN: <strong>{isbn}</strong></p>}
          <div>
            <label htmlFor="recognized-cover-text" className="block text-sm font-medium mb-1">Text read from the cover</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input id="recognized-cover-text" value={recognizedText} onChange={(event) => setRecognizedText(event.target.value)} placeholder="Edit the title or author if recognition was wrong" className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2" />
              <button type="button" disabled={!recognizedText.trim() || matchingText} onClick={matchEditedText} className="rounded-lg border border-border px-4 py-2 disabled:opacity-50">{matchingText ? "Đang tìm..." : "Tìm lại từ chữ"}</button>
            </div>
          </div>
          <h3 className="text-lg font-semibold">{results.length ? `${results.length} matching books` : "No matching books in our catalog"}</h3>
          {!results.length && <p className="text-sm text-muted-foreground">Try a clearer photo, or edit the recognized text above.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((book) => <div key={book.id}>
              <p className="mb-2 text-xs text-primary">Matched by {(book as any).matchReason} · {Math.round(((book as any).score || 0) * 100)}%</p>
              <BookCard book={book} onAddToCart={onAddToCart} onViewDetails={(item) => { onClose(); onViewDetails(item); }} onToggleWishlist={onToggleWishlist} isWishlisted={wishlist.some((item) => item.id === book.id)} />
            </div>)}
          </div>
        </div>}
      </div>
    </div>
  );
}
