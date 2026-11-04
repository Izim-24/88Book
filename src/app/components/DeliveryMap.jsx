import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export function DeliveryMap({ route, position }) {
  const container = useRef(null);
  const map = useRef(null);
  const courier = useRef(null);
  const routeKey = route.map((point) => point.join(",")).join(";");

  useEffect(() => {
    if (!container.current || !route.length) return;
    const points = route.map(([lat, lng]) => L.latLng(lat, lng));
    const instance = L.map(container.current, { scrollWheelZoom: false }).fitBounds(L.latLngBounds(points).pad(0.25));
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    L.polyline(points, { color: "#9b5c38", weight: 5 }).addTo(instance);
    L.circleMarker(points[0], { radius: 8, color: "#2563eb", fillOpacity: 1 }).bindTooltip("Demo bookstore").addTo(instance);
    L.circleMarker(points[points.length - 1], { radius: 8, color: "#16a34a", fillOpacity: 1 }).bindTooltip("Demo destination").addTo(instance);
    courier.current = L.circleMarker(position || points[0], { radius: 10, color: "#a43e2d", fillColor: "#f97316", fillOpacity: 1, weight: 3 }).bindTooltip("Simulated courier").addTo(instance);
    if (!position) courier.current.setStyle({ opacity: 0, fillOpacity: 0 });
    map.current = instance;
    return () => { instance.remove(); map.current = null; courier.current = null; };
  }, [routeKey]);

  useEffect(() => {
    if (!courier.current) return;
    if (position) {
      courier.current.setLatLng(position);
      courier.current.setStyle({ opacity: 1, fillOpacity: 1 });
    } else {
      courier.current.setStyle({ opacity: 0, fillOpacity: 0 });
    }
  }, [position?.[0], position?.[1]]);

  return <div ref={container} className="h-72 sm:h-96 w-full rounded-xl border border-border" aria-label="Demo delivery route on map" />;
}
