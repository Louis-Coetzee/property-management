'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../AuthProvider';
import Link from 'next/link';
import {
  Loader2,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Filter,
  Search,
  MoreVertical,
  Eye,
  UserPlus,
  StickyNote,
  Download,
  RefreshCw} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Helper function to format relative time
const formatDistanceToNow = (timestamp: number): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

// Status configuration
const STATUS_CONFIG = {
  new: {
    label: 'New',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Clock},
  contacted: {
    label: 'Contacted',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: MessageSquare},
  qualified: {
    label: 'Qualified',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: CheckCircle},
  converted: {
    label: 'Converted',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: CheckCircle},
  lost: {
    label: 'Lost',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: XCircle},
  archived: {
    label: 'Archived',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: Archive}};

type InquiryStatus = keyof typeof STATUS_CONFIG;

const STATUSES: InquiryStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost', 'archived'];

export default function InquiriesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  // Query state
  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Queries
  const companies = useQuery(
    api.companies.getCompaniesByUser,
    user?.id ? { userId: user.id as any } : "skip"
  );
  const company = companies?.find(c => c?._id === companyId);

  const allInquiries = useQuery(api.inquiries.getInquiriesByCompany, {
    userId: user?.id as any,
    companyId: companyId as any});

  const inquiryStats = useQuery(api.inquiries.getInquiryStats, {
    userId: user?.id as any,
    companyId: companyId as any});

  const users = useQuery(api.auth.getByCompanyId, {
    companyId: companyId as any});

  // Mutations
  const updateStatus = useMutation(api.inquiries.updateInquiryStatus);
  const assignInquiry = useMutation(api.inquiries.assignInquiry);
  const addNotes = useMutation(api.inquiries.addInquiryNotes);

  // Filter and search inquiries
  const filteredInquiries = allInquiries?.filter((inquiry) => {
    // Status filter
    if (selectedStatus !== 'all' && inquiry.status !== selectedStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        inquiry.submitterName,
        inquiry.submitterEmail,
        inquiry.submitterPhone,
        inquiry.formName,
        inquiry.vehicleName,
        inquiry.data.map(d => d.value).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    }

    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    try {
      await updateStatus({
        userId: user?.id as any,
        inquiryId: inquiryId as any,
        status: newStatus});
      toast.success('Status updated successfully');
      setShowActionMenu(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (inquiryId: string, userId: string) => {
    try {
      await assignInquiry({
        userId: user?.id as any,
        inquiryId: inquiryId as any,
        assignedTo: userId as any});
      toast.success('Inquiry assigned successfully');
      setShowActionMenu(null);
    } catch (error) {
      toast.error('Failed to assign inquiry');
    }
  };

  const InquiryCard = ({ inquiry }: { inquiry: any }) => {
    const statusConfig = STATUS_CONFIG[inquiry.status as InquiryStatus];
    const StatusIcon = statusConfig.icon;
    const assignedUser = users?.find(u => u._id === inquiry.assignedTo);

    return (
      <div
        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden"
        onClick={() => setSelectedInquiry(inquiry._id)}
      >
        {/* Status Bar */}
        <div className={`h-1.5 ${statusConfig.bgColor.replace('bg-', 'bg-').replace('-50', '-600')}`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig.bgColor}`}>
                <MessageSquare className={`h-5 w-5 ${statusConfig.textColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {inquiry.submitterName || inquiry.submitterEmail || 'Unknown'}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{inquiry.formName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Assigned User */}
              {assignedUser && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {assignedUser.firstName?.[0] || assignedUser.email[0]}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">{assignedUser.firstName || assignedUser.email}</span>
                </div>
              )}

              <span className="text-xs text-slate-400">
                {formatDistanceToNow(inquiry.submittedAt)}
              </span>
            </div>
          </div>

          {/* Vehicle Context (if applicable) */}
          {inquiry.vehicleName && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Vehicle Inquiry</p>
              <p className="text-sm font-medium text-slate-900">{inquiry.vehicleName}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="flex flex-wrap gap-2 mb-3">
            {inquiry.submitterEmail && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">{inquiry.submitterEmail}</span>
              </div>
            )}
            {inquiry.submitterPhone && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">{inquiry.submitterPhone}</span>
              </div>
            )}
          </div>

          {/* Message Preview */}
          {inquiry.data.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 mb-3">
              <div className="space-y-1">
                {inquiry.data.slice(0, 3).map((field: any) => (
                  <div key={field.fieldId} className="flex items-start gap-2">
                    <span className="text-xs text-slate-500 min-w-fit">{field.fieldLabel}:</span>
                    <span className="text-xs text-slate-900 break-all">{field.value}</span>
                  </div>
                ))}
                {inquiry.data.length > 3 && (
                  <p className="text-xs text-slate-400 italic">
                    +{inquiry.data.length - 3} more fields
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {new Date(inquiry.submittedAt).toLocaleDateString()} at {new Date(inquiry.submittedAt).toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-2">
              {inquiry.emailSent ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Email sent
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  Pending email
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InquiryDetailModal = () => {
    if (!selectedInquiry) return null;

    const inquiry = allInquiries?.find(i => i._id === selectedInquiry);
    if (!inquiry) return null;

    const statusConfig = STATUS_CONFIG[inquiry.status as InquiryStatus];
    const StatusIcon = statusConfig.icon;
    const assignedUser = users?.find(u => u._id === inquiry.assignedTo);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={() => setSelectedInquiry(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b border-slate-200 ${statusConfig.bgColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-lg`}>
                  <StatusIcon className={`h-6 w-6 ${statusConfig.textColor}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {inquiry.submitterName || inquiry.submitterEmail || 'Unknown'}
                  </h2>
                  <p className="text-sm text-slate-600">{inquiry.formName} • {inquiry.vehicleName || 'General Inquiry'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={inquiry.status}
                    onChange={(e) => handleStatusChange(inquiry._id, e.target.value as InquiryStatus)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign To */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
                  <select
                    value={inquiry.assignedTo || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssign(inquiry._id, e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Unassigned</option>
                    {users?.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    {inquiry.submitterEmail && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <Mail className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-medium text-slate-900">{inquiry.submitterEmail}</p>
                        </div>
                      </div>
                    )}
                    {inquiry.submitterPhone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <Phone className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Phone</p>
                          <p className="text-sm font-medium text-slate-900">{inquiry.submitterPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Submitted</span>
                      <span className="text-slate-900">{formatDistanceToNow(inquiry.submittedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Email Status</span>
                      <span className={inquiry.emailSent ? 'text-emerald-600' : 'text-slate-600'}>
                        {inquiry.emailSent ? 'Sent' : 'Pending'}
                      </span>
                    </div>
                    {inquiry.sourcePage && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Source</span>
                        <span className="text-slate-900 text-right max-w-[200px] truncate">{inquiry.sourcePage}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Submission Data</h3>
                <div className="space-y-3">
                  {inquiry.data.map((field: any) => (
                    <div key={field.fieldId} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">{field.fieldLabel}</p>
                      <p className="text-sm text-slate-900 break-all">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <a
                href={`mailto:${inquiry.submitterEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Reply via Email
              </a>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-rose-600 to-rose-700 rounded-lg hover:from-rose-700 hover:to-rose-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link
              href="/companies"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Companies
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              href={`/companies/${companyId}/manage`}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              {company.name}
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Inquiries</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/20">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Inquiries
                  </h1>
                  <p className="text-slate-600 text-base">
                    Manage form submissions and customer inquiries
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{inquiryStats?.total || 0}</p>
                  <p className="text-sm text-slate-500">Total Inquiries</p>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{inquiryStats?.new || 0}</p>
                  <p className="text-sm text-slate-500">New</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as InquiryStatus | 'all')}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="all">All Statuses</option>
                {STATUSES.map(status => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Inquiries Grid */}
        {filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Inquiries Found</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'When customers submit forms on your website, inquiries will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInquiries.map((inquiry) => (
              <InquiryCard key={inquiry._id} inquiry={inquiry} />
            ))}
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      <InquiryDetailModal />
    </div>
  );
}
