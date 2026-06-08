'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  Package,
  AlertTriangle,
  BarChart3,
  PackageSearch} from 'lucide-react';

interface Part {
  _id: string;
  partNumber: string;
  name: string;
  category: string;
  manufacturer: string;
  sku: string;
  description: string;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  location: string;
  supplier: string;
  supplierContact: string;
  reorderPoint: number;
  lastRestocked: string;
  isActive: boolean;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Engine': { bg: 'bg-red-100', text: 'text-red-700' },
  'Transmission': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Brakes': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Electrical': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Suspension': { bg: 'bg-green-100', text: 'text-green-700' },
  'Exhaust': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Body': { bg: 'bg-pink-100', text: 'text-pink-700' },
  'Interior': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Tires': { bg: 'bg-slate-100', text: 'text-slate-700' },
  'Other': { bg: 'bg-gray-100', text: 'text-gray-700' }};

export default function PartsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Mock parts data
  const [parts, setParts] = useState<Part[]>([
    {
      _id: '1',
      partNumber: 'ENG-001',
      name: 'V6 Engine Oil Filter',
      category: 'Engine',
      manufacturer: 'Bosch',
      sku: 'BOS-FLTR-001',
      description: 'High-quality oil filter for V6 engines',
      unitPrice: 89.99,
      stockQuantity: 45,
      minStockLevel: 10,
      maxStockLevel: 100,
      location: 'Aisle 1, Shelf 3',
      supplier: 'AutoParts SA',
      supplierContact: 'orders@autoparts.co.za',
      reorderPoint: 15,
      lastRestocked: '2025-01-15',
      isActive: true},
    {
      _id: '2',
      partNumber: 'BRK-002',
      name: 'Ceramic Brake Pads - Front',
      category: 'Brakes',
      manufacturer: 'Brembo',
      sku: 'BRE-CBRK-F',
      description: 'Premium ceramic brake pads for front wheels',
      unitPrice: 349.99,
      stockQuantity: 8,
      minStockLevel: 20,
      maxStockLevel: 50,
      location: 'Aisle 2, Shelf 1',
      supplier: 'BrakeTech Distributors',
      supplierContact: 'sales@braketech.co.za',
      reorderPoint: 20,
      lastRestocked: '2025-01-20',
      isActive: true},
    {
      _id: '3',
      partNumber: 'TRN-003',
      name: 'Automatic Transmission Fluid',
      category: 'Transmission',
      manufacturer: 'Castrol',
      sku: 'CAS-ATF-5L',
      description: 'Synthetic transmission fluid, 5 liter',
      unitPrice: 189.99,
      stockQuantity: 3,
      minStockLevel: 12,
      maxStockLevel: 30,
      location: 'Aisle 1, Shelf 5',
      supplier: 'Lubricants Inc',
      supplierContact: 'orders@lubricants.co.za',
      reorderPoint: 12,
      lastRestocked: '2025-01-10',
      isActive: true},
    {
      _id: '4',
      partNumber: 'ELS-004',
      name: 'LED Headlight Assembly',
      category: 'Electrical',
      manufacturer: 'Philips',
      sku: 'PHL-LED-HL',
      description: 'LED headlight assembly with DRL',
      unitPrice: 1299.99,
      stockQuantity: 15,
      minStockLevel: 5,
      maxStockLevel: 20,
      location: 'Aisle 3, Shelf 2',
      supplier: 'Lighting Solutions',
      supplierContact: 'info@lighting.co.za',
      reorderPoint: 5,
      lastRestocked: '2025-02-01',
      isActive: true},
    {
      _id: '5',
      partNumber: 'SUS-005',
      name: 'Shock Absorber - Rear',
      category: 'Suspension',
      manufacturer: 'Monroe',
      sku: 'MON-SHOCK-R',
      description: 'Gas shock absorber for rear axle',
      unitPrice: 549.99,
      stockQuantity: 22,
      minStockLevel: 8,
      maxStockLevel: 40,
      location: 'Aisle 2, Shelf 4',
      supplier: 'Suspension Pros',
      supplierContact: 'orders@suspension.co.za',
      reorderPoint: 10,
      lastRestocked: '2025-01-25',
      isActive: true},
  ]);

  const categories = ['all', ...Array.from(new Set(parts.map(p => p.category)))];

  // Filter parts
  const filteredParts = parts.filter(part => {
    const matchesSearch = searchQuery === '' ||
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || part.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalParts = parts.length;
  const lowStockCount = parts.filter(p => p.stockQuantity <= p.minStockLevel).length;
  const outOfStockCount = parts.filter(p => p.stockQuantity === 0).length;
  const totalValue = parts.reduce((sum, p) => sum + (p.unitPrice * p.stockQuantity), 0);

  const formatCurrency = (value: number) => {
    const currencyCode = company?.currency?.code || 'ZAR';
    const currencySymbol = company?.currency?.symbol || (currencyCode === 'ZAR' ? 'R' : '$');
    const symbolPosition = company?.currency?.symbolPosition || 'before';
    
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
    
    if (symbolPosition === 'after') {
      return value.toFixed(0) + ' ' + currencySymbol;
    }
    return formatted;
  };

  const getStockStatus = (part: Part) => {
    if (part.stockQuantity === 0) return { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-100' };
    if (part.stockQuantity <= part.minStockLevel) return { label: 'Low Stock', color: 'text-amber-700', bg: 'bg-amber-100' };
    return { label: 'In Stock', color: 'text-emerald-700', bg: 'bg-emerald-100' };
  };

  const handleDeletePart = async () => {
    if (!selectedPart) return;
    setIsSubmitting(true);
    try {
      setParts(parts.filter(p => p._id !== selectedPart._id));
      setShowDeleteModal(false);
      setSelectedPart(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Companies
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              {company.name}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              CRM
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Parts</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Wrench className="h-7 w-7 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-[#00072e] tracking-tight">
                    Parts
                  </h1>
                  <p className="text-slate-600 text-base">
                    Manage parts, suppliers, and stock levels
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 md:gap-4">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00072e] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-[#00072e]/20 md:w-auto w-full"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Part</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 mb-6">
          <input
            type="text"
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="py-[22px] px-5 bg-white rounded-xl border-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900">{totalParts}</p>
                <p className="text-xs text-slate-500 truncate">Total Parts</p>
              </div>
            </div>
          </div>
          <div className="py-[22px] px-5 bg-white rounded-xl border-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900">{lowStockCount}</p>
                <p className="text-xs text-slate-500 truncate">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="py-[22px] px-5 bg-white rounded-xl border-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                <PackageSearch className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900">{outOfStockCount}</p>
                <p className="text-xs text-slate-500 truncate">Out of Stock</p>
              </div>
            </div>
          </div>
          <div className="py-[22px] px-5 bg-white rounded-xl border-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-slate-500 truncate">Inventory Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-900 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Parts Grid */}
        {filteredParts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredParts.map((part) => {
              const stockStatus = getStockStatus(part);
              const categoryColor = categoryColors[part.category] || categoryColors['Other'];

              return (
                <div
                  key={part._id}
                  className="py-[22px] px-5 bg-white rounded-xl border-2 border-slate-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-3">
                    <Package className="h-5 w-5 text-amber-600" />
                  </div>

                  {/* Part Info */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {part.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor.bg} ${categoryColor.text}`}>
                        {part.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{part.partNumber}</p>
                    <p className="text-xs text-slate-400">SKU: {part.sku}</p>
                  </div>

                  {/* Stock & Price */}
                  <div className="flex flex-col gap-2 text-xs text-slate-600 mb-3">
                    <div className="flex items-center justify-between">
                      <span>Stock: {part.stockQuantity}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Price:</span>
                      <span className="font-semibold text-amber-600">{formatCurrency(part.unitPrice)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => { setSelectedPart(part); setShowEditModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => { setSelectedPart(part); setShowDeleteModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="col-span-full py-16 px-5 bg-white rounded-xl border-2 border-slate-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {searchQuery || filterCategory !== 'all' ? 'No parts found' : 'No parts yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery || filterCategory !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Get started by adding your first part'}
            </p>
            {!searchQuery && filterCategory === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00072e] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add First Part
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPart && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Part?</h3>
              <p className="text-slate-600 text-center mb-5">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedPart.name}</span>?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-5">
                <p className="text-sm text-red-800">
                  This action cannot be undone. The part will be permanently removed.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPart(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePart}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side Sheet Overlay */}
      {isSideSheetOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsSideSheetOpen(false)}
        />
      )}

      {/* Navigation Side Sheet */}
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
