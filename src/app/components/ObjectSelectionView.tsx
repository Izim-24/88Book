import { useRef, useState, type PointerEvent } from "react";

// ObjectSelectionView (component diagram): the customer marks the target object
// on the uploaded photo ("Mark the target object" in the image search activity).
export interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  src: string;
  selection: Selection | null;
  onChange: (selection: Selection | null) => void;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const MIN_SIZE = 0.05;

export function ObjectSelectionView({ src, selection, onChange }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Selection | null>(null);

  const point = (event: PointerEvent) => {
    const box = frame.current!.getBoundingClientRect();
    return { x: clamp((event.clientX - box.left) / box.width), y: clamp((event.clientY - box.top) / box.height) };
  };

  const rectangle = (a: { x: number; y: number }, b: { x: number; y: number }): Selection => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const origin = point(event);
    setStart(origin);
    setDraft({ ...origin, width: 0, height: 0 });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (start) setDraft(rectangle(start, point(event)));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!start) return;
    const result = rectangle(start, point(event));
    setStart(null);
    setDraft(null);
    // A click without dragging clears the mark (search the whole photo).
    onChange(result.width >= MIN_SIZE && result.height >= MIN_SIZE ? result : null);
  };

  const shown = draft || selection;

  return (
    <div
      ref={frame}
      className="relative inline-block max-w-full select-none touch-none cursor-crosshair rounded-md overflow-hidden bg-secondary"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="application"
      aria-label="Drag to mark the book on the photo"
    >
      <img src={src} alt="Uploaded photo" draggable={false} className="block max-h-80 max-w-full" />
      {shown && shown.width > 0 && (
        <div
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
          style={{
            left: `${shown.x * 100}%`,
            top: `${shown.y * 100}%`,
            width: `${shown.width * 100}%`,
            height: `${shown.height * 100}%`,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
          }}
        />
      )}
    </div>
  );
}
