import { useEffect, useState } from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { driverApi } from '@/services/api';
import { emitDriverLocation } from '@/services/socket';
import { toast } from '@/components/ui/toast';

export default function NavigatePage() {
  const [sharing, setSharing] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!sharing) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        driverApi.updateLocation({ coordinates: coords, heading: pos.coords.heading || 0, speed: pos.coords.speed || 0 });
        emitDriverLocation({ coordinates: coords, heading: pos.coords.heading || undefined, speed: pos.coords.speed || undefined });
      },
      () => toast.error('Location error', 'Enable GPS permissions'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [sharing]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Navigation</h1>
      <Card>
        <CardHeader><CardTitle>Live Location Sharing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">Share your realtime location with the fleet dashboard and customers.</p>
          <Button variant={sharing ? 'destructive' : 'gradient'} onClick={() => { setSharing(!sharing); toast.info(sharing ? 'Location sharing stopped' : 'Location sharing started'); }}>
            <Navigation className="w-4 h-4" />
            {sharing ? 'Stop Sharing' : 'Start Sharing Location'}
          </Button>
          {position && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
