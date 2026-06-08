'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  Filter,
  Check,
  AlertCircle,
  Upload,
  XCircle,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Settings,
  Box,
  Ruler,
  Palette,
  Layers,
  Star,
  MapPin,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import MediaLibraryModal from '@/components/media-library-modal';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';

// Custom validator for optional number fields
const optionalNumber = () =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  );

// Step-specific schemas
const step1Schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  reference: z.string().optional(),
  sku: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

const step2Schema = z.object({
  price: optionalNumber(),
  discountedPrice: optionalNumber(),
  cost: optionalNumber(),
  stockQuantity: optionalNumber(),
  lowStockThreshold: optionalNumber(),
});

const step3Schema = z.object({
  images: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
});

const step4Schema = z.object({
  status: z.enum(['draft', 'available', 'out_of_stock', 'discontinued']),
  isActive: z.boolean(),
  features: z.string().optional(),
  tags: z.string().optional(),
  weight: optionalNumber(),
  color: z.string().optional(),
  material: z.string().optional(),
  size: z.string().optional(),
  length: optionalNumber(),
  width: optionalNumber(),
  height: optionalNumber(),
});

// Combined schema
const productFormSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

type ProductFormData = {
  name: string;
  description?: string;
  reference?: string;
  sku?: string;
  categories?: string[];
  price: any;
  discountedPrice: any;
  cost: any;
  stockQuantity: any;
  lowStockThreshold: any;
  images?: any;
  coverImage?: string;
  status: 'draft' | 'available' | 'out_of_stock' | 'discontinued';
  isActive: boolean;
  features?: string;
  tags?: string;
  weight: any;
  color?: string;
  material?: string;
  size?: string;
  length: any;
  width: any;
  height: any;
  showSpecifications?: boolean;
};

interface Product {
  _id: string;
  name: string;
  description?: string;
  reference: string;
  sku?: string;
  categories?: string[];
  price: number;
  discountedPrice?: number;
  cost?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  status: string;
  isActive: boolean;
  images?: string[];
  featuredImage?: string;
  coverImage?: string;
  specifications?: {
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit?: string;
    };
    color?: string;
    material?: string;
    size?: string;
  };
  // BobGo pickup location fields
  features?: string[];
  tags?: string[];
  viewsCount?: number;
  purchaseCount?: number;
  showSpecifications?: boolean;
  createdAt: number;
  updatedAt: number;
}

const statuses = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  { value: 'available', label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-amber-100 text-amber-700' },
  { value: 'discontinued', label: 'Discontinued', color: 'bg-red-100 text-red-700' },
];

// Step configuration
const steps = [
  { id: 1, title: 'Basic Info', icon: Package, description: 'Product details & category' },
  { id: 2, title: 'Price & Stock', icon: DollarSign, description: 'Pricing & inventory' },
  { id: 3, title: 'Images', icon: ImageIcon, description: 'Photos & media' },
  { id: 4, title: 'Listing', icon: Tag, description: 'Status & features' },
];

