'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Users,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowLeft,
  Loader2,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingsRequestsPage() {
  const { user } = useRootAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const inquiries = useQuery(
    api.accommodationInquiries.getInquiriesForUserListings,
    user?.id ? { userId: user.id as any } : 'skip'
  );
  const updateStatus = useMutation(api.accommodationInquiries.updateInquiryStatus);

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  const handleStatusUpdate = async (inquiryId: any, newStatus: string) => {
    try {
      await updateStatus({
        inquiryId,
        status: newStatus as any,
        userId: (user as any).id,
      });
      toast.success(`Inquiry ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update inquiry');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'confirmed': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'declined': return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (!inquiries) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  const filtered = inquiries.filter((inquiry: any) => {
    if (statusFilter !== 'all' && inquiry.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (inquiry.guestName?.toLowerCase().includes(q) || inquiry.guestEmail?.toLowerCase().includes(q) || inquiry.listingTitle?.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
            <p className="text-gray-600">Manage incoming booking inquiries</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name, email, or listing..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'confirmed', 'declined'].map((status) => (
              <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)} className="capitalize">{status}</Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-gray-500">No booking requests found</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((inquiry: any) => (
              <Card key={inquiry._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{inquiry.listingTitle || 'Listing'}</h3>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{inquiry.checkIn} — {inquiry.checkOut}</div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" />{inquiry.guests} guest{inquiry.guests !== 1 ? 's' : ''}</div>
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{inquiry.guestEmail}</div>
                        {inquiry.guestPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{inquiry.guestPhone}</div>}
                      </div>
                      {inquiry.specialRequests && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-gray-500">
                          <MessageCircle className="h-4 w-4 mt-0.5" />
                          <span>{inquiry.specialRequests}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {inquiry.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate(inquiry._id, 'confirmed')}>
                            <CheckCircle className="h-4 w-4 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate(inquiry._id, 'declined')}>
                            <XCircle className="h-4 w-4 mr-1" />Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
