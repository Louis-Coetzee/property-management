'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  DollarSign,
  Clock,
  Tag,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  isActive: boolean;
}

interface ImportService {
  name: string;
  description?: string;
  category?: string;
  price: number | string;
  duration?: number | string;
  isActive?: boolean | string;
  _originalIndex?: number;
}

interface ValidationResult {
  valid: ImportService[];
  duplicates: Array<{ index: number; name: string }>;
}

const initialFormData: ServiceFormData = {
  name: '',
  description: '',
  category: '',
  price: '',
  duration: '',
  isActive: true,
};

export default function ServicesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportService[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedImports, setSelectedImports] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'validation' | 'importing'>('upload');

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query services
  const services = useQuery(
    api.services.getServicesByCompany,
    companyId ? { companyId: companyId as any } : "skip"
  );

  // Mutations
  const createService = useMutation(api.services.createService);
  const updateService = useMutation(api.services.updateService);
  const deleteService = useMutation(api.services.deleteService);
  const toggleService = useMutation(api.services.toggleService);

  // Get unique categories from services
  const categories = services
    ? [...new Set(services.filter(s => s.category).map(s => s.category))]
    : [];

  // Filter services
  const filteredServices = services?.filter(service => {
    const matchesSearch = searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;

    return matchesSearch && matchesCategory;
  }) || [];

  const formatCurrency = (value: number) => {
    const currencyCode = company?.currency?.code || 'ZAR';
    const currencySymbol = company?.currency?.symbol || (currencyCode === 'ZAR' ? 'R' : '$');
    const symbolPosition = company?.currency?.symbolPosition || 'before';
    
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    if (symbolPosition === 'after') {
      return value.toFixed(2) + ' ' + currencySymbol;
    }
    return formatted;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
  };

  // ==================== IMPORT/EXPORT FUNCTIONS ====================

  // Generate sample data for CSV/Excel template
  const generateSampleData = () => {
    return [
      {
        name: 'Basic Consultation',
        description: 'One-hour consultation session to discuss your needs',
        category: 'Consulting',
        price: 500,
        duration: 60,
        isActive: true,
      },
      {
        name: 'Premium Support Package',
        description: 'Monthly support package with priority response',
        category: 'Support',
        price: 2500,
        duration: null,
        isActive: true,
      },
      {
        name: 'Equipment Maintenance',
        description: 'Regular maintenance service for equipment',
        category: 'Maintenance',
        price: 750,
        duration: 90,
        isActive: true,
      },
    ];
  };

  // Download sample CSV/Excel file
  const downloadSample = (format: 'csv' | 'excel') => {
    const sampleData = generateSampleData();

    if (format === 'csv') {
      const csv = Papa.unparse(sampleData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'services_sample.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Services');
      XLSX.writeFile(wb, 'services_sample.xlsx');
    }

    toast.success(`Sample ${format.toUpperCase()} file downloaded`);
  };

  // Export services to CSV/Excel
  const exportServices = (format: 'csv' | 'excel') => {
    if (!services || services.length === 0) {
      toast.error('No services to export');
      return;
    }

    const exportData = services.map(s => ({
      name: s.name,
      description: s.description || '',
      category: s.category || '',
      price: s.price,
      duration: s.duration || '',
      isActive: s.isActive,
    }));

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `services_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Services');
      XLSX.writeFile(wb, `services_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    toast.success(`${services.length} service(s) exported to ${format.toUpperCase()}`);
  };

  // Handle file selection for import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select a valid CSV or Excel file');
      return;
    }

    setImportFile(file);
    setImportErrors([]);

    // Parse file
    let parsedData: ImportService[] = [];
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          parsedData = results.data as ImportService[];
          validateAndPreviewImport(parsedData);
        },
        error: (error) => {
          toast.error('Error parsing CSV file');
          console.error(error);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          validateAndPreviewImport(parsedData);
        } catch (error) {
          toast.error('Error parsing Excel file');
          console.error(error);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Validate import data
  const validateAndPreviewImport = (data: ImportService[]) => {
    if (!data || data.length === 0) {
      toast.error('No data found in file');
      return;
    }

    setImportPreview(data);
    setIsImporting(true);

    try {
      const valid: ImportService[] = [];
      const duplicates: Array<{ index: number; name: string }> = [];
      const errors: string[] = [];

      // Check existing services for duplicates
      const existingNames = (services || []).map(s => s.name?.trim().toLowerCase());

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        // Validate required fields
        if (!row.name || !row.name.trim()) {
          errors.push(`Row ${rowNumber}: Missing service name`);
          continue;
        }

        const name = row.name.trim();

        // Check for duplicates
        if (existingNames.includes(name.toLowerCase())) {
          duplicates.push({ index: i, name: name });
          errors.push(`Row ${rowNumber}: Service "${name}" already exists`);
          continue;
        }

        // Validate price
        const price = Number(row.price);
        if (isNaN(price) || price < 0) {
          errors.push(`Row ${rowNumber}: Invalid price for "${name}"`);
          continue;
        }

        valid.push({ ...row, _originalIndex: i });
      }

      setValidationResult({ valid, duplicates });
      setSelectedImports(new Set(valid.map((_, idx) => idx)));

      if (errors.length > 0) {
        setImportErrors(errors);
      }

      setImportStep('validation');
    } catch (error) {
      console.error('Error validating import:', error);
      toast.error('Error validating import data');
    } finally {
      setIsImporting(false);
    }
  };

  // Process and import services
  const processImport = async () => {
    if (!validationResult) {
      toast.error('Please validate the data first');
      return;
    }

    const { valid } = validationResult;

    // Get selected items
    const itemsToImport = selectedImports.size > 0
      ? valid.filter((_, idx) => selectedImports.has(idx))
      : valid;

    if (itemsToImport.length === 0) {
      toast.error('No services selected for import');
      return;
    }

    setIsImporting(true);
    setImportStep('importing');
    setImportErrors([]);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < itemsToImport.length; i++) {
      const row = itemsToImport[i];
      const originalIndex = (row as any)._originalIndex ?? i;

      try {
        const price = Number(row.price);
        const duration = row.duration ? Number(row.duration) : undefined;

        // Parse isActive - handle various formats
        let isActive = true;
        if (row.isActive !== undefined) {
          if (typeof row.isActive === 'string') {
            isActive = row.isActive.toLowerCase() === 'true' || row.isActive === '1' || row.isActive.toLowerCase() === 'yes';
          } else {
            isActive = Boolean(row.isActive);
          }
        }

        await createService({
          companyId: companyId as any,
          name: row.name.trim(),
          description: row.description?.trim() || undefined,
          category: row.category?.trim() || undefined,
          price: price,
          duration: duration && !isNaN(duration) ? duration : undefined,
          isActive: isActive,
        });

        successCount++;
      } catch (error: any) {
        errors.push(`Row ${originalIndex + 1}: ${error.message || 'Failed to import service'}`);
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} service(s) imported successfully`);
    }

    if (errors.length > 0) {
      setImportErrors(errors);
      toast.error(`${errors.length} service(s) failed to import`);
    }

    if (successCount > 0 && errors.length === 0) {
      setShowImportModal(false);
      resetImportState();
    }
  };

  // Reset import state
  const resetImportState = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setValidationResult(null);
    setSelectedImports(new Set());
    setImportStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle import selection
  const toggleImportSelection = (index: number) => {
    setSelectedImports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Select all imports
  const selectAllImports = () => {
    if (validationResult) {
      setSelectedImports(new Set(validationResult.valid.map((_, idx) => idx)));
    }
  };

  // Deselect all imports
  const deselectAllImports = () => {
    setSelectedImports(new Set());
  };

  // ==================== CRUD FUNCTIONS ====================

  const handleCreateService = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await createService({
        companyId: companyId as any,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        price: parseFloat(formData.price) || 0,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        isActive: formData.isActive,
      });

      toast.success('Service created successfully');
      setShowAddModal(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedServiceId || !formData.name.trim() || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateService({
        serviceId: selectedServiceId as any,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        price: parseFloat(formData.price) || 0,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        isActive: formData.isActive,
      });

      toast.success('Service updated successfully');
      setShowEditModal(false);
      setSelectedServiceId(null);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    setIsSubmitting(true);
    try {
      if (selectedServiceIds.size > 0) {
        const deletePromises = Array.from(selectedServiceIds).map(serviceId =>
          deleteService({ serviceId: serviceId as any })
        );
        await Promise.all(deletePromises);
        toast.success(`${selectedServiceIds.size} service(s) deleted successfully`);
        setSelectedServiceIds(new Set());
        setShowBulkDeleteModal(false);
      } else if (selectedServiceId) {
        await deleteService({
          serviceId: selectedServiceId as any,
        });
        toast.success('Service deleted successfully');
        setShowDeleteModal(false);
        setSelectedServiceId(null);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedServiceIds.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleToggleService = async (serviceId: string, currentStatus: boolean) => {
    try {
      await toggleService({
        serviceId: serviceId as any,
      });

      toast.success(currentStatus ? 'Service disabled' : 'Service enabled');
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('Failed to update service status');
    }
  };

  const openEditModal = (service: any) => {
    setSelectedServiceId(service._id);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category || '',
      price: service.price.toString(),
      duration: service.duration?.toString() || '',
      isActive: service.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">Companies</a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">{company.name}</a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">CRM</a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Services</span>
          </div>

          {/* Title Section */}
          <div className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Services</h1>
                  <p className="text-slate-600 text-sm sm:text-base">Manage your service offerings</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-2">
                  {/* Import Button */}
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Import</span>
                  </button>

                  {/* Export Dropdown */}
                  <div className="relative group">
                    <button className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm text-sm">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={() => exportServices('csv')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-xl"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => exportServices('excel')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-b-xl"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                        Export as Excel
                      </button>
                    </div>
                  </div>

                  {/* Sample Dropdown */}
                  <div className="relative group">
                    <button className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm text-sm">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Sample</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={() => downloadSample('csv')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-xl"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                        Download CSV Sample
                      </button>
                      <button
                        onClick={() => downloadSample('excel')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-b-xl"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                        Download Excel Sample
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFormData(initialFormData);
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Service</span>
                </button>
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-slate-900 min-w-[150px]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedServiceIds.size > 0 && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center justify-between mb-4">
            <span className="text-sm font-medium">{selectedServiceIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedServiceIds(new Set())}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Services List */}
        {services === undefined ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const isSelected = selectedServiceIds.has(service._id);
              return (
              <div
                key={service._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg relative ${
                  isSelected
                    ? 'ring-2 ring-slate-800 ring-offset-2'
                    : service.isActive
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Selection Checkbox */}
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleServiceSelection(service._id); }}
                  className="absolute top-3 left-3 z-10 cursor-pointer"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-slate-800'
                      : 'bg-white border-slate-300 group-hover:border-slate-400'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${service.isActive ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-300'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{service.name}</h3>
                      {service.category && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 mt-1">
                          <Tag className="h-3 w-3" />
                          {service.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                        title="Edit service"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(service._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{service.description}</p>
                  )}

                  {/* Price and Duration */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(service.price)}</span>
                    </div>
                    {service.duration && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(service.duration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className={`text-xs font-medium ${service.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleToggleService(service._id, service.isActive)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        service.isActive ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                        service.isActive ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery || categoryFilter !== 'all' ? 'No services found' : 'No services yet'}
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search terms or filters'
                : 'Get started by adding your first service offering or import from a file'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setFormData(initialFormData);
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200"
                >
                  <Upload className="h-4 w-4" />
                  Import Services
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col my-0 sm:my-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Import Services</h3>
                    <p className="text-xs sm:text-sm text-white/80">Bulk import from CSV or Excel</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    resetImportState();
                  }}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {/* File Upload */}
              {importStep === 'upload' && importPreview.length === 0 ? (
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-3">
                      Select File (CSV or Excel)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center hover:border-slate-400 transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        className="hidden"
                        id="import-file-input"
                      />
                      <label
                        htmlFor="import-file-input"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600" />
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-slate-500 mb-4">CSV or Excel files only</p>
                        <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium rounded-xl hover:from-slate-900 hover:to-slate-950 transition-all shadow-lg text-sm">
                          <Upload className="h-4 w-4" />
                          Browse Files
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      File Requirements
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Required fields: <strong>name</strong>, <strong>price</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Optional fields: description, category, duration, isActive</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Duration should be in minutes (e.g., 60 for 1 hour)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>isActive can be: true/false, yes/no, or 1/0</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Download sample template below to see format</span>
                      </li>
                    </ul>
                  </div>

                  {/* Download Sample Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => downloadSample('csv')}
                      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                      Download CSV Sample
                    </button>
                    <button
                      onClick={() => downloadSample('excel')}
                      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      Download Excel Sample
                    </button>
                  </div>
                </div>
              ) : importStep === 'validation' && validationResult ? (
                /* Validation Results */
                <div className="space-y-4 sm:space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Valid Count */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                          <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{validationResult.valid.length}</p>
                          <p className="text-xs sm:text-sm font-medium text-emerald-600">Valid Services</p>
                        </div>
                      </div>
                    </div>

                    {/* Duplicates Count */}
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-xl flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-red-700">{validationResult.duplicates.length}</p>
                          <p className="text-xs sm:text-sm font-medium text-red-600">Duplicates</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selection Actions */}
                  {validationResult.valid.length > 0 && (
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <span className="text-sm text-slate-600">
                        {selectedImports.size} of {validationResult.valid.length} selected
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectAllImports}
                          className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={deselectAllImports}
                          className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Valid Services List */}
                  {validationResult.valid.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Valid Services to Import</h4>
                      <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {validationResult.valid.map((service, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                          >
                            <button
                              onClick={() => toggleImportSelection(idx)}
                              className="flex-shrink-0"
                            >
                              {selectedImports.has(idx) ? (
                                <CheckSquare className="h-5 w-5 text-slate-900" />
                              ) : (
                                <Square className="h-5 w-5 text-slate-300" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{service.name}</p>
                              <p className="text-xs text-slate-500">
                                {service.category && `${service.category} • `}
                                {formatCurrency(Number(service.price))}
                                {service.duration && ` • ${formatDuration(Number(service.duration))}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {importErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Import Issues ({importErrors.length})
                      </h4>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {importErrors.map((error, idx) => (
                          <li key={idx} className="text-sm text-red-700">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setImportPreview([]);
                        setValidationResult(null);
                        setImportErrors([]);
                        setImportStep('upload');
                      }}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={processImport}
                      disabled={selectedImports.size === 0 || isImporting}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                    >
                      {isImporting ? 'Importing...' : `Import ${selectedImports.size} Service${selectedImports.size !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              ) : (
                /* Importing State */
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                  <p className="text-slate-600 font-medium">Importing services...</p>
                  <p className="text-sm text-slate-500 mt-1">Please wait while we process your data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Add Service</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(initialFormData);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic Consultation"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this service includes..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Price (ZAR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Duration (min) <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 60"
                    min="1"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Category <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Consulting, Maintenance, Support"
                  maxLength={50}
                  list="categories-list"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {categories.length > 0 && (
                  <datalist id="categories-list">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Active</label>
                  <p className="text-xs text-slate-500 mt-0.5">Make this service available</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    formData.isActive ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    formData.isActive ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(initialFormData);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateService}
                disabled={!formData.name.trim() || !formData.price || isSubmitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                {isSubmitting ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Edit2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Service</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedServiceId(null);
                  setFormData(initialFormData);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic Consultation"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this service includes..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Price (ZAR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Duration (min) <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 60"
                    min="1"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Category <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Consulting, Maintenance, Support"
                  maxLength={50}
                  list="categories-list-edit"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {categories.length > 0 && (
                  <datalist id="categories-list-edit">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Active</label>
                  <p className="text-xs text-slate-500 mt-0.5">Make this service available</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    formData.isActive ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    formData.isActive ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedServiceId(null);
                  setFormData(initialFormData);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateService}
                disabled={!formData.name.trim() || !formData.price || isSubmitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                {isSubmitting ? 'Updating...' : 'Update Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Service</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedServiceId(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  Are you sure you want to delete this service? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedServiceId(null);
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Services</h3>
              </div>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold">{selectedServiceIds.size} services</span>? This will permanently remove them from your catalog.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
                >
                  {isSubmitting ? 'Deleting...' : `Delete ${selectedServiceIds.size} Service(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
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
