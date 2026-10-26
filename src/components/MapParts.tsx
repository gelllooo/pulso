import { useEffect } from "react";
import { useMap, useMapEvents, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { MARINDUQUE_BOUNDS, inMarinduque } from "../lib/geo";
export const ESRI_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const STREET_TILES =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export function MapLimits() {
  const map = useMap();
  useEffect(() => {
    const resize = () => {
      map.invalidateSize();
      const minimum = Math.max(
        10,
        Math.ceil(map.getBoundsZoom(L.latLngBounds(MARINDUQUE_BOUNDS), true)),
      );
      map.setMinZoom(minimum);
      if (map.getZoom() < minimum) map.setZoom(minimum);
      map.panInsideBounds(MARINDUQUE_BOUNDS, { animate: false });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(map.getContainer());
    resize();
    return () => observer.disconnect();
  }, [map]);
  return null;
}
export function Basemap({ satellite }: { satellite: boolean }) {
  return (
    <TileLayer
      key={String(satellite)}
      url={satellite ? ESRI_TILES : STREET_TILES}
      maxZoom={19}
      attribution={
        satellite
          ? "Tiles © Esri — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community"
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    />
  );
}
export function pinIcon(color: string, symbol: string) {
  return L.divIcon({
    className: "pulso-map-pin",
    html: `<span style="background:${color}">${symbol}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
export const LOCATION_PIN = pinIcon("#e05338", "+");
export function LocationPicker({
  position,
  onChange,
}: {
  position: [number, number] | null;
  onChange: (p: [number, number]) => void;
}) {
  const map = useMapEvents({
    click: (e) => {
      if (inMarinduque(e.latlng.lat, e.latlng.lng))
        onChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  useEffect(() => {
    if (position) map.panTo(position);
  }, [position?.[0], position?.[1], map]);
  return position ? <Marker position={position} icon={LOCATION_PIN} /> : null;
}
