'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';
import type { MapBench } from '@/lib/mapTypes';
import { BenchPreviewCard } from './BenchPreviewCard';
import { ControlledCheckInSheet } from '@/components/CheckInButton';

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export function BenchMap({ shareBenchId }: { shareBenchId?: string }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const benchesRef = useRef<Map<string, MapBench>>(new Map());
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [selectedBench, setSelectedBench] = useState<MapBench | null>(null);
  const [checkInBenchId, setCheckInBenchId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  const applyMarkers = useCallback((benches: MapBench[]) => {
    if (!mapRef.current) return;

    const google = window.google;
    const nextIds = new Set(benches.map((b) => b.id));

    for (const [id, marker] of markersRef.current.entries()) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    for (const bench of benches) {
      benchesRef.current.set(bench.id, bench);
      if (markersRef.current.has(bench.id)) continue;

      const marker = new google.maps.Marker({
        position: { lat: bench.latitude, lng: bench.longitude },
        title: bench.name,
        icon: {
          path: 'M -10,4 L 10,4 L 10,7 L -10,7 Z M -10,-2 L 10,-2 L 10,1 L -10,1 Z M -9,7 L -6,7 L -6,13 L -9,13 Z M 6,7 L 9,7 L 9,13 L 6,13 Z',
          fillColor: bench.active_checkins > 0 ? '#4f8055' : '#3c6642',
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#243729',
          scale: 1.4,
          anchor: new google.maps.Point(0, 10),
        },
      });

      marker.addListener('click', () => {
        setSelectedBench(benchesRef.current.get(bench.id) ?? bench);
        mapRef.current?.panTo(marker.getPosition()!);
      });

      markersRef.current.set(bench.id, marker);
    }

    clustererRef.current?.clearMarkers();
    clustererRef.current?.addMarkers(Array.from(markersRef.current.values()));
  }, []);

  const fetchNearby = useCallback(
    async (center: { lat: number; lng: number }, radiusMeters: number) => {
      const res = await fetch(
        `/api/benches/nearby?lat=${center.lat}&lng=${center.lng}&radius=${radiusMeters}`
      );
      if (!res.ok) return;
      const { benches } = (await res.json()) as { benches: MapBench[] };
      applyMarkers(benches);

      if (selectedBench) {
        const updated = benches.find((b) => b.id === selectedBench.id);
        if (updated) setSelectedBench(updated);
      }
    },
    [applyMarkers, selectedBench]
  );

  const scheduleFetchForCurrentView = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      const map = mapRef.current;
      if (!map) return;
      const center = map.getCenter();
      const bounds = map.getBounds();
      if (!center || !bounds) return;
      const ne = bounds.getNorthEast();
      const radius = Math.min(
        20000,
        Math.max(
          500,
          google.maps.geometry?.spherical?.computeDistanceBetween(center, ne) ?? 3000
        )
      );
      fetchNearby({ lat: center.lat(), lng: center.lng() }, radius);
    }, 400);
  }, [fetchNearby]);

  useEffect(() => {
    let cancelled = false;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      version: 'weekly',
      libraries: ['geometry'],
    });

    loader.load().then(() => {
      if (cancelled || !mapDivRef.current) return;

      const map = new google.maps.Map(mapDivRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        styles: MAP_STYLES,
      });

      mapRef.current = map;
      clustererRef.current = new MarkerClusterer({ map });

      map.addListener('idle', scheduleFetchForCurrentView);
      setReady(true);

      if (shareBenchId) {
        fetch(`/api/benches/${shareBenchId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { bench?: MapBench } | null) => {
            if (data?.bench) {
              map.panTo({ lat: data.bench.latitude, lng: data.bench.longitude });
              map.setZoom(17);
              setSelectedBench(data.bench);
            }
          });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const supabase = createClient();
    const channel = supabase
      .channel('map-checkins')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
        scheduleFetchForCurrentView();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ready, scheduleFetchForCurrentView]);

  function locateMe() {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        mapRef.current!.panTo(pos);
        mapRef.current!.setZoom(16);

        if (!userMarkerRef.current) {
          userMarkerRef.current = new google.maps.Marker({
            position: pos,
            map: mapRef.current!,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
            zIndex: 999,
          });
        } else {
          userMarkerRef.current.setPosition(pos);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  return (
    <div className="relative h-dvh w-full">
      <div ref={mapDivRef} className="h-full w-full" />

      <button
        onClick={locateMe}
        className="safe-top absolute right-3 top-3 z-20 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-moss-700 shadow-card active:scale-95"
      >
        {locating ? '📍 …' : '📍 Find bænke nær mig'}
      </button>

      {selectedBench && !checkInBenchId && (
        <BenchPreviewCard
          bench={selectedBench}
          onClose={() => setSelectedBench(null)}
          onCheckIn={() => setCheckInBenchId(selectedBench.id)}
        />
      )}

      <ControlledCheckInSheet
        benchId={checkInBenchId}
        open={checkInBenchId !== null}
        onOpenChange={(open) => !open && setCheckInBenchId(null)}
        onDone={() => setCheckInBenchId(null)}
      />
    </div>
  );
}
