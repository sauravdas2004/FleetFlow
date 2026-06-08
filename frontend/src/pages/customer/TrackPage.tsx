import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FleetMap } from '@/components/map/FleetMap';
import { deliveryApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { Delivery } from '@/types';

export default function TrackPage() {
  const [tracking, setTracking] = useState('');
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!tracking.trim()) return;
    setLoading(true);
    try {
      const { data } = await deliveryApi.track(tracking.trim());
      setDelivery(data.data);
    } catch {
      toast.error('Delivery not found');
      setDelivery(null);
    } finally {
      setLoading(false);
    }
  };

  const driver = delivery?.driver && typeof delivery.driver === 'object' ? delivery.driver : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Track Delivery</h1>
      <div className="flex gap-2 max-w-lg">
        <Input placeholder="Enter tracking number (e.g. FF...)" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        <Button variant="gradient" onClick={handleTrack} disabled={loading}>
          <Search className="w-4 h-4" /> Track
        </Button>
      </div>

      {delivery && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-mono">{delivery.trackingNumber}</CardTitle>
                <Badge status={delivery.status} />
              </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Package</p><p>{delivery.packageDescription}</p></div>
              <div><p className="text-muted-foreground">Fare</p><p>{formatCurrency(delivery.fare)}</p></div>
              <div><p className="text-muted-foreground">From</p><p>{delivery.pickupAddress.city}</p></div>
              <div><p className="text-muted-foreground">To</p><p>{delivery.deliveryAddress.city}</p></div>
              {delivery.estimatedDeliveryTime && (
                <div><p className="text-muted-foreground">ETA</p><p>{formatDate(delivery.estimatedDeliveryTime)}</p></div>
              )}
              {driver && (
                <div><p className="text-muted-foreground">Driver</p><p>{typeof driver.user === 'object' ? `${driver.user.firstName} ${driver.user.lastName}` : 'Assigned'}</p></div>
              )}
            </CardContent>
          </Card>
          {driver && <FleetMap drivers={[driver]} height="400px" />}
        </>
      )}

      {!delivery && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MapPin className="w-12 h-12 mb-4 opacity-30" />
            <p>Enter a tracking number to see live delivery status</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
