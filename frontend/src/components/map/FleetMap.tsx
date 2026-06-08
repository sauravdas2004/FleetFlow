import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Truck } from 'lucide-react';
import type { Driver } from '@/types';

interface FleetMapProps {
  drivers?: Driver[];
  center?: [number, number];
  height?: string;
  showFallback?: boolean;
}

export function FleetMap({ drivers = [], center = [-73.9857, 40.7484], height = '400px' }: FleetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token || token.includes('example') || token.includes('your_')) return;

    let map: import('mapbox-gl').Map | null = null;

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');
      mapboxgl.accessToken = token;

      if (!mapRef.current) return;

      map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [center[0], center[1]],
        zoom: 11,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.on('load', () => setMapLoaded(true));
    };

    initMap();
    return () => map?.remove();
  }, [token, center]);

  useEffect(() => {
    if (!mapLoaded || !token) return;
    // Markers would be added here with mapbox-gl
  }, [drivers, mapLoaded, token]);

  const useFallback = !token || token.includes('example') || token.includes('your_');

  if (useFallback) {
    return (
      <div className="relative rounded-xl overflow-hidden border" style={{ height }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          {drivers.map((driver, i) => {
            const coords = driver.currentLocation?.coordinates || [-73.9857 + i * 0.02, 40.7484 + i * 0.01];
            const left = `${20 + ((coords[0] + 74) * 800) % 70}%`;
            const top = `${15 + ((coords[1] - 40.7) * 1200) % 65}%`;
            const user = typeof driver.user === 'object' ? driver.user : null;
            return (
              <div
                key={driver._id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left, top }}
              >
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-green-500/20 animate-ping" />
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 border-2 border-white/20">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap glass rounded-lg px-3 py-1.5 text-xs z-10">
                    {user ? `${user.firstName} ${user.lastName}` : 'Driver'}
                    <span className="block text-muted-foreground capitalize">{driver.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="absolute bottom-4 left-4 glass rounded-lg px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Live fleet map • {drivers.length} active drivers
          </div>
          <div className="absolute top-4 right-4 glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-green-400" />
            <span className="text-green-400">Realtime</span>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="rounded-xl overflow-hidden border" style={{ height }} />;
}
