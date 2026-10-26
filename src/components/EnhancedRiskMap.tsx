import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Maximize2, MapPin, Wifi, WifiOff, AlertTriangle, Building2, Layers3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MUNICIPALITIES, CATEGORIES } from '../data/marinduqueData';
import { IncidentReport } from '../types';

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char] as string);

const validCoordinates = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const reportColor = (report: IncidentReport) =>
  report.urgency === 'immediate_danger' || report.urgency === 'urgent' ? '#e05338' : '#16385a';

export const EnhancedRiskMap: React.FC = () => {
  const { reports, facilities, selectedMunicipalityFilter, setSelectedMunicipalityFilter } = useApp();
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [showFacilities, setShowFacilities] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [tileState, setTileState] = useState<'loading' | 'online' | 'unavailable'>('loading');
  const [locationMessage, setLocationMessage] = useState('');
  const mapHost = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const reportLayer = useRef<L.LayerGroup | null>(null);
  const facilityLayer = useRef<L.LayerGroup | null>(null);
  const hazardLayer = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const filteredReports = useMemo(() => reports.filter((report) =>
    (selectedMunicipalityFilter === 'All' || report.municipality === selectedMunicipalityFilter) &&
    (category === 'All' || report.category === category) &&
    (status === 'All' || report.status === status)
  ), [reports, selectedMunicipalityFilter, category, status]);

  const filteredFacilities = useMemo(() => facilities.filter((facility) =>
    selectedMunicipalityFilter === 'All' || facility.municipality === selectedMunicipalityFilter
  ), [facilities, selectedMunicipalityFilter]);

  useEffect(() => {
    if (!mapHost.current || mapRef.current) return;
    const map = L.map(mapHost.current, { center: [13.41, 121.90], zoom: 11, minZoom: 8, maxZoom: 19, zoomControl: true });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      crossOrigin: true
    });
    tiles.on('loading', () => setTileState('loading'));
    tiles.on('tileload', () => setTileState('online'));
    tiles.on('tileerror', () => setTileState((current) => current === 'online' ? current : 'unavailable'));
    tiles.addTo(map);
    reportLayer.current = L.layerGroup().addTo(map);
    facilityLayer.current = L.layerGroup().addTo(map);
    hazardLayer.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    tileLayerRef.current = tiles;

    // Leaflet calculates dimensions before the surrounding layout settles in some tabs.
    const resize = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      window.clearTimeout(resize);
      map.remove();
      mapRef.current = null;
      reportLayer.current = null;
      facilityLayer.current = null;
      hazardLayer.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !reportLayer.current) return;
    reportLayer.current.clearLayers();
    filteredReports.filter((report) => validCoordinates(report.lat, report.lng)).forEach((report) => {
      const icon = L.divIcon({
        className: 'pulso-enhanced-pin',
        html: '<span style="background:' + reportColor(report) + ';width:27px;height:27px;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;box-shadow:0 2px 7px #0005">' +
          (report.category === 'flooding' ? '≈' : report.category === 'agriculture_damage' ? '✳' : '⚠') + '</span>',
        iconSize: [27, 27], iconAnchor: [13, 13]
      });
      const marker = L.marker([report.lat, report.lng], { icon, keyboard: true, title: report.referenceNumber });
      marker.bindPopup(
        '<section style="min-width:210px;max-width:280px;font-family:system-ui,sans-serif">' +
        '<strong>' + escapeHtml(report.referenceNumber) + '</strong>' +
        '<p style="margin:5px 0;font-weight:700">' + escapeHtml(report.category.replace(/_/g, ' ')) + '</p>' +
        '<p style="margin:4px 0">📍 ' + escapeHtml(report.barangay) + ', ' + escapeHtml(report.municipality) + '</p>' +
        '<p style="margin:4px 0;white-space:pre-wrap">' + escapeHtml(report.description) + '</p>' +
        '<p style="margin:6px 0 0"><b>Status:</b> ' + escapeHtml(report.status.replace(/_/g, ' ')) +
        ' · <b>Urgency:</b> ' + escapeHtml(report.urgency.replace(/_/g, ' ')) + '</p></section>'
      );
      reportLayer.current?.addLayer(marker);
    });
  }, [filteredReports]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !facilityLayer.current) return;
    facilityLayer.current.clearLayers();
    if (!showFacilities) return;
    filteredFacilities.filter((facility) => validCoordinates(facility.lat, facility.lng)).forEach((facility) => {
      const isEvacuation = facility.type === 'evacuation_center';
      const isHealth = facility.type === 'hospital_health_center';
      const color = isEvacuation ? '#0284c7' : isHealth ? '#dc2626' : '#2b5c8f';
      const icon = L.divIcon({
        className: 'pulso-enhanced-facility-pin',
        html: '<span style="background:' + color + ';width:25px;height:25px;border:2px solid white;border-radius:5px;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;box-shadow:0 2px 5px #0004">' + (isEvacuation ? 'E' : isHealth ? '+' : 'F') + '</span>',
        iconSize: [25, 25], iconAnchor: [12, 12]
      });
      L.marker([facility.lat, facility.lng], { icon, title: facility.name, keyboard: true })
        .bindPopup('<section style="min-width:200px;font-family:system-ui,sans-serif"><strong>' + escapeHtml(facility.name) +
          '</strong><p style="margin:5px 0">' + escapeHtml(facility.type.replace(/_/g, ' ')) + '</p><p style="margin:4px 0">📍 ' +
          escapeHtml(facility.barangay) + ', ' + escapeHtml(facility.municipality) + '</p><p style="margin:4px 0">Occupancy: <b>' +
          escapeHtml(facility.currentOccupancy) + ' / ' + escapeHtml(facility.capacity) + '</b></p><p style="margin:4px 0">' +
          (facility.hasWater ? 'Water available' : 'Water unconfirmed/unavailable') + ' · ' +
          (facility.hasPower ? 'Power available' : 'Power unconfirmed/unavailable') + '</p><p style="margin:4px 0;font-size:11px;color:#64748b">Last verified: ' +
          escapeHtml(facility.lastVerified || 'Not recorded') + '</p></section>')
        .addTo(facilityLayer.current!);
    });
  }, [filteredFacilities, showFacilities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hazardLayer.current) return;
    hazardLayer.current.clearLayers();
    if (!showHazards) return;
    // Existing illustrative reference polygons; these are not authoritative live hazard boundaries.
    L.polygon([[13.465,121.848],[13.452,121.844],[13.442,121.838],[13.435,121.821],[13.438,121.815],[13.448,121.832],[13.468,121.842]], {
      color: '#0284c7', weight: 1.5, fillColor: '#0284c7', fillOpacity: 0.18, dashArray: '4, 4'
    }).bindPopup('<strong>Indicative Boac River flood-susceptibility reference</strong><p>Planning illustration only; not an official real-time warning or evacuation boundary.</p>').addTo(hazardLayer.current);
    L.polygon([[13.405,121.812],[13.425,121.814],[13.442,121.816],[13.441,121.821],[13.422,121.819],[13.404,121.816]], {
      color: '#e05338', weight: 1.5, fillColor: '#e05338', fillOpacity: 0.15, dashArray: '3, 3'
    }).bindPopup('<strong>Indicative coastal susceptibility reference</strong><p>Planning illustration only; verify with official PAGASA and GeoRiskPH information.</p>').addTo(hazardLayer.current);
  }, [showHazards]);

  const fitVisibleItems = () => {
    const map = mapRef.current;
    if (!map) return;
    const points: L.LatLngExpression[] = [
      ...filteredReports.filter((item) => validCoordinates(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]),
      ...(showFacilities ? filteredFacilities.filter((item) => validCoordinates(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]) : [])
    ];
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 14 });
    else map.setView([13.41, 121.90], 11);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser.');
      return;
    }
    setLocationMessage('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.setView([coords.latitude, coords.longitude], 15);
        L.circleMarker([coords.latitude, coords.longitude], { radius: 8, color: '#fff', weight: 3, fillColor: '#0f766e', fillOpacity: 1 })
          .bindPopup('Your device location').addTo(mapRef.current!);
        setLocationMessage('Centered on your device location.');
      },
      () => setLocationMessage('Could not access location. Check browser permission and GPS availability.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
    <section className="bg-white rounded-xl shadow-sm border border-sand-200 p-4 mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-marine-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-coral-500" />Marinduque Community Risk & Incident Map</h1>
          <p className="text-xs text-charcoal-600 mt-1">Incident reports, facilities, and indicative planning layers. Map tiles require an internet connection.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={fitVisibleItems} className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 px-3 py-2 text-xs font-semibold text-marine-900 hover:bg-sand-50"><Maximize2 className="w-4 h-4" />Fit visible items</button>
          <button type="button" onClick={locateMe} className="inline-flex items-center gap-1.5 rounded-lg bg-marine-900 px-3 py-2 text-xs font-semibold text-white hover:bg-marine-800"><LocateFixed className="w-4 h-4" />Locate me</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-3 text-xs">
        <label className="flex items-center gap-2"><span className="font-semibold">Municipality</span><select value={selectedMunicipalityFilter} onChange={(event) => setSelectedMunicipalityFilter(event.target.value as typeof selectedMunicipalityFilter)} className="rounded border border-sand-300 bg-sand-50 px-2 py-1.5"><option value="All">All</option>{MUNICIPALITIES.map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}</select></label>
        <label className="flex items-center gap-2"><span className="font-semibold">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded border border-sand-300 bg-sand-50 px-2 py-1.5"><option value="All">All categories</option>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="flex items-center gap-2"><span className="font-semibold">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded border border-sand-300 bg-sand-50 px-2 py-1.5"><option value="All">All statuses</option>{['verified','assigned','received','queued_offline','under_verification','action_in_progress','resolved','closed'].map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}</select></label>
        <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" checked={showFacilities} onChange={(event) => setShowFacilities(event.target.checked)} />Facilities ({filteredFacilities.length})</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={showHazards} onChange={(event) => setShowHazards(event.target.checked)} />Hazard references</label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-charcoal-700">{tileState === 'online' ? <Wifi className="h-4 w-4 text-emerald-700" /> : <WifiOff className="h-4 w-4 text-amber-700" />}{tileState === 'online' ? 'Map tiles loading/available' : tileState === 'unavailable' ? 'Map tiles unavailable — use the report list below' : 'Connecting to map tiles…'}</span>
        <span className="text-charcoal-600">{filteredReports.length} reports · {showFacilities ? filteredFacilities.length : 0} facilities shown</span>
      </div>
      {locationMessage && <p role="status" className="mt-2 text-xs text-charcoal-600">{locationMessage}</p>}
    </section>
    <div className="relative h-[520px] overflow-hidden rounded-xl border border-sand-300 bg-sand-100 shadow-md">
      <div ref={mapHost} className="h-full w-full" aria-label="Interactive map of Marinduque incident reports and facilities" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-sand-300 bg-white/95 p-3 text-[11px] shadow">
        <div className="mb-1.5 flex items-center gap-1.5 font-bold text-marine-900"><Layers3 className="h-3.5 w-3.5" />Map legend</div>
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-coral-600" />Urgent incident</div>
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-marine-900" />Other incident</div>
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-sky-600" />Evacuation facility</div>
        <div className="mt-1 flex items-center gap-1 text-charcoal-600"><AlertTriangle className="h-3 w-3" />Hazard polygons are illustrative only</div>
      </div>
    </div>
    <section className="mt-4 overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-sand-200 bg-sand-50 px-4 py-3 text-sm font-bold text-marine-900"><span className="flex items-center gap-2"><Building2 className="h-4 w-4" />Visible incidents</span><span>{filteredReports.length}</span></div>
      {filteredReports.length === 0 ? <p className="p-6 text-center text-sm text-charcoal-600">No reports match these filters. Reports saved locally remain available through the app's offline data store.</p> :
        <ul className="divide-y divide-sand-100">{filteredReports.map((report) => <li key={report.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0"><p className="font-mono text-xs font-bold text-marine-900">{report.referenceNumber}</p><p className="mt-1 text-sm font-semibold capitalize text-charcoal-900">{report.category.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-charcoal-600">{report.barangay}, {report.municipality} · {report.status.replace(/_/g, ' ')} · {report.urgency.replace(/_/g, ' ')}</p><p className="mt-1 line-clamp-2 text-sm text-charcoal-700">{report.description}</p></div>
          <button type="button" onClick={() => { const map = mapRef.current; if (map && validCoordinates(report.lat, report.lng)) map.setView([report.lat, report.lng], 15); }} className="shrink-0 rounded-lg border border-sand-300 px-3 py-2 text-xs font-semibold text-marine-900 hover:bg-sand-50">Show on map</button>
        </li>)}</ul>}
    </section>
    <p className="mt-3 text-[11px] text-charcoal-500">OpenStreetMap data © contributors. The public tile service has usage rules and is not an offline tile download service. For reliable offline field use, deploy a licensed offline basemap or keep using the incident list when disconnected.</p>
  </div>;
};

export default EnhancedRiskMap;
