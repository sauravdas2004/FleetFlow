import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Package } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { deliveryApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { Delivery } from '@/types';

export default function CustomerDashboard() {
  const [showForm, setShowForm] = useState(false);
  const { data: deliveries, refetch } = useQuery({
    queryKey: ['customer-deliveries'],
    queryFn: async () => (await deliveryApi.getAll({ limit: 20 })).data.data as Delivery[],
  });

  const active = (deliveries || []).filter((d) => !['delivered', 'cancelled'].includes(d.status));
  const completed = (deliveries || []).filter((d) => d.status === 'delivered');

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await deliveryApi.create({
        packageDescription: fd.get('description'),
        priority: fd.get('priority') || 'normal',
        pickupAddress: { street: fd.get('pickupStreet'), city: 'Manhattan', state: 'NY', zipCode: '10001', country: 'USA', coordinates: [-73.9857, 40.7484] },
        deliveryAddress: { street: fd.get('deliveryStreet'), city: 'Brooklyn', state: 'NY', zipCode: '11201', country: 'USA', coordinates: [-73.9442, 40.6782] },
      });
      toast.success('Delivery created!');
      setShowForm(false);
      refetch();
    } catch {
      toast.error('Failed to create delivery');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Deliveries</h1>
          <p className="text-muted-foreground">Track and manage your shipments</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" /> New Delivery</Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Active" value={active.length} icon={Package} />
        <StatCard title="Completed" value={completed.length} icon={Package} trend="up" />
        <StatCard title="Total Spent" value={formatCurrency((deliveries || []).reduce((s, d) => s + d.fare, 0))} icon={Package} />
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Delivery</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
              <div><Label>Package Description</Label><Input name="description" required className="mt-1" /></div>
              <div><Label>Pickup Street</Label><Input name="pickupStreet" required className="mt-1" defaultValue="123 Main St" /></div>
              <div><Label>Delivery Street</Label><Input name="deliveryStreet" required className="mt-1" defaultValue="456 Broadway" /></div>
              <div><Label>Priority</Label>
                <select name="priority" className="mt-1 w-full h-10 rounded-lg border px-3 bg-background">
                  <option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <Button type="submit" variant="gradient">Create Delivery</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Deliveries</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(deliveries || []).map((d) => (
            <div key={d._id} className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-mono text-xs">{d.trackingNumber}</p>
                <p className="text-sm">{d.packageDescription}</p>
                <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
              </div>
              <div className="text-right">
                <Badge status={d.status} />
                <p className="text-sm mt-1">{formatCurrency(d.fare)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
