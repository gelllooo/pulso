export const MARINDUQUE_CENTER: [number, number] = [13.4, 121.95];
export const MARINDUQUE_BOUNDS: [[number, number], [number, number]] = [
  [13.17, 121.78],
  [13.64, 122.18],
];
export function inMarinduque(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 13.17 &&
    lat <= 13.64 &&
    lng >= 121.78 &&
    lng <= 122.18
  );
}
