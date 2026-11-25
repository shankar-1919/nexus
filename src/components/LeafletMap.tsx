import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Complaint } from '../types/complaint';
import { getSeverityHex } from './StatusIndicators';
import { DEMO_CITY } from '../lib/seedData';

interface LeafletMapProps {
  complaints?: Complaint[];
  selectedId?: string | null;
  onSelectComplaint?: (id: string) => void;
  onOpenComplaint?: (id: string) => void;
  pickerMode?: boolean;
  pickedCoords?: { lat: number; lng: number } | null;
  onPickLocation?: (coords: { lat: number; lng: number }) => void;
  heightClass?: string;
}

function createPinIcon(color: string, active = false): L.DivIcon {
  const size = active ? 34 : 26;
  const stroke = active ? '#172033' : '#FFFFFF';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="10" fill="${color}" stroke="${stroke}" stroke-width="${active ? 3 : 2.5}" />
      <circle cx="14" cy="14" r="3.5" fill="#FFFFFF" />
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'nexus-map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  complaints = [],
  selectedId = null,
  onSelectComplaint,
  onOpenComplaint,
  pickerMode = false,
  pickedCoords = null,
  onPickLocation,
  heightClass = 'h-[480px]',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  const onSelectRef = useRef(onSelectComplaint);
  const onOpenRef = useRef(onOpenComplaint);
  const onPickRef = useRef(onPickLocation);

  onSelectRef.current = onSelectComplaint;
  onOpenRef.current = onOpenComplaint;
  onPickRef.current = onPickLocation;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = pickedCoords
      ? [pickedCoords.lat, pickedCoords.lng]
      : [DEMO_CITY.center.lat, DEMO_CITY.center.lng];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: pickerMode ? 13 : DEMO_CITY.zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layerGroup;

    if (pickerMode) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onPickRef.current?.({
          lat: Number(e.latlng.lat.toFixed(5)),
          lng: Number(e.latlng.lng.toFixed(5)),
        });
      });
    }

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      pickerMarkerRef.current = null;
    };
  }, [pickerMode]);

  // Update picker pin when pickedCoords change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickerMode || !pickedCoords) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setLatLng([pickedCoords.lat, pickedCoords.lng]);
    } else {
      pickerMarkerRef.current = L.marker([pickedCoords.lat, pickedCoords.lng], {
        icon: createPinIcon('#4F46E5', true),
      }).addTo(map);
    }
    map.panTo([pickedCoords.lat, pickedCoords.lng], { animate: true });
  }, [pickerMode, pickedCoords]);

  // Render complaint markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || pickerMode) return;

    layer.clearLayers();

    for (const c of complaints) {
      const isSelected = c.id === selectedId;
      const marker = L.marker([c.location.lat, c.location.lng], {
        icon: createPinIcon(getSeverityHex(c.severity), isSelected),
      });

      const popupEl = document.createElement('div');
      popupEl.className = 'p-3.5 text-left';
      popupEl.innerHTML = `
        <div class="font-mono text-[11px] font-medium text-slate-500">${escapeHtml(c.id)}</div>
        <div class="mt-0.5 text-sm font-semibold text-slate-900">${escapeHtml(c.category)}</div>
        <div class="mt-1 text-xs text-slate-600">${escapeHtml(c.severity)} · ${escapeHtml(c.status)}</div>
        <div class="mt-1.5 text-xs text-slate-500 leading-snug">${escapeHtml(c.location.address)}</div>
        <button type="button" data-open-id="${escapeHtml(c.id)}" class="mt-3 w-full rounded-md bg-[#4F46E5] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4338CA] cursor-pointer">
          Open Details
        </button>
      `;

      const openBtn = popupEl.querySelector('button[data-open-id]');
      openBtn?.addEventListener('click', () => {
        onOpenRef.current?.(c.id);
      });

      marker.bindPopup(popupEl);
      marker.on('click', () => {
        onSelectRef.current?.(c.id);
      });
      marker.addTo(layer);

      if (isSelected) {
        map.flyTo([c.location.lat, c.location.lng], Math.max(map.getZoom(), 13), {
          duration: 0.45,
        });
        marker.openPopup();
      }
    }
  }, [complaints, selectedId, pickerMode]);

  return (
    <div
      ref={containerRef}
      data-testid="leaflet-map"
      className={`w-full overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-slate-800 ${heightClass}`}
      aria-label={pickerMode ? 'Interactive location selection map' : 'Community infrastructure issues map'}
    />
  );
};