export default function ProductsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );
  
  // Get currency symbol from company settings
  const currencySymbol = company?.currency?.customSymbol || company?.currency?.symbol || 'R';

  // Query products
  const products = useQuery(api.products.getProductsByCompany, {
    userId: user?.id as any,
    companyId: companyId as any,
  });

  // Mutations
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const toggleProductStatus = useMutation(api.products.toggleProductStatus);
  const updateProductStatus = useMutation(api.products.updateProductStatus);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioningToFinal, setIsTransitioningToFinal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'validation' | 'review'>('upload');
  const [validationResults, setValidationResults] = useState<{
    valid: any[];
    skuDuplicates: { index: number; sku: string; existingCount: number }[];
    otherDuplicates: Record<string, Array<{ index: number; value: string; name: string }>>;
  } | null>(null);
  const [selectedImports, setSelectedImports] = useState<Set<number>>(new Set());

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      reference: '',
      sku: '',
      categories: [],
      status: 'draft',
      isActive: true,
      features: '',
      tags: '',
      images: [],
      coverImage: '',
      color: '',
      material: '',
      size: '',
    },
    mode: 'onBlur',
  });

  // Filter products
  const filteredProducts = products ? products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.categories && product.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || (product.categories && product.categories.includes(filterCategory));

    return matchesSearch && matchesStatus && matchesCategory;
  }) : [];

  // Get unique categories
  const existingCategories = products
    ? [...new Set(products.flatMap((p: Product) => p.categories || []))]
    : [];

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof ProductFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['name'];
        break;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        fieldsToValidate = ['status', 'isActive'];
        break;
      default:
        return true;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 3) {
        toast('Click "Continue to Final Step" to review and complete your listing', {
          duration: 4000,
          icon: 'ℹ️',
        });
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleContinueToFinalStep = async () => {
    const isValid = await validateStep(3);
    if (isValid) {
      setIsTransitioningToFinal(true);
      setCurrentStep(4);
      setTimeout(() => {
        setIsTransitioningToFinal(false);
      }, 500);
    } else {
      toast.error('Please complete the required fields before continuing');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMediaLibrarySelect = (url: string) => {
    setUploadedImages(prev => [...prev, url]);
    setValue('images', [...uploadedImages, url]);
  };

  const removeImage = (url: string) => {
    const newImages = uploadedImages.filter(img => img !== url);
    setUploadedImages(newImages);
    setValue('images', newImages);
    if (coverImage === url) {
      setCoverImage('');
      setValue('coverImage', '');
    }
  };

  const setAsCover = (url: string) => {
    setCoverImage(url);
    setValue('coverImage', url);
  };

  const addFeature = () => {
    const trimmedFeature = featureInput.trim();
    if (trimmedFeature && !featuresList.includes(trimmedFeature)) {
      setFeaturesList([...featuresList, trimmedFeature]);
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
  };

  const addCategory = () => {
    const trimmedCategory = categoryInput.trim();
    if (trimmedCategory && !selectedCategories.includes(trimmedCategory)) {
      setSelectedCategories([...selectedCategories, trimmedCategory]);
      setCategoryInput('');
    }
  };

  const removeCategory = (index: number) => {
    setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
  };

  const toggleCategorySelection = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const resetModalState = () => {
    setCurrentStep(1);
    setUploadedImages([]);
    setCoverImage('');
    setFeaturesList([]);
    setFeatureInput('');
    setSelectedCategories([]);
    setCategoryInput('');
    reset();
  };

  const handleAddProduct = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      const features = featuresList;
      const tags = data.tags
        ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      const reference = data.reference?.trim() || `PRD-${Date.now().toString(36).toUpperCase()}`;

      const sanitizeNumber = (value: number | undefined): number | undefined => {
        return typeof value === 'number' && !isNaN(value) ? value : undefined;
      };

      const specifications: any = {
        weight: sanitizeNumber(data.weight),
        color: data.color || undefined,
        material: data.material || undefined,
        size: data.size || undefined,
      };

      if (data.length || data.width || data.height) {
        specifications.dimensions = {
          length: sanitizeNumber(data.length),
          width: sanitizeNumber(data.width),
          height: sanitizeNumber(data.height),
        };
      }

      await createProduct({
        userId: user?.id as any,
        companyId: companyId as any,
        name: data.name,
        description: data.description,
        reference: reference,
        sku: data.sku || undefined,
        categories: selectedCategories,
        price: data.price || 0,
        discountedPrice: sanitizeNumber(data.discountedPrice),
        cost: sanitizeNumber(data.cost),
        stockQuantity: sanitizeNumber(data.stockQuantity),
        lowStockThreshold: sanitizeNumber(data.lowStockThreshold),
        status: data.status,
        isActive: data.isActive,
        images: uploadedImages,
        coverImage: coverImage || undefined,
        specifications,
        features,
        tags,
        showSpecifications: data.showSpecifications !== undefined ? data.showSpecifications : true,
      });

      setShowAddModal(false);
      resetModalState();
      toast.success('Product created successfully');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (data: ProductFormData) => {
    if (!selectedProduct) return;

    setIsSubmitting(true);

    try {
      const features = featuresList;
      const tags = data.tags
        ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      const reference = data.reference?.trim() || selectedProduct.reference || `PRD-${Date.now().toString(36).toUpperCase()}`;
      const finalImages = uploadedImages.length > 0 ? uploadedImages : (selectedProduct.images || []);

      const sanitizeNumber = (value: number | undefined): number | undefined => {
        return typeof value === 'number' && !isNaN(value) ? value : undefined;
      };

      const specifications: any = {
        weight: sanitizeNumber(data.weight),
        color: data.color || undefined,
        material: data.material || undefined,
        size: data.size || undefined,
      };

      if (data.length || data.width || data.height) {
        specifications.dimensions = {
          length: sanitizeNumber(data.length),
          width: sanitizeNumber(data.width),
          height: sanitizeNumber(data.height),
        };
      }

      await updateProduct({
        requestingUserId: user?.id as any,
        productId: selectedProduct._id as any,
        name: data.name,
        description: data.description,
        reference: reference,
        sku: data.sku || selectedProduct.sku,
        categories: selectedCategories,
        price: data.price || selectedProduct.price || 0,
        discountedPrice: sanitizeNumber(data.discountedPrice),
        cost: sanitizeNumber(data.cost),
        stockQuantity: sanitizeNumber(data.stockQuantity),
        lowStockThreshold: sanitizeNumber(data.lowStockThreshold),
        status: data.status,
        isActive: data.isActive,
        images: finalImages,
        coverImage: coverImage || selectedProduct.coverImage || undefined,
        specifications,
        features,
        tags,
        showSpecifications: data.showSpecifications,
      });

      setShowEditModal(false);
      setSelectedProduct(null);
      resetModalState();
      toast.success('Product updated successfully');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);

    try {
      await deleteProduct({
        requestingUserId: user?.id as any,
        productId: selectedProduct._id as any,
      });

      setShowDeleteModal(false);
      setSelectedProduct(null);
      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await toggleProductStatus({
        requestingUserId: user?.id as any,
        productId: product._id as any,
      });
      toast.success('Product status updated');
    } catch (error: any) {
      console.error('Error toggling product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setValue('name', product.name);
    setValue('description', product.description || '');
    setValue('reference', product.reference || '');
    setValue('sku', product.sku || '');
    setValue('categories', product.categories || []);
    setValue('price', product.price ?? undefined);
    setValue('discountedPrice', product.discountedPrice ?? undefined);
    setValue('cost', product.cost ?? undefined);
    setValue('stockQuantity', product.stockQuantity ?? undefined);
    setValue('lowStockThreshold', product.lowStockThreshold ?? undefined);
    setValue('status', product.status as any);
    setValue('isActive', product.isActive);
    setValue('weight', product.specifications?.weight ?? undefined);
    setValue('color', product.specifications?.color || '');
    setValue('material', product.specifications?.material || '');
    setValue('size', product.specifications?.size || '');
    setValue('length', product.specifications?.dimensions?.length ?? undefined);
    setValue('width', product.specifications?.dimensions?.width ?? undefined);
    setValue('height', product.specifications?.dimensions?.height ?? undefined);
    setFeaturesList(product.features || []);
    setValue('tags', product.tags?.join(', ') || '');
    setUploadedImages(product.images || []);
    setCoverImage(product.coverImage || '');
    setValue('showSpecifications', product.showSpecifications !== false);
    setCurrentStep(1);
    setShowEditModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  // Selection handlers
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    setSelectedProductIds(new Set(filteredProducts.map((p: Product) => p._id)));
  };

  const deselectAllProducts = () => {
    setSelectedProductIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;

    setIsSubmitting(true);

    try {
      const deletePromises = Array.from(selectedProductIds).map(productId =>
        deleteProduct({
          requestingUserId: user?.id as any,
          productId: productId as any,
        })
      );

      await Promise.all(deletePromises);

      setSelectedProductIds(new Set());
      setShowBulkDeleteModal(false);
      toast.success(`${selectedProductIds.size} product(s) deleted successfully`);
    } catch (error: any) {
      console.error('Error deleting products:', error);
      toast.error(error.message || 'Failed to delete products');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step progress
  const progressPercentage = ((currentStep - 1) / 3) * 100;

  // ==================== IMPORT/EXPORT FUNCTIONS ====================

  // Generate sample data for CSV/Excel template
  const generateSampleData = () => {
    return [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium wireless headphones with noise cancellation',
        reference: 'PRD-001',
        sku: 'WBH-001-BLK',
        categories: 'Audio, Electronics, Wireless',
        price: 149.99,
        discountedPrice: 129.99,
        cost: 75.00,
        stockQuantity: 50,
        lowStockThreshold: 10,
        status: 'available',
        isActive: true,
        color: 'Black',
        material: 'Plastic/Metal',
        size: 'One Size',
        weight: 0.25,
        length: 20,
        width: 15,
        height: 8,
        features: 'Noise Cancelling, Bluetooth 5.0, 30hr Battery',
        tags: 'electronics, audio, wireless',
        images: 'https://example.com/image1.jpg, https://example.com/image2.jpg',
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt',
        reference: 'PRD-002',
        sku: 'OCT-S-BLU',
        categories: 'Apparel, Clothing, Organic',
        price: 29.99,
        discountedPrice: null,
        cost: 12.00,
        stockQuantity: 200,
        lowStockThreshold: 20,
        status: 'available',
        isActive: true,
        color: 'Blue',
        material: '100% Organic Cotton',
        size: 'Small',
        weight: 0.15,
        length: 70,
        width: 50,
        height: 1,
        features: 'Organic, Breathable, Sustainable',
        tags: 'clothing, eco-friendly, cotton',
        images: '',
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
      link.download = 'product_catalog_sample.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, 'product_catalog_sample.xlsx');
    }

    toast.success(`Sample ${format.toUpperCase()} file downloaded`);
  };

  // Export products to CSV/Excel
  const exportProducts = (format: 'csv' | 'excel') => {
    if (!products || products.length === 0) {
      toast.error('No products to export');
      return;
    }

    const exportData = products.map((p: Product) => ({
      name: p.name,
      description: p.description || '',
      reference: p.reference,
      sku: p.sku || '',
      categories: p.categories?.join(', ') || '',
      price: p.price,
      discountedPrice: p.discountedPrice || '',
      cost: p.cost || '',
      stockQuantity: p.stockQuantity || '',
      lowStockThreshold: p.lowStockThreshold || '',
      status: p.status,
      isActive: p.isActive,
      color: p.specifications?.color || '',
      material: p.specifications?.material || '',
      size: p.specifications?.size || '',
      weight: p.specifications?.weight || '',
      length: p.specifications?.dimensions?.length || '',
      width: p.specifications?.dimensions?.width || '',
      height: p.specifications?.dimensions?.height || '',
      features: p.features?.join(', ') || '',
      tags: p.tags?.join(', ') || '',
      images: p.images?.join(', ') || '',
    }));

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `product_catalog_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, `product_catalog_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    toast.success(`${products.length} product(s) exported to ${format.toUpperCase()}`);
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
    let parsedData: any[] = [];
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          parsedData = results.data as any[];
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

  // Validate import data and check for duplicates
  const validateAndPreviewImport = async (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error('No data found in file');
      return;
    }

    setImportPreview(data);
    setIsImporting(true);

    try {
      const valid: any[] = [];
      const skuDuplicates: { index: number; sku: string; existingCount: number }[] = [];
      const otherDuplicates: Record<string, Array<{ index: number; value: string; name: string }>> = {};
      const errors: string[] = [];

      // Check existing products for duplicates
      const existingProducts = products || [];
      const existingSkus = existingProducts
        .map(p => p.sku?.trim().toLowerCase())
        .filter(Boolean);
      const existingReferences = existingProducts
        .map(p => p.reference?.trim().toLowerCase())
        .filter(Boolean);
      const existingNames = existingProducts
        .map(p => p.name?.trim().toLowerCase())
        .filter(Boolean);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        // Validate required fields
        if (!row.name || !row.name.trim()) {
          errors.push(`Row ${rowNumber}: Missing product name`);
          continue;
        }

        const name = row.name.trim();
        const sku = row.sku?.trim();
        const reference = row.reference?.trim();

        // Check SKU duplicates - CRITICAL ERROR
        if (sku && existingSkus.includes(sku.toLowerCase())) {
          const existingWithSameSku = existingProducts.filter(p => p.sku?.trim().toLowerCase() === sku.toLowerCase());
          skuDuplicates.push({
            index: i,
            sku: sku,
            existingCount: existingWithSameSku.length,
          });
          errors.push(`Row ${rowNumber}: SKU "${sku}" already exists in your inventory. Duplicate SKUs cannot be imported.`);
          continue;
        }

        // Check for SKU duplicates within the import file itself
        const skuInFile = data
          .map((r, idx) => r.sku?.trim() ? { index: idx, sku: r.sku.trim() } : null)
          .filter((item): item is { index: number; sku: string } => item !== null);

        const duplicateSkusInFile = skuInFile.filter(item => {
          const count = skuInFile.filter(s => s.sku === item.sku).length;
          return count > 1;
        });

        if (sku && duplicateSkusInFile.some(ds => ds && ds.index === i && ds.sku === sku)) {
          skuDuplicates.push({
            index: i,
            sku: sku,
            existingCount: 0,
          });
          errors.push(`Row ${rowNumber}: SKU "${sku}" appears multiple times in this file. Each SKU must be unique.`);
          continue;
        }

        // Check name duplicates (warning only)
        if (existingNames.includes(name.toLowerCase())) {
          if (!otherDuplicates['name']) {
            otherDuplicates['name'] = [];
          }
          otherDuplicates['name'].push({
            index: i,
            value: name,
            name: name,
          });
        }

        // Check reference duplicates (warning only)
        if (reference && existingReferences.includes(reference.toLowerCase())) {
          if (!otherDuplicates['reference']) {
            otherDuplicates['reference'] = [];
          }
          otherDuplicates['reference'].push({
            index: i,
            value: reference,
            name: name,
          });
        }

        valid.push({ ...row, _originalIndex: i });
      }

      setValidationResults({
        valid,
        skuDuplicates,
        otherDuplicates,
      });

      // Select all valid products by default
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

  // Process and import products
  const processImport = async () => {
    if (!validationResults) {
      toast.error('Please validate the data first');
      return;
    }

    const { valid } = validationResults;

    // Get selected items
    const itemsToImport = selectedImports.size > 0
      ? valid.filter((_, idx) => selectedImports.has(idx))
      : valid;

    if (itemsToImport.length === 0) {
      toast.error('No products selected for import');
      return;
    }

    setIsImporting(true);
    setImportErrors([]);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < itemsToImport.length; i++) {
      const row = itemsToImport[i];
      const originalIndex = row._originalIndex ?? i;

      try {
        // Process features array
        const features = row.features
          ? String(row.features).split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0)
          : [];

        // Process tags array
        const tags = row.tags
          ? String(row.tags).split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
          : [];

        // Process categories array (comma-separated)
        const categories = row.categories
          ? String(row.categories).split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
          : [];

        // Process images array (comma-separated URLs)
        const images = row.images
          ? String(row.images).split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 0)
          : [];

        // Auto-generate reference if empty
        const reference = row.reference?.trim() || `PRD-${Date.now().toString(36).toUpperCase()}-${i}`;

        // Helper function to sanitize optional number values
        const sanitizeNumber = (value: any): number | undefined => {
          if (value === undefined || value === null || value === '') return undefined;
          const num = Number(value);
          return isNaN(num) ? undefined : num;
        };

        // Build specifications
        const specifications: any = {};
        if (row.weight) specifications.weight = sanitizeNumber(row.weight);
        if (row.color) specifications.color = row.color;
        if (row.material) specifications.material = row.material;
        if (row.size) specifications.size = row.size;
        if (row.length || row.width || row.height) {
          specifications.dimensions = {
            length: sanitizeNumber(row.length),
            width: sanitizeNumber(row.width),
            height: sanitizeNumber(row.height),
          };
        }

        await createProduct({
          userId: user?.id as any,
          companyId: companyId as any,
          name: row.name,
          description: row.description || '',
          reference: reference,
          sku: row.sku || undefined,
          categories,
          price: sanitizeNumber(row.price) || 0,
          discountedPrice: sanitizeNumber(row.discountedPrice),
          cost: sanitizeNumber(row.cost),
          stockQuantity: sanitizeNumber(row.stockQuantity),
          lowStockThreshold: sanitizeNumber(row.lowStockThreshold),
          status: row.status || 'draft',
          isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
          images,
          specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
          features,
          tags,
        });

        successCount++;
      } catch (error: any) {
        errors.push(`Row ${originalIndex + 1}: ${error.message || 'Failed to import product'}`);
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} product(s) imported successfully`);
    }

    if (errors.length > 0) {
      setImportErrors(errors);
      toast.error(`${errors.length} product(s) failed to import`);
    }

    if (successCount > 0 && errors.length === 0) {
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
      setValidationResults(null);
      setSelectedImports(new Set());
      setImportStep('upload');
    }
  };

  // Helper functions for import selection
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

  const selectAllValid = () => {
    if (!validationResults) return;
    setSelectedImports(new Set(validationResults.valid.map((_, idx) => idx)));
  };

  const deselectAll = () => {
    setSelectedImports(new Set());
  };

  const goBackToUpload = () => {
    setImportStep('upload');
    setImportPreview([]);
    setValidationResults(null);
    setSelectedImports(new Set());
    setImportErrors([]);
  };

  // ==================== END IMPORT/EXPORT FUNCTIONS ====================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading products...</p>
        </div>
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
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
            <span className="text-slate-900 font-medium whitespace-nowrap">Products</span>
          </div>

          {/* Title */}
          <div className="pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Products</h1>
                  <p className="text-slate-600 mt-1 text-sm sm:text-base">Manage your product catalog</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex gap-2">
                  {/* Import Button */}
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm text-sm sm:text-base"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Import</span>
                  </button>

                  {/* Export Dropdown */}
                  <div className="relative group">
                    <button className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm text-sm sm:text-base">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={() => exportProducts('csv')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-xl"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => exportProducts('excel')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-b-xl"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                        Export as Excel
                      </button>
                    </div>
                  </div>

                  {/* Sample Dropdown */}
                  <div className="relative group">
                    <button className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm text-sm sm:text-base">
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
                    resetModalState();
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-sm"
                >
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span>Add Product</span>
                </button>
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, reference, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm text-slate-900 appearance-none font-medium cursor-pointer hover:bg-slate-50"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm text-slate-900 appearance-none font-medium cursor-pointer hover:bg-slate-50"
            >
              <option value="all">All Categories</option>
              {existingCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedProductIds.size > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-3 mb-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">
                  {selectedProductIds.size} selected
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={deselectAllProducts}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-all duration-200 shadow-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Select All / Deselect All Bar */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={() =>
                selectedProductIds.size === filteredProducts.length
                  ? deselectAllProducts()
                  : selectAllProducts()
              }
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-violet-500 fill-current" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-700">
                {selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </span>
            </button>
            <span className="text-sm text-slate-500">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Products Grid */}
        {products === undefined ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product: Product) => {
              const statusInfo = getStatusInfo(product.status);
              const isSelected = selectedProductIds.has(product._id);

              return (
                <div
                  key={product._id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border overflow-hidden group relative ${
                    isSelected ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    {product.coverImage || (product.images && product.images.length > 0) ? (
                      <img
                        src={product.coverImage || product.images?.[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-slate-300" />
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <button
                        onClick={() => toggleProductSelection(product._id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-violet-500 text-white'
                            : 'bg-white/90 backdrop-blur-sm text-slate-600 hover:bg-white'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 fill-current" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Active Toggle */}
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                        product.isActive
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-slate-300 text-slate-600 hover:bg-slate-400'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5 truncate">{product.name}</h3>
                    <p className="text-xs text-slate-500 mb-2 truncate">
                      {product.reference} {product.sku && `• ${product.sku}`}
                    </p>

                    {/* Product Info */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 mb-2 flex-wrap">
                      {product.categories && product.categories.length > 0 && (
                        <span>{product.categories.join(', ')}</span>
                      )}
                    </div>

                    {/* Stock Info */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.stockQuantity !== undefined && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md ${
                          product.stockQuantity <= (product.lowStockThreshold || 5)
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <Box className="h-2.5 w-2.5" />
                          {product.stockQuantity} in stock
                        </span>
                      )}
                      {product.specifications?.color && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-md">
                          <Palette className="h-2.5 w-2.5" />
                          {product.specifications.color}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <div>
                          {product.discountedPrice ? (
                            <>
                              <p className="text-sm font-bold text-emerald-600">
                                {currencySymbol}{product.discountedPrice.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-400 line-through">
                                {currencySymbol}{product.price.toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-slate-900">
                              {currencySymbol}{product.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />
                          {product.viewsCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(product)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                ? 'No products found'
                : 'No products yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first product'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterCategory === 'all' && (
              <button
                onClick={() => {
                  resetModalState();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add First Product
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col my-4 sm:my-6 overflow-hidden max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {showAddModal ? 'Add New Product' : 'Edit Product'}
                  </h3>
                  <p className="text-xs text-white/80">
                    Step {currentStep} of {steps.length}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    resetModalState();
                  }}
                  className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center gap-2 mt-4">
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;

                  return (
                    <div key={step.id} className="flex items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-white text-violet-600'
                            : isCurrent
                            ? 'bg-white text-violet-600'
                            : 'bg-white/20 text-white/60'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`text-[10px] font-medium hidden sm:block ${
                        isCurrent ? 'text-white' : 'text-white/60'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 4 && !isTransitioningToFinal) {
                handleSubmit((data) => {
                  if (showAddModal) {
                    handleAddProduct(data as ProductFormData);
                  } else {
                    handleEditProduct(data as ProductFormData);
                  }
                })(e);
              }
            }}
            className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('name')}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                        placeholder="Enter product name"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none"
                        placeholder="Enter product description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
                        <input
                          {...register('reference')}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          placeholder="e.g., PRD-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                        <input
                          {...register('sku')}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          placeholder="Stock Keeping Unit"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Categories</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          placeholder="Add a category"
                        />
                        <button
                          type="button"
                          onClick={addCategory}
                          className="px-3 py-2 bg-violet-100 text-violet-700 rounded-xl hover:bg-violet-200 transition-colors text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map((cat, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                            {cat}
                            <button type="button" onClick={() => removeCategory(index)} className="text-slate-400 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Price & Stock */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Price ({currencySymbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{currencySymbol}</span>
                          <input
                            type="number"
                            {...register('price')}
                            className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sale Price ({currencySymbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{currencySymbol}</span>
                          <input
                            type="number"
                            {...register('discountedPrice')}
                            className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cost ({currencySymbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{currencySymbol}</span>
                          <input
                            type="number"
                            {...register('cost')}
                            className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                        <div className="relative">
                          <input
                            type="number"
                            {...register('stockQuantity')}
                            className="w-full pl-3 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Alert</label>
                        <input
                          type="number"
                          {...register('lowStockThreshold')}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Images */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
                      <p className="text-xs text-slate-500 mb-2">
                        <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3 text-blue-500" /> Cover (hero/banner)</span>
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAsCover(url)}
                                className={`p-1.5 rounded-lg ${coverImage === url ? 'bg-blue-500 text-white' : 'bg-white text-slate-700'}`}
                                title="Set as cover image (hero/banner)"
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="p-1.5 rounded-lg bg-red-500 text-white"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {coverImage === url && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-medium">
                                Cover
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowMediaLibrary(true)}
                          className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
                        >
                          <Plus className="h-6 w-6" />
                          <span className="text-[10px] font-medium">Add Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Listing */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                          {...register('status')}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                        >
                          {statuses.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register('isActive')}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Active</span>
                        </label>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Features</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={featureInput}
                          onChange={(e) => setFeatureInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          placeholder="Add a feature"
                        />
                        <button
                          type="button"
                          onClick={addFeature}
                          className="px-3 py-2 bg-violet-100 text-violet-700 rounded-xl hover:bg-violet-200 transition-colors text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {featuresList.map((feature, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                            {feature}
                            <button type="button" onClick={() => removeFeature(index)} className="text-slate-400 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                      <input
                        {...register('tags')}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                        placeholder="Comma separated tags"
                      />
                    </div>

                    {/* Specifications */}
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Weight</label>
                          <input
                            type="number"
                            {...register('weight')}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Color</label>
                          <input
                            {...register('color')}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="e.g., Black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Material</label>
                          <input
                            {...register('material')}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="e.g., Cotton"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Size</label>
                          <input
                            {...register('size')}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            placeholder="e.g., Large"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-600 mb-2">Dimensions (L × W × H in cm)</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <input
                              type="number"
                              {...register('length')}
                              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm text-center"
                              placeholder="Length"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              {...register('width')}
                              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm text-center"
                              placeholder="Width"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              {...register('height')}
                              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm text-center"
                              placeholder="Height"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Show Specifications Toggle */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register('showSpecifications')}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            Show specifications on product page
                          </span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1 ml-7">
                          Display weight and dimensions on the frontend product details page
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      currentStep === 1
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
                      >
                        Next Step
                      </button>
                    ) : currentStep === 3 ? (
                      <button
                        type="button"
                        onClick={handleContinueToFinalStep}
                        className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
                      >
                        Continue to Final Step
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {showAddModal ? 'Create Product' : 'Save Changes'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Product</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{selectedProduct?.name}</span>? This will permanently remove the product from your catalog.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Products</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{selectedProductIds.size} products</span>? This will permanently remove them from your catalog.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <h3 className="text-lg sm:text-xl font-bold text-white">Import Products</h3>
                    <p className="text-xs sm:text-sm text-white/80">Bulk import from CSV or Excel</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                    setImportErrors([]);
                    setImportStep('upload');
                    setValidationResults(null);
                    setSelectedImports(new Set());
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
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center hover:border-violet-400 transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="import-file-input"
                      />
                      <label
                        htmlFor="import-file-input"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-violet-600" />
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-slate-500 mb-4">CSV or Excel files only</p>
                        <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg text-sm">
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
                        <span>Required fields: <strong>name</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Optional fields: reference, sku, categories (comma-separated), price, stockQuantity, etc.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Reference will be auto-generated if empty</span>
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
              ) : importStep === 'validation' && validationResults ? (
                /* Validation Results */
                <div className="space-y-4 sm:space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Valid Count */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                          <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{validationResults.valid.length}</p>
                          <p className="text-xs sm:text-sm font-medium text-emerald-600">Valid Products</p>
                        </div>
                      </div>
                    </div>

                    {/* Duplicates Count */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-amber-700">
                            {Object.values(validationResults.otherDuplicates).reduce((sum, arr) => sum + arr.length, 0)}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-amber-600">Duplicates</p>
                        </div>
                      </div>
                    </div>

                    {/* SKU Errors Count */}
                    <div className={`rounded-2xl p-4 border ${validationResults.skuDuplicates.length > 0 ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${validationResults.skuDuplicates.length > 0 ? 'bg-red-500' : 'bg-slate-300'}`}>
                          <XCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${validationResults.skuDuplicates.length > 0 ? 'text-white' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className={`text-2xl sm:text-3xl font-bold ${validationResults.skuDuplicates.length > 0 ? 'text-red-700' : 'text-slate-500'}`}>{validationResults.skuDuplicates.length}</p>
                          <p className={`text-xs sm:text-sm font-medium ${validationResults.skuDuplicates.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>SKU Conflicts</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SKU Conflicts - Blocking Errors */}
                  {validationResults.skuDuplicates.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-bold text-red-900 mb-1">SKU Conflicts Found</h4>
                          <p className="text-xs sm:text-sm text-red-700">These products have SKUs that already exist in your inventory. They cannot be imported.</p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {validationResults.skuDuplicates.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{importPreview[item.index]?.name || 'Unknown'}</p>
                              <p className="text-xs text-red-600 font-mono">SKU: {item.sku}</p>
                            </div>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2">
                              {item.existingCount} existing
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Duplicates - Warnings with Selection */}
                  {Object.keys(validationResults.otherDuplicates).length > 0 && (
                    <div className="space-y-4">
                      {Object.entries(validationResults.otherDuplicates).map(([field, duplicates]) => (
                        <div key={field} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-base sm:text-lg font-bold text-amber-900 mb-1 capitalize">{field} Duplicates</h4>
                                <p className="text-xs sm:text-sm text-amber-700">Select which ones to import:</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedImports(prev => {
                                    const newSet = new Set(prev);
                                    duplicates.forEach(item => newSet.add(item.index));
                                    return newSet;
                                  });
                                }}
                                className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                              >
                                Select All
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedImports(prev => {
                                    const newSet = new Set(prev);
                                    duplicates.forEach(item => newSet.delete(item.index));
                                    return newSet;
                                  });
                                }}
                                className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-white text-amber-700 rounded-lg hover:bg-amber-50 transition-colors border border-amber-200"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {duplicates.map((item, idx) => (
                              <label
                                key={idx}
                                className={`flex items-center justify-between bg-white rounded-lg p-3 border transition-all cursor-pointer ${
                                  selectedImports.has(item.index)
                                    ? 'border-amber-400 ring-1 ring-amber-400'
                                    : 'border-amber-200 hover:border-amber-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={selectedImports.has(item.index)}
                                    onChange={() => toggleImportSelection(item.index)}
                                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{field}: {item.value}</p>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Valid Products Table */}
                  {validationResults.valid.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900">Valid Products</h4>
                            <p className="text-xs sm:text-sm text-slate-500">{validationResults.valid.length} product(s) ready to import</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={selectAllValid}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                          >
                            Select All
                          </button>
                          <button
                            onClick={deselectAll}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Responsive Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap w-10">
                                <input
                                  type="checkbox"
                                  checked={validationResults.valid.every((_, idx) => selectedImports.has(idx))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      selectAllValid();
                                    } else {
                                      deselectAll();
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              </th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Name</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">SKU</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Categories</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Price</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {validationResults.valid.map((row, idx) => (
                              <tr
                                key={idx}
                                className={`hover:bg-slate-50 transition-colors ${
                                  selectedImports.has(idx) ? 'bg-emerald-50/50' : ''
                                }`}
                              >
                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedImports.has(idx)}
                                    onChange={() => toggleImportSelection(idx)}
                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-900 max-w-[120px] sm:max-w-none truncate">{row.name || '-'}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600 font-mono text-xs">{row.sku || '-'}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600">{row.categories || '-'}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600">{row.price ? `${currencySymbol}${Number(row.price).toLocaleString()}` : '-'}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600">{row.stockQuantity || '0'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Selection Summary */}
                      <div className="mt-4 flex items-center justify-between text-xs sm:text-sm text-slate-600">
                        <span>{selectedImports.size} of {validationResults.valid.length} selected</span>
                        <span className="text-slate-400">{validationResults.valid.length - selectedImports.size} will be skipped</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Loading State */
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4">
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-violet-600 animate-spin" />
                  <p className="text-sm sm:text-base font-medium text-slate-700">Validating import data...</p>
                  <p className="text-xs sm:text-sm text-slate-500">Checking for duplicates and errors</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              {/* Left side - Back button for validation step */}
              {importStep === 'validation' && validationResults && (
                <button
                  onClick={goBackToUpload}
                  disabled={isImporting}
                  className="order-2 sm:order-1 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                    setImportErrors([]);
                    setImportStep('upload');
                    setValidationResults(null);
                    setSelectedImports(new Set());
                  }}
                  disabled={isImporting}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>

                {/* Import button - only show in validation step */}
                {importStep === 'validation' && validationResults && (
                  <button
                    onClick={processImport}
                    disabled={isImporting || selectedImports.size === 0}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                      selectedImports.size === 0
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-violet-600 hover:to-purple-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import {selectedImports.size} Product{selectedImports.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibraryModal
          onSelectImage={handleMediaLibrarySelect}
          onOpenChange={(open) => setShowMediaLibrary(open)}
          open={showMediaLibrary}
          userId={user?.id || ''}
        />
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
