import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { ordersAPI } from "../../api/client";
import { DeliveryMap } from "./DeliveryMap";

interface Props { orderId: string | null; onClose: () => void }

export function DeliveryTrackingDialog({ orderId, onClose }: Props) {
  const [tracking, setTracking] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    setTracking(null);
    setError("");
    const refresh = async () => {
      const response = await ordersAPI.getTracking(orderId);
      if (!active) return;
      if (response.success) setTracking(response.tracking);
      else setError(response.message || "Could not load tracking.");
    };
    refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [orderId, onClose]);

  if (!orderId) return null;
  const steps = ["accepted", "shipped", "delivered"];
  const currentStep = steps.indexOf(tracking?.status);

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-label="Delivery tracking" className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-5 sm:p-7 shadow-2xl">
      <div className="flex justify-between gap-4 items-start mb-4">
        <div><h2 className="text-2xl font-bold">Delivery tracking {orderId === "demo" ? "· Demo" : `· Order #${orderId}`}</h2><p className="text-sm text-muted-foreground mt-1">The courier and route are simulated for presentation.</p></div>
        <button type="button" onClick={onClose} aria-label="Close tracking" className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-3">{error}</p>}
      {!tracking && !error && <p>Loading tracking...</p>}
      {tracking && <div className="space-y-4">
        <p className="rounded-lg bg-amber-50 text-amber-900 p-3 text-sm">{tracking.notice}</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {steps.map((step, index) => <div key={step} className={`rounded-lg px-3 py-2 text-center ${tracking.status !== "cancelled" && index <= currentStep ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{step === "accepted" ? "Confirmed" : step === "shipped" ? "On the way" : "Delivered"}</div>)}
        </div>
        {tracking.status === "cancelled" && <p className="font-medium text-red-600">This order was cancelled.</p>}
        {tracking.status === "shipped" && <p className="font-medium">Simulated progress: {tracking.progress}% · ETA about {tracking.etaMinutes} min</p>}
        <DeliveryMap route={tracking.route} position={tracking.position} />
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <p className="flex gap-2"><MapPin className="w-4 h-4 shrink-0 text-blue-600" />{tracking.originLabel}</p>
          <p className="flex gap-2"><MapPin className="w-4 h-4 shrink-0 text-green-600" />{tracking.destinationLabel}</p>
        </div>
        <p className="text-xs text-muted-foreground">Last updated: {new Date(tracking.updatedAt).toLocaleTimeString()}</p>
      </div>}
    </div>
  </div>;
}
