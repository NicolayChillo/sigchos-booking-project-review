'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface Props {
  latitude: number;
  longitude: number;
  name?: string;
}

export default function MapEmbed({ latitude, longitude, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude, longitude]).addTo(map);
    if (name) {
      marker.bindPopup(`<strong>${name}</strong>`);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, name]);

  return (
    <div className="flex flex-column gap-2">
      <div
        ref={containerRef}
        className="w-full border-round border-1 surface-border relative z-0"
        style={{ height: '300px' }}
      />
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex align-items-center gap-2 text-primary hover:text-primary-600 transition-colors text-sm font-semibold text-decoration-none mt-2"
      >
        <i className="pi pi-external-link"></i>
        Abrir en Google Maps
      </a>
    </div>
  );
}
