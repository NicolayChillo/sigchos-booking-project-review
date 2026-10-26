'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

// Fix for leaflet markers in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER: [number, number] = [-0.7086, -78.8898];
const DEFAULT_ZOOM = 12;

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapLocationPicker({ latitude, longitude, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function placeMarker(map: L.Map, lat: number, lng: number) {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    onChange(lat, lng);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center,
      zoom: latitude != null ? 15 : DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (latitude != null && longitude != null) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(map, e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddressSearch() {
    const query = searchQuery.trim();
    if (!query || !mapRef.current) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        countrycodes: 'ec',
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'Accept-Language': 'es' },
      });

      const results: NominatimResult[] = await response.json();

      if (results.length === 0) {
        setSearchError('No se encontró la dirección. Intenta con otra descripción o haz clic en el mapa.');
        return;
      }

      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);

      mapRef.current.setView([lat, lng], 16);
      placeMarker(mapRef.current, lat, lng);
    } catch {
      setSearchError('Error al buscar la dirección. Intenta de nuevo.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="flex flex-column gap-2">
      <span className="text-900 font-semibold">Ubicación en el mapa</span>
      <p className="text-600 text-sm m-0">
        Busca la dirección, ingresa las coordenadas o haz clic en el mapa para marcar la ubicación exacta del establecimiento.
      </p>

      <div className="flex gap-2">
        <InputText
          className="flex-1"
          placeholder="Ej: Sigchos, Cotopaxi, Ecuador"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAddressSearch();
            }
          }}
        />
        <Button
          label={isSearching ? 'Buscando...' : 'Buscar dirección'}
          icon={isSearching ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
          disabled={isSearching || !searchQuery.trim()}
          onClick={() => void handleAddressSearch()}
        />
      </div>

      {searchError && <p className="text-red-500 text-sm m-0">{searchError}</p>}

      <div
        ref={containerRef}
        className="w-full border-round border-1 surface-border relative z-0"
        style={{ height: '300px' }}
      />

      {latitude != null && longitude != null ? (
        <p className="text-600 text-sm m-0">
          Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      ) : (
        <p className="text-red-500 text-sm m-0">
          Selecciona la ubicación haciendo clic en el mapa o buscando la dirección.
        </p>
      )}
    </div>
  );
}
