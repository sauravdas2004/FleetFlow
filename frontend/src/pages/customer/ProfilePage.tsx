import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { updateUser } from '@/redux/slices/authSlice';
import { authApi } from '@/services/api';
import { toast } from '@/components/ui/toast';

export default function ProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.updateProfile({ firstName, lastName, phone });
      dispatch(updateUser({ firstName, lastName, phone }));
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-3xl font-bold">Profile</h1>
      <Card>
        <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Email</Label><Input value={user?.email || ''} disabled className="mt-1" /></div>
            <div><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" /></div>
            <div><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
            <Button type="submit" variant="gradient">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
