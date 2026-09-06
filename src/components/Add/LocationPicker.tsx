'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';

export function LocationPicker({
  onChange,
}: {
  onChange: (pos: { lat: number; lng: number }) => void;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      version: 'weekly',
    });

    loader.load().then(() => {
      if (cancelled || !mapDivRef.current) return;
      const map = new google.maps.Map(mapDivRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
      });
      mapRef.current = map;
      onChange(DEFAULT_MAP_CENTER);

      map.addListener('idle', () => {
        const center = map.getCenter();
        if (center) onChange({ lat: center.lat(), lng: center.lng() });
      });

      navigator.geolocation?.getCurrentPosition((position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        map.panTo(pos);
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        mapRef.current?.panTo(pos);
        mapRef.current?.setZoom(18);
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl2">
      <div ref={mapDivRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="-mt-6 text-4xl drop-shadow">📍</span>
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-2 text-xs font-semibold text-moss-700 shadow-card"
      >
        {locating ? '…' : '📍 Min position'}
      </button>
    </div>
  );
}
