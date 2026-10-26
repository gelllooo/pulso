import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MUNICIPALITIES, CATEGORIES } from '../data/marinduqueData';
import { IncidentReport, Municipality, Facility } from '../types';
import {
  Layers,
  List,
  Map as MapIcon,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  HeartPulse,
  Anchor,
  Eye,
  Info,
  Search,
  MapPin
} from 'lucide-react';
import L from 'leaflet';

interface AddressSearchResult {
  id: string;
  lat: number;
  lon: number;
  displayName: string;
}

export const RiskMap: React.FC = () => {
  const { reports, facilities, selectedMunicipalityFilter, setSelectedMunicipalityFilter, setActiveTab } = useApp();

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showFacilities, setShowFacilities] = useState(true);
  const [showHazardReference, setShowHazardReference] = useState(true);
  const [activeReportModal, setActiveReportModal] = useState<IncidentReport | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<AddressSearchResult[]>([]);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const facilitiesLayerRef = useRef<L.LayerGroup | null>(null);
  const hazardLayerRef = useRef<L.LayerGroup | null>(null);
  const addressMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const addressSearchRef = useRef<AbortController | null>(null);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (selectedMunicipalityFilter !== 'All' && r.municipality !== selectedMunicipalityFilter) {
      return false;
    }
    if (selectedCategory !== 'All' && r.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'All' && r.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Filtered facilities
  const filteredFacilities = facilities.filter((f) => {
    if (selectedMunicipalityFilter !== 'All' && f.municipality !== selectedMunicipalityFilter) {
      return false;
    }
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Marinduque center coordinates
      const map = L.map(mapContainerRef.current, {
        center: [13.41, 121.90],
        zoom: 11,
        minZoom: 10,
        maxZoom: 17
      });

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Vantor, Earthstar Geographics, and the GIS User Community',
          maxZoom: 19
        }
      );
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });
      satelliteLayer.addTo(map);
      L.control.layers(
        { Satellite: satelliteLayer, Streets: streetLayer },
        undefined,
        { position: 'topright', collapsed: false }
      ).addTo(map);

      // Create Layer Groups
      const markersLayer = L.layerGroup().addTo(map);
      const facilitiesLayer = L.layerGroup().addTo(map);
      const hazardLayer = L.layerGroup().addTo(map);
      const addressMarkerLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      facilitiesLayerRef.current = facilitiesLayer;
      hazardLayerRef.current = hazardLayer;
      addressMarkerLayerRef.current = addressMarkerLayer;
    }

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      facilitiesLayerRef.current = null;
      hazardLayerRef.current = null;
      addressMarkerLayerRef.current = null;
    };
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current) return;
    const timeoutId = window.setTimeout(() => mapInstanceRef.current?.invalidateSize(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [viewMode]);

  // Update Map Markers when data or filters change
  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current) return;

    // 1. Reports Markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      filteredReports.forEach((rep) => {
        // SVG Pin icon with urgency color
        const isUrgent = rep.urgency === 'immediate_danger' || rep.urgency === 'urgent';
        const color = isUrgent ? '#e05338' : '#16385a';
        const statusBadge =
          rep.status === 'verified'
            ? '✓ Verified'
            : rep.status === 'queued_offline' || rep.status === 'pending_sync'
            ? '⏳ Pending Sync'
            : rep.status === 'assigned'
            ? '⚡ Assigned'
            : '● Received';

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
              ${rep.category === 'flooding' ? '🌊' : rep.category === 'agriculture_damage' ? '🌱' : rep.category === 'fisheries_damage' ? '⚓' : '⚠'}
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([rep.lat, rep.lng], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; min-width: 200px; padding: 2px;">
            <div style="font-size: 10px; font-weight: 700; color: #718096; text-transform: uppercase;">
              ${rep.referenceNumber}
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #0f2942; margin-top: 2px;">
              ${rep.category.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div style="font-size: 11px; color: #4a5568; margin-top: 2px;">
              📍 ${rep.barangay}, ${rep.municipality} (${rep.sitioOrLandmark || 'Poblacion'})
            </div>
            <div style="font-size: 11px; margin-top: 6px; color: #2d3748; line-height: 1.3;">
              ${rep.description}
            </div>
            <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
              <span style="background: ${isUrgent ? '#fee2e2' : '#e0f2fe'}; color: ${isUrgent ? '#b91c1c' : '#0369a1'}; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                ${statusBadge}
              </span>
              <span style="color: #718096;">${rep.observationTime}</span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setActiveReportModal(rep);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 2. Facilities Markers
    if (facilitiesLayerRef.current) {
      facilitiesLayerRef.current.clearLayers();

      if (showFacilities) {
        filteredFacilities.forEach((fac) => {
          const isEvac = fac.type === 'evacuation_center';
          const isHospital = fac.type === 'hospital_health_center';
          const facColor = isEvac ? '#0284c7' : isHospital ? '#dc2626' : '#2b5c8f';

          const facIcon = L.divIcon({
            className: 'facility-map-pin',
            html: `
              <div style="background-color: ${facColor}; width: 22px; height: 22px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
                ${isEvac ? '⛺' : isHospital ? '🏥' : '⚓'}
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          const fMarker = L.marker([fac.lat, fac.lng], { icon: facIcon });
          fMarker.bindPopup(`
            <div style="font-family: Inter, sans-serif; min-width: 210px;">
              <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase;">
                ${fac.type.replace(/_/g, ' ')}
              </div>
              <div style="font-size: 12px; font-weight: bold; color: #0f2942; margin-top: 2px;">
                ${fac.name}
              </div>
              <div style="font-size: 11px; color: #4a5568; margin-top: 2px;">
                📍 ${fac.barangay}, ${fac.municipality}
              </div>
              <div style="font-size: 11px; margin-top: 4px;">
                Occupancy: <strong>${fac.currentOccupancy} / ${fac.capacity}</strong> persons
              </div>
              <div style="font-size: 10px; color: #718096; margin-top: 4px;">
                Utilities: ${fac.hasWater ? '💧 Water OK ' : '❌ No Water '} | ${fac.hasPower ? '⚡ Power OK ' : '❌ No Power '}
              </div>
            </div>
          `);
          facilitiesLayerRef.current?.addLayer(fMarker);
        });
      }
    }

    // 3. Official Indicative Hazard Reference Polygons (GeoRiskPH / HazardHunterPH Reference)
    if (hazardLayerRef.current) {
      hazardLayerRef.current.clearLayers();

      if (showHazardReference) {
        // Indicative Boac River Flood Susceptibility Corridor (Planning reference only)
        const floodPoly = L.polygon(
          [
            [13.465, 121.848],
            [13.452, 121.844],
            [13.442, 121.838],
            [13.435, 121.821],
            [13.438, 121.815],
            [13.448, 121.832],
            [13.468, 121.842]
          ],
          {
            color: '#0284c7',
            weight: 1.5,
            fillColor: '#0284c7',
            fillOpacity: 0.18,
            dashArray: '4, 4'
          }
        );
        floodPoly.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px;">
            <strong>Boac River Indicative Flood Susceptibility Zone</strong><br/>
            <em>Source: GeoRiskPH / HazardHunterPH Reference Layer</em><br/>
            <span style="color: #64748b; font-size: 10px;">Note: Indicative planning zone, not real-time evacuation order.</span>
          </div>
        `);
        hazardLayerRef.current.addLayer(floodPoly);

        // Indicative Coastal Storm Surge Susceptibility (Cawit / Laylay Coastal strip)
        const surgePoly = L.polygon(
          [
            [13.405, 121.812],
            [13.425, 121.814],
            [13.442, 121.816],
            [13.441, 121.821],
            [13.422, 121.819],
            [13.404, 121.816]
          ],
          {
            color: '#e05338',
            weight: 1.5,
            fillColor: '#e05338',
            fillOpacity: 0.15,
            dashArray: '3, 3'
          }
        );
        surgePoly.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px;">
            <strong>Coastal Wave & Storm Surge Susceptibility Zone</strong><br/>
            <em>Source: PAGASA & HazardHunterPH Indicative Mapping</em><br/>
            <span style="color: #64748b; font-size: 10px;">Reference for small craft and shoreline bancas.</span>
          </div>
        `);
        hazardLayerRef.current.addLayer(surgePoly);
      }
    }
  }, [viewMode, filteredReports, filteredFacilities, showFacilities, showHazardReference]);

  const searchAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = addressQuery.trim();
    if (query.length < 3 || query.length > 120) {
      setAddressSearchError('Enter a place or address between 3 and 120 characters.');
      setAddressResults([]);
      return;
    }

    addressSearchRef.current?.abort();
    const controller = new AbortController();
    addressSearchRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
    setIsSearchingAddress(true);
    setAddressSearchError(null);
    setAddressResults([]);

    try {
      const response = await fetch(`/api/map/search?q=${encodeURIComponent(query)}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload &&
          typeof payload.error === 'string'
          ? payload.error
          : `Address search failed (HTTP ${response.status}).`;
        throw new Error(message);
      }
      if (!payload || typeof payload !== 'object' || !('results' in payload) || !Array.isArray(payload.results)) {
        throw new Error('Address search returned an unexpected response.');
      }

      const results = payload.results.flatMap((item): AddressSearchResult[] => {
        if (!item || typeof item !== 'object') return [];
        const result = item as Record<string, unknown>;
        if (
          typeof result.id !== 'string' ||
          typeof result.displayName !== 'string' ||
          typeof result.lat !== 'number' ||
          typeof result.lon !== 'number' ||
          !Number.isFinite(result.lat) ||
          !Number.isFinite(result.lon)
        ) return [];
        return [{
          id: result.id,
          displayName: result.displayName,
          lat: result.lat,
          lon: result.lon
        }];
      });
      setAddressResults(results);
      if (results.length === 0) {
        setAddressSearchError('No matching places were found in Marinduque.');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setAddressSearchError(error instanceof Error ? error.message : 'Unable to search for that address.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (addressSearchRef.current === controller) {
        addressSearchRef.current = null;
        setIsSearchingAddress(false);
      }
    }
  };

  const focusAddressResult = (result: AddressSearchResult) => {
    const map = mapInstanceRef.current;
    const layer = addressMarkerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const marker = L.marker([result.lat, result.lon], {
      icon: L.divIcon({
        className: 'address-search-pin',
        html: '<div style="background:#e05338;width:28px;height:28px;border-radius:50% 50% 50% 0;border:2px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      })
    });
    const popup = document.createElement('div');
    popup.textContent = result.displayName;
    marker.bindPopup(popup).addTo(layer);
    map.setView([result.lat, result.lon], Math.max(map.getZoom(), 15));
    marker.openPopup();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      {/* Top Controls: Title, View Switcher & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-marine-900 flex items-center space-x-2">
              <MapIcon className="w-5 h-5 text-coral-500" />
              <span>Marinduque Community Risk & Incident Map</span>
            </h1>
            <p className="text-xs text-charcoal-600 mt-0.5">
              Verified ground observations, evacuation centers, and official GeoRiskPH hazard reference layers.
            </p>
          </div>

          {/* Map vs List View Fallback (Critical for offline / low-bandwidth) */}
          <div className="flex items-center bg-sand-100 p-1 rounded-lg border border-sand-300">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-marine-900 text-white shadow-sm'
                  : 'text-charcoal-700 hover:text-marine-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Interactive Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-marine-900 text-white shadow-sm'
                  : 'text-charcoal-700 hover:text-marine-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Fallback ({filteredReports.length})</span>
            </button>
          </div>
        </div>

        {viewMode === 'map' && (
          <div className="mb-3 border-t border-sand-200 pt-3">
            <form onSubmit={(event) => void searchAddress(event)} className="flex flex-wrap gap-2">
              <label htmlFor="map-address-search" className="sr-only">Search a Marinduque address or place</label>
              <input
                id="map-address-search"
                type="search"
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
                maxLength={120}
                placeholder="Search an address or place in Marinduque"
                className="min-w-0 flex-1 rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-500 focus:outline-none focus:ring-2 focus:ring-marine-700"
              />
              <button
                type="submit"
                disabled={isSearchingAddress}
                className="inline-flex items-center gap-2 rounded-lg bg-marine-900 px-4 py-2 text-sm font-semibold text-white hover:bg-marine-800 disabled:cursor-wait disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {isSearchingAddress ? 'Searching…' : 'Search map'}
              </button>
            </form>
            <p className="mt-1.5 text-[11px] text-charcoal-600">
              One search per submission; results are limited to Marinduque. Search terms are sent to{' '}
              <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="underline">
                OpenStreetMap Nominatim
              </a>
              . Don&apos;t enter private or sensitive information.
            </p>
            {addressSearchError && (
              <p role="alert" className="mt-2 text-xs font-medium text-coral-700">{addressSearchError}</p>
            )}
            {addressResults.length > 0 && (
              <ul aria-label="Address search results" className="mt-2 max-h-36 divide-y divide-sand-200 overflow-y-auto rounded-lg border border-sand-200 bg-white">
                {addressResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => focusAddressResult(result)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-marine-900 hover:bg-sand-50"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-coral-600" />
                      <span>{result.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sand-200 text-xs">
          <div className="flex items-center space-x-1 text-charcoal-600 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-marine-800" />
            <span>Filter:</span>
          </div>

          {/* Municipality Filter */}
          <select
            value={selectedMunicipalityFilter}
            onChange={(e) => setSelectedMunicipalityFilter(e.target.value as any)}
            className="bg-sand-50 border border-sand-300 rounded px-2.5 py-1 text-xs font-semibold text-marine-900 focus:outline-none focus:ring-1 focus:ring-marine-800"
          >
            <option value="All">All Municipalities (Province-wide)</option>
            {MUNICIPALITIES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-sand-50 border border-sand-300 rounded px-2.5 py-1 text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-marine-800"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-sand-50 border border-sand-300 rounded px-2.5 py-1 text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-marine-800"
          >
            <option value="All">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="assigned">Assigned / In Progress</option>
            <option value="received">Received / Pending</option>
            <option value="pending_sync">Pending Server Sync</option>
            <option value="queued_offline">Queued in Offline Outbox</option>
          </select>

          {/* Layer toggles */}
          {viewMode === 'map' && (
            <div className="ml-auto flex items-center space-x-3 text-[11px] text-charcoal-600">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFacilities}
                  onChange={(e) => setShowFacilities(e.target.checked)}
                  className="rounded border-sand-300 text-marine-800"
                />
                <span>Facilities ({filteredFacilities.length})</span>
              </label>

              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHazardReference}
                  onChange={(e) => setShowHazardReference(e.target.checked)}
                  className="rounded border-sand-300 text-marine-800"
                />
                <span title="Indicative hazard planning zones from HazardHunterPH / GeoRiskPH">
                  Hazard Zones
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Map or List Fallback */}
      {viewMode === 'map' ? (
        <div className="relative bg-sand-200 rounded-xl overflow-hidden shadow-md border border-sand-300 h-[560px]">
          <div id="pulso-map" ref={mapContainerRef} className="w-full h-full z-10" />

          <div className="absolute top-3 left-3 z-20 max-w-xs rounded-lg border border-sand-300 bg-white/95 p-2.5 text-[11px] shadow-lg">
            <div className="font-semibold text-marine-900">Satellite imagery is not live.</div>
            <p className="mt-0.5 text-charcoal-600">
              Imagery updates on the provider&apos;s schedule. Community markers show reports stored in this app and update when local data changes.
            </p>
            <a
              href="https://goto.arcgisonline.com/maps/World_Imagery"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-semibold text-marine-800 underline"
            >
              Esri World Imagery details
            </a>
          </div>

          {/* Map Legend Floating Box */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-sand-300 rounded-lg p-3 text-[11px] shadow-lg max-w-xs">
            <div className="font-bold text-marine-900 mb-1.5 flex items-center justify-between">
              <span>Map Layer Legend</span>
              <span className="text-[10px] text-charcoal-500 font-normal">Marinduque Grid</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-coral-500 border border-white shrink-0"></span>
                <span>Urgent / Immediate Danger Incident</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-marine-800 border border-white shrink-0"></span>
                <span>Verified Community Report</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-sky-600 border border-white shrink-0"></span>
                <span>Evacuation Center / Assembly Point</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-2 bg-sky-500/30 border border-dashed border-sky-600 shrink-0"></span>
                <span className="text-[10px]">Indicative Flood Susceptibility (GeoRiskPH)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View Fallback (Fast, light, 100% resilient when map tiles fail) */
        <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
          <div className="p-3.5 bg-sand-100 border-b border-sand-200 flex items-center justify-between text-xs font-semibold text-marine-900">
            <div className="flex items-center space-x-1.5">
              <List className="w-4 h-4 text-marine-800" />
              <span>Offline List Fallback &mdash; {filteredReports.length} Active Incidents</span>
            </div>
            <span className="text-[11px] text-charcoal-600 font-normal">
              Showing reports for {selectedMunicipalityFilter === 'All' ? 'Whole Province' : selectedMunicipalityFilter}
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-charcoal-500">
              No reports match the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-sand-200">
              {filteredReports.map((rep) => (
                <div key={rep.id} className="p-4 hover:bg-sand-50/70 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-coral-600 bg-coral-50 border border-coral-200 px-2 py-0.5 rounded">
                        {rep.referenceNumber}
                      </span>
                      <span className="font-bold text-xs text-marine-900 capitalize">
                        {rep.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-charcoal-500">
                        &bull; {rep.barangay}, {rep.municipality} ({rep.sitioOrLandmark})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          rep.urgency === 'immediate_danger' || rep.urgency === 'urgent'
                            ? 'bg-coral-100 text-coral-700'
                            : 'bg-sand-200 text-charcoal-800'
                        }`}
                      >
                        {rep.urgency.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          rep.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.status === 'queued_offline' || rep.status === 'pending_sync'
                            ? 'bg-amber-100 text-amber-800'
                            : rep.status === 'assigned'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-sand-200 text-charcoal-700'
                        }`}
                      >
                        {rep.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-800 leading-relaxed mb-2">{rep.description}</p>

                  {rep.verification && (
                    <div className="bg-sand-50 border-l-2 border-emerald-500 p-2 text-[11px] text-charcoal-700 rounded-r mb-2">
                      <strong>Verification Note ({rep.verification.verifierName}):</strong>{' '}
                      {rep.verification.internalNotes || rep.verification.publicUpdate || 'Confirmed by field check.'}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1">
                    <span>Observed: {rep.observationTime}</span>
                    <button
                      onClick={() => setActiveReportModal(rep)}
                      className="text-marine-700 hover:text-marine-900 font-bold underline flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-marine-900 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-coral-600 bg-sand-100 px-2 py-0.5 rounded">
                  {activeReportModal.referenceNumber}
                </span>
                <h3 className="font-display font-bold text-lg text-marine-900 mt-1 capitalize">
                  {activeReportModal.category.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-charcoal-600">
                  📍 {activeReportModal.barangay}, {activeReportModal.municipality} &mdash;{' '}
                  {activeReportModal.sitioOrLandmark}
                </p>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="text-charcoal-400 hover:text-charcoal-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-charcoal-700 border-t border-sand-200 pt-3">
              <div>
                <span className="font-semibold text-charcoal-900">Observation:</span>
                <p className="mt-1 bg-sand-50 p-2.5 rounded border border-sand-200 leading-relaxed">
                  {activeReportModal.description}
                </p>
              </div>

              {activeReportModal.livelihoodDetails && (
                <div className="bg-forest-50 p-3 rounded border border-forest-200">
                  <span className="font-bold text-forest-800">Livelihood Assessment:</span>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                    {activeReportModal.livelihoodDetails.cropType && (
                      <div>Crop: {activeReportModal.livelihoodDetails.cropType}</div>
                    )}
                    {activeReportModal.livelihoodDetails.affectedAreaHa && (
                      <div>Area: {activeReportModal.livelihoodDetails.affectedAreaHa} ha</div>
                    )}
                    {activeReportModal.livelihoodDetails.boatType && (
                      <div>Boat/Gear: {activeReportModal.livelihoodDetails.boatType}</div>
                    )}
                    {activeReportModal.livelihoodDetails.estimatedValueLossPhp && (
                      <div>Est. Loss: ₱{activeReportModal.livelihoodDetails.estimatedValueLossPhp.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-sand-50 p-2.5 rounded border border-sand-200">
                <div>
                  <span className="text-charcoal-500">Urgency:</span>{' '}
                  <span className="font-bold uppercase text-coral-600">{activeReportModal.urgency}</span>
                </div>
                <div>
                  <span className="text-charcoal-500">Current Status:</span>{' '}
                  <span className="font-bold uppercase text-marine-800">{activeReportModal.status}</span>
                </div>
                <div>
                  <span className="text-charcoal-500">Reported Time:</span>{' '}
                  <span>{activeReportModal.reportedTime}</span>
                </div>
                <div>
                  <span className="text-charcoal-500">Reporter:</span>{' '}
                  <span>{activeReportModal.reporterName || 'Anonymous'}</span>
                </div>
              </div>

              {activeReportModal.verification && (
                <div className="border border-emerald-200 bg-emerald-50/70 p-3 rounded text-[11px]">
                  <div className="font-bold text-emerald-900 flex items-center space-x-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Official Verification Record</span>
                  </div>
                  <div>Verifier: <strong>{activeReportModal.verification.verifierName}</strong> ({activeReportModal.verification.verifierOffice})</div>
                  <div>Basis: {activeReportModal.verification.basis} | Confidence: {activeReportModal.verification.confidence.toUpperCase()}</div>
                  <div className="mt-1 text-charcoal-700">Notes: {activeReportModal.verification.internalNotes}</div>
                </div>
              )}

              {activeReportModal.assignment && (
                <div className="border border-sky-200 bg-sky-50/70 p-3 rounded text-[11px]">
                  <div className="font-bold text-sky-900 mb-1">Assigned Action Unit</div>
                  <div>Assigned To: <strong>{activeReportModal.assignment.assignedTo}</strong></div>
                  <div>Directive: {activeReportModal.assignment.actionRequired}</div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setActiveReportModal(null);
                  setActiveTab('verify');
                }}
                className="py-2 px-3 bg-marine-900 text-white rounded-lg text-xs font-semibold hover:bg-marine-800"
              >
                Go to Verification Hub
              </button>
              <button
                onClick={() => setActiveReportModal(null)}
                className="py-2 px-3 bg-sand-200 text-charcoal-800 rounded-lg text-xs font-semibold hover:bg-sand-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
