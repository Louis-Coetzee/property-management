'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import { Id } from '@/convex/_generated/dataModel';
import {
  Plus,
  Mail,
  Phone,
  MapPin,
  Truck,
  X,
  ChevronRight,
  Search,
  User,
  Edit2,
  Trash2,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Supplier {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  taxNumber?: string;
  notes?: string;
  category?: string;
  isActive?: boolean;
  createdAt: number;
}

export default function SuppliersPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const domain = params.domain as string;
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    taxNumber: '',
    notes: '',
    category: '',
    isActive: true,
  });

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const suppliersData = useQuery(
    api.suppliers.getSuppliersByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const createSupplier = useMutation(api.suppliers.createSupplier);
  const updateSupplier = useMutation(api.suppliers.updateSupplier);
  const deleteSupplier = useMutation(api.suppliers.deleteSupplier);

  const suppliers: Supplier[] = (suppliersData || []) as Supplier[];

  const categories = Array.from(new Set(suppliers.map(s => s.category).filter(Boolean)));

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = searchQuery === '' ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.category && supplier.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || supplier.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: '',
      taxNumber: '',
      notes: '',
      category: '',
      isActive: true,
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      contactPerson: supplier.contactPerson || '',
      address: supplier.address || '',
      city: supplier.city || '',
      province: supplier.province || '',
      postalCode: supplier.postalCode || '',
      country: supplier.country || '',
      taxNumber: supplier.taxNumber || '',
      notes: supplier.notes || '',
      category: supplier.category || '',
      isActive: supplier.isActive !== undefined ? supplier.isActive : true,
    });
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    if (!user?.id || !companyId) return;
    setIsSubmitting(true);

    try {
      if (isEdit && selectedSupplier) {
        await updateSupplier({
          userId: user.id as Id<'users'>,
          supplierId: selectedSupplier._id as Id<'suppliers'>,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          contactPerson: formData.contactPerson || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          taxNumber: formData.taxNumber || undefined,
          notes: formData.notes || undefined,
          category: formData.category || undefined,
          isActive: formData.isActive,
        });
        toast.success('Supplier updated successfully');
      } else {
        await createSupplier({
          userId: user.id as Id<'users'>,
          companyId: companyId as Id<'companies'>,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          contactPerson: formData.contactPerson || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          taxNumber: formData.taxNumber || undefined,
          notes: formData.notes || undefined,
          category: formData.category || undefined,
          isActive: formData.isActive,
        });
        toast.success('Supplier added successfully');
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedSupplier(null);
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !supplierToDelete) return;
    setIsSubmitting(true);

    try {
      await deleteSupplier({
        userId: user.id as Id<'users'>,
        supplierId: supplierToDelete._id as Id<'suppliers'>,
      });
      toast.success('Supplier deleted successfully');
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <Link href={`/companies`} className="text-slate-500 hover:text-slate-700 whitespace-nowrap">Companies</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 whitespace-nowrap">{company?.name || 'Company'}</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 whitespace-nowrap">CRM</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Suppliers</span>
          </div>

          <div className="flex items-center justify-between gap-4 pb-6">
            <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
            <div className="flex items-center gap-3">
              <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all"
              >
                <Plus className="h-5 w-5" />
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {filteredSuppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier._id}
                className="p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{supplier.name}</h3>
                      {supplier.category && (
                        <span className="text-xs text-slate-500">{supplier.category}</span>
                      )}
                    </div>
                  </div>
                  {!supplier.isActive && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  {supplier.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {supplier.email}
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {supplier.phone}
                    </p>
                  )}
                  {(supplier.city || supplier.province) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[supplier.city, supplier.province].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { setSupplierToDelete(supplier); setShowDeleteModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No suppliers yet</h3>
            <p className="text-slate-500 mb-4">Start managing your suppliers</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700"
            >
              <Plus className="h-5 w-5" />
              Add First Supplier
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{showAddModal ? 'Add Supplier' : 'Edit Supplier'}</h3>
                  <p className="text-xs text-white/80 mt-1">Manage supplier details</p>
                </div>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="ABC Suppliers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. Parts, Services"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="supplier@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="+27 82 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Johannesburg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Gauteng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="2000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tax Number</label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="VAT/TAX Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">Active supplier</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(showEditModal)}
                  disabled={isSubmitting || !formData.name}
                  className="px-5 py-3 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : showEditModal ? 'Update' : 'Add Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && supplierToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Supplier</h3>
            <p className="text-slate-600 text-center mb-6">Are you sure you want to delete <span className="font-semibold">{supplierToDelete.name}</span>?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSupplierToDelete(null); }}
                className="flex-1 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NavigationSideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        companyId={companyId}
        companyName={company?.name || ''}
        enabledApps={company?.enabledApps}
      />
    </div>
  );
}