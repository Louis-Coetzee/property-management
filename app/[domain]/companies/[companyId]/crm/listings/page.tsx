'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import {
  Car,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Tag,
  Eye,
  EyeOff,
  Users,
  Filter,
  Check,
  AlertCircle,
  GripVertical,
  Star,
  Upload,
  Save,
  XCircle,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import MediaLibraryModal from '@/components/media-library-modal';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';

// Custom validator for optional number fields that handles NaN
const optionalNumber = () =>
  z.preprocess(
    (val) => {
      // Convert empty string, null, undefined, or NaN to undefined
      if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  );

// Custom validator for optional year field with range validation
const optionalYear = () =>
  z.preprocess(
    (val) => {
      // Convert empty string, null, undefined, or NaN to undefined
      if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
        return undefined;
      }
      const num = Number(val);
      if (isNaN(num)) {
        return undefined;
      }
      // Validate year range
      const currentYear = new Date().getFullYear() + 1;
      if (num < 1900 || num > currentYear) {
        return num; // Return the value to let z.number() handle validation
      }
      return num;
    },
    z.number().min(1900).max(new Date().getFullYear() + 1).optional()
  );

// Step-specific schemas for validation
const step1Schema = z.object({
  name: z.string().min(1, 'Vehicle name is required'),
  description: z.string().optional(),
  reference: z.string().optional(),
  vin: z.string().optional(),
  vehicleType: z.string().optional(),
  brand: z.string().optional(),
  make: z.string().min(1, 'Make is required'),
  model: z.string().optional(),
  year: optionalYear(),
  condition: z.enum(['new', 'used', 'certified'])});

const step2Schema = z.object({
  price: optionalNumber(),
  discountedPrice: optionalNumber(),
  cost: optionalNumber(),
  engine: z.string().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  drivetrain: z.string().optional(),
  mileage: optionalNumber(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  doors: optionalNumber(),
  cylinders: optionalNumber(),
  horsepower: optionalNumber()});

const step3Schema = z.object({
  images: z.array(z.string()).optional()});

const step4Schema = z.object({
  status: z.enum(['draft', 'available', 'reserved', 'sold']),
  isActive: z.boolean(),
  features: z.string().optional(),
  tags: z.string().optional()});

// Combined schema for final validation
const vehicleFormSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

// Type assertion for form data - use loose types due to z.preprocess type issues
// All number fields that use z.preprocess will be typed as 'any'
type VehicleFormData = {
  name: string;
  description?: string;
  reference?: string;
  vin?: string;
  vehicleType?: string;
  brand?: string;
  make: string;
  model?: string;
  year: any;
  condition: 'new' | 'used' | 'certified';
  price: any;
  discountedPrice: any;
  cost: any;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  drivetrain?: string;
  mileage: any;
  exteriorColor?: string;
  interiorColor?: string;
  doors: any;
  cylinders: any;
  horsepower: any;
  images?: any;
  status: 'draft' | 'available' | 'reserved' | 'sold';
  isActive: boolean;
  features?: string;
  tags?: string;
};

// Helper function to transform Zod error messages into user-friendly ones
const getUserFriendlyErrorMessage = (fieldName: string, errorMessage: string): string => {
  // Format field name to be more readable
  const formattedFieldName = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  // Handle common Zod error messages
  if (errorMessage.includes('expected number, received NaN')) {
    return `${formattedFieldName}: Please enter a valid number or leave empty`;
  }
  if (errorMessage.includes('Expected number, received nan')) {
    return `${formattedFieldName}: Please enter a valid number or leave empty`;
  }
  if (errorMessage.includes('Invalid input')) {
    return `${formattedFieldName}: Invalid value provided`;
  }

  // Return the original error message if it's not a recognized pattern
  // Or if it's already user-friendly
  if (errorMessage.includes(formattedFieldName) || errorMessage.includes(fieldName)) {
    return errorMessage;
  }

  return `${formattedFieldName}: ${errorMessage}`;
};

// Field label mappings for better error messages
const fieldLabels: Record<string, string> = {
  name: 'Vehicle Name',
  make: 'Make',
  model: 'Model',
  year: 'Year',
  condition: 'Condition',
  price: 'Price',
  discountedPrice: 'Discounted Price',
  cost: 'Cost',
  mileage: 'Mileage',
  cylinders: 'Cylinders',
  horsepower: 'Horsepower',
  doors: 'Doors',
  vin: 'VIN',
  reference: 'Reference Number',
  engine: 'Engine',
  transmission: 'Transmission',
  fuelType: 'Fuel Type',
  drivetrain: 'Drivetrain',
  exteriorColor: 'Exterior Color',
  interiorColor: 'Interior Color',
  vehicleType: 'Vehicle Type',
  status: 'Status',
  images: 'Images',
  features: 'Features',
  tags: 'Tags',
  description: 'Description'};

interface Vehicle {
  _id: string;
  name: string;
  description?: string;
  reference: string;
  vin?: string;
  vehicleType?: string;
  brand?: string;
  make: string;
  model: string;
  year: number;
  condition?: string;
  price: number;
  discountedPrice?: number;
  cost?: number;
  status: string;
  isActive: boolean;
  images?: string[];
  featuredImage?: string;
  specifications?: {
    engine?: string;
    transmission?: string;
    fuelType?: string;
    drivetrain?: string;
    mileage?: number;
    exteriorColor?: string;
    interiorColor?: string;
    doors?: number;
    cylinders?: number;
    horsepower?: number;
  };
  features?: string[];
  tags?: string[];
  viewsCount?: number;
  leadCount?: number;
  createdAt: number;
  updatedAt: number;
}

const vehicleTypes = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'convertible', label: 'Convertible' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'wagon', label: 'Wagon' },
  { value: 'van', label: 'Van' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'atv', label: 'ATV' },
  { value: 'rv', label: 'RV' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'other', label: 'Other' },
];

const conditions = [
  { value: 'new', label: 'New', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'used', label: 'Used', color: 'bg-blue-100 text-blue-700' },
  { value: 'certified', label: 'Certified', color: 'bg-[#e0eaf0] text-[#296d82]' },
];

const statuses = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  { value: 'available', label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'reserved', label: 'Reserved', color: 'bg-amber-100 text-amber-700' },
  { value: 'sold', label: 'Sold', color: 'bg-red-100 text-red-700' },
];

// Step configuration
const steps = [
  { id: 1, title: 'Basic Info', icon: Car, description: 'Vehicle details & classification' },
  { id: 2, title: 'Specs & Price', icon: Settings, description: 'Pricing & specifications' },
  { id: 3, title: 'Images', icon: ImageIcon, description: 'Photos & media' },
  { id: 4, title: 'Listing', icon: Tag, description: 'Status & features' },
];

export default function ListingsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query vehicles
  const vehicles = useQuery(api.vehicles.getVehiclesByCompany, {
    userId: user?.id as any,
    companyId: companyId as any});

  // Mutations
  const createVehicle = useMutation(api.vehicles.createVehicle);
  const updateVehicle = useMutation(api.vehicles.updateVehicle);
  const deleteVehicle = useMutation(api.vehicles.deleteVehicle);
  const toggleVehicleStatus = useMutation(api.vehicles.toggleVehicleStatus);
  const updateVehicleStatus = useMutation(api.vehicles.updateVehicleStatus);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioningToFinal, setIsTransitioningToFinal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'validation' | 'review'>('upload');
  const [validationResults, setValidationResults] = useState<{
    valid: any[];
    vinDuplicates: { index: number; vin: string; existingCount: number }[];
    otherDuplicates: Record<string, Array<{ index: number; value: string; name: string }>>;
  } | null>(null);
  const [selectedImports, setSelectedImports] = useState<Set<number>>(new Set());
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors }} = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      reference: '',
      vin: '',
      vehicleType: 'sedan',
      brand: '',
      make: '',
      model: '',
      condition: 'used',
      status: 'draft',
      isActive: true,
      engine: '',
      transmission: '',
      fuelType: '',
      drivetrain: '',
      exteriorColor: '',
      interiorColor: '',
      features: '',
      tags: '',
      images: []},
    mode: 'onBlur'});

  // Watch form values for real-time validation
  const formValues = watch();

  // Filter vehicles
  const filteredVehicles = vehicles ? vehicles.filter((vehicle: Vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.vin && vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    const matchesCondition = filterCondition === 'all' || vehicle.condition === filterCondition;

    return matchesSearch && matchesStatus && matchesCondition;
  }) : [];

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof VehicleFormData)[] = [];

    switch (step) {
      case 1:
        // Only validate required fields: name, make, condition
        fieldsToValidate = ['name', 'make', 'condition'];
        break;
      case 2:
        // No required fields in pricing/specs step
        return true;
      case 3:
        // Images are optional now
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
      // Don't auto-advance to step 4 - require manual action
      // This allows users to properly fill out the final step before saving
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 3) {
        // When on step 3, show a message that they need to manually go to step 4
        toast('Click "Continue to Final Step" to review and complete your listing', {
          duration: 4000,
          icon: 'ℹ️'});
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  // Manual handler to advance to the final step (step 4)
  const handleContinueToFinalStep = async () => {
    const isValid = await validateStep(3); // Validate step 3 (images step)
    if (isValid) {
      setIsTransitioningToFinal(true);
      setCurrentStep(4);
      // Clear the transition flag after a short delay to ensure no accidental submissions
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

  const handleMediaLibrarySelect = (urls: string[]) => {
    setUploadedImages(prev => [...prev, ...urls]);
    if (!featuredImage && urls.length > 0) {
      setFeaturedImage(urls[0]);
    }
    setValue('images', [...uploadedImages, ...urls]);
  };

  const removeImage = (url: string) => {
    const newImages = uploadedImages.filter(img => img !== url);
    setUploadedImages(newImages);
    setValue('images', newImages);
    if (featuredImage === url) {
      const newFeatured = newImages.find(img => img !== url) || '';
      setFeaturedImage(newFeatured);
    }
  };

  const setAsFeatured = (url: string) => {
    setFeaturedImage(url);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...uploadedImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setUploadedImages(newImages);
    setValue('images', newImages);
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

  // Generate sample data for CSV/Excel template
  const generateSampleData = () => {
    return [
      {
        name: '2023 Toyota Camry XSE',
        reference: 'VEH-001',
        vin: '4T1BF1FK5DU123456',
        vehicleType: 'sedan',
        brand: 'Toyota',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        condition: 'new',
        price: 32000,
        discountedPrice: 30000,
        cost: 28000,
        status: 'available',
        isActive: true,
        description: 'Brand new 2023 Toyota Camry XSE with premium features',
        engine: '2.5L 4-Cylinder',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        drivetrain: 'FWD',
        mileage: 0,
        exteriorColor: 'Celestial Silver Metallic',
        interiorColor: 'Black',
        doors: 4,
        cylinders: 4,
        horsepower: 206,
        features: 'Navigation, Backup Camera, Bluetooth, Sunroof, Leather Seats',
        tags: 'sedan, new, toyota',
        images: 'https://example.com/image1.jpg, https://example.com/image2.jpg'},
      {
        name: '2021 Ford F-150 Lariat',
        reference: 'VEH-002',
        vin: '1FTEW1EP4MFA12345',
        vehicleType: 'truck',
        brand: 'Ford',
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        condition: 'used',
        price: 45000,
        discountedPrice: null,
        cost: 38000,
        status: 'available',
        isActive: true,
        description: 'Well-maintained 2021 Ford F-150 Lariat with low kilometers',
        engine: '3.5L V6 EcoBoost',
        transmission: 'Automatic 10-Speed',
        fuelType: 'Gasoline',
        drivetrain: '4WD',
        mileage: 35000,
        exteriorColor: 'Agate Black',
        interiorColor: 'Medium Stone',
        doors: 4,
        cylinders: 6,
        horsepower: 400,
        features: 'Navigation, Trailer Tow Package, Heated Seats, Remote Start',
        tags: 'truck, used, ford, 4x4',
        images: ''},
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
      link.download = 'vehicle_listings_sample.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
      XLSX.writeFile(wb, 'vehicle_listings_sample.xlsx');
    }

    toast.success(`Sample ${format.toUpperCase()} file downloaded`);
  };

  // Export vehicles to CSV/Excel
  const exportVehicles = (format: 'csv' | 'excel') => {
    if (!vehicles || vehicles.length === 0) {
      toast.error('No vehicles to export');
      return;
    }

    const exportData = vehicles.map((v) => ({
      name: v.name,
      reference: v.reference,
      vin: v.vin || '',
      vehicleType: v.vehicleType || '',
      brand: v.brand || '',
      make: v.make,
      model: v.model || '',
      year: v.year || '',
      condition: v.condition,
      price: v.price,
      discountedPrice: v.discountedPrice || '',
      cost: v.cost || '',
      status: v.status,
      isActive: v.isActive,
      description: v.description || '',
      engine: v.specifications?.engine || '',
      transmission: v.specifications?.transmission || '',
      fuelType: v.specifications?.fuelType || '',
      drivetrain: v.specifications?.drivetrain || '',
      mileage: v.specifications?.mileage || '',
      exteriorColor: v.specifications?.exteriorColor || '',
      interiorColor: v.specifications?.interiorColor || '',
      doors: v.specifications?.doors || '',
      cylinders: v.specifications?.cylinders || '',
      horsepower: v.specifications?.horsepower || '',
      features: v.features?.join(', ') || '',
      tags: v.tags?.join(', ') || ''}));

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vehicle_listings_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
      XLSX.writeFile(wb, `vehicle_listings_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    toast.success(`${vehicles.length} vehicle(s) exported to ${format.toUpperCase()}`);
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
        }});
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
      const vinDuplicates: { index: number; vin: string; existingCount: number }[] = [];
      const otherDuplicates: Record<string, Array<{ index: number; value: string; name: string }>> = {};
      const errors: string[] = [];

      // Check existing vehicles for duplicates
      const existingVehicles = vehicles || [];
      const existingVins = existingVehicles
        .map(v => v.vin?.trim().toLowerCase())
        .filter(Boolean);
      const existingReferences = existingVehicles
        .map(v => v.reference?.trim().toLowerCase())
        .filter(Boolean);
      const existingNames = existingVehicles
        .map(v => v.name?.trim().toLowerCase())
        .filter(Boolean);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        // Validate required fields
        if (!row.name || !row.name.trim()) {
          errors.push(`Row ${rowNumber}: Missing vehicle name`);
          continue;
        }

        if (!row.make || !row.make.trim()) {
          errors.push(`Row ${rowNumber}: Missing make`);
          continue;
        }

        if (!row.condition || !row.condition.trim()) {
          errors.push(`Row ${rowNumber}: Missing condition`);
          continue;
        }

        const name = row.name.trim();
        const vin = row.vin?.trim();
        const reference = row.reference?.trim();

        // Check VIN duplicates - CRITICAL ERROR
        if (vin && existingVins.includes(vin.toLowerCase())) {
          const existingWithSameVin = existingVehicles.filter(v => v.vin?.trim().toLowerCase() === vin.toLowerCase());
          vinDuplicates.push({
            index: i,
            vin: vin,
            existingCount: existingWithSameVin.length
          });
          errors.push(`Row ${rowNumber}: VIN "${vin}" already exists in your inventory. Duplicate VINs cannot be imported.`);
          continue;
        }

        // Check for VIN duplicates within the import file itself
        const vinInFile = data
          .map((r, idx) => r.vin?.trim() ? { index: idx, vin: r.vin.trim() } : null)
          .filter((item): item is { index: number; vin: string } => item !== null);

        const duplicateVinsInFile = vinInFile.filter(item => {
          const count = vinInFile.filter(v => v.vin === item.vin).length;
          return count > 1;
        });

        if (vin && duplicateVinsInFile.some(dv => dv && dv.index === i && dv.vin === vin)) {
          vinDuplicates.push({
            index: i,
            vin: vin,
            existingCount: 0
          });
          errors.push(`Row ${rowNumber}: VIN "${vin}" appears multiple times in this file. Each VIN must be unique.`);
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
            name: name
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
            name: name
          });
        }

        // Check for duplicates within the import file
        const duplicateNamesInFile = data
          .map((r, idx) => ({ index: idx, name: r.name?.trim().toLowerCase() }))
          .filter(item => item.name);

        duplicateNamesInFile.forEach((item, idx, arr) => {
          if (arr.filter(x => x.name === item.name).length > 1 && idx === arr.findIndex(x => x.name === item.name)) {
            if (!otherDuplicates['name']) {
              otherDuplicates['name'] = [];
            }
            if (!otherDuplicates['name'].some(d => d.index === item.index)) {
              otherDuplicates['name'].push({
                index: item.index,
                value: data[item.index].name,
                name: data[item.index].name
              });
            }
          }
        });

        valid.push({ ...row, _originalIndex: i });
      }

      setValidationResults({
        valid,
        vinDuplicates,
        otherDuplicates
      });

      // Select all valid vehicles by default
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

  // Process and import vehicles
  const processImport = async () => {
    if (!validationResults) {
      toast.error('Please validate the data first');
      return;
    }

    const { valid, vinDuplicates, otherDuplicates } = validationResults;

    // Note: VIN duplicates are already excluded from the valid array during validation
    // Users can proceed with importing valid vehicles while skipping VIN conflicts

    // Get selected items (for other duplicates)
    const itemsToImport = selectedImports.size > 0
      ? valid.filter((_, idx) => selectedImports.has(idx))
      : valid;

    if (itemsToImport.length === 0) {
      toast.error('No vehicles selected for import');
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

        // Process images array (comma-separated URLs)
        const images = row.images
          ? String(row.images).split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 0)
          : [];

        // Auto-generate reference if empty
        const reference = row.reference?.trim() || `VEH-${Date.now().toString(36).toUpperCase()}-${i}`;

        // Helper function to sanitize optional number values
        const sanitizeNumber = (value: any): number | undefined => {
          if (value === undefined || value === null || value === '') return undefined;
          const num = Number(value);
          return isNaN(num) ? undefined : num;
        };

        await createVehicle({
          userId: user?.id as any,
          companyId: companyId as any,
          name: row.name,
          description: row.description || '',
          reference: reference,
          vin: row.vin || undefined,
          vehicleType: row.vehicleType || 'sedan',
          brand: row.brand || '',
          make: row.make,
          model: row.model || '',
          year: sanitizeNumber(row.year) || new Date().getFullYear(),
          condition: row.condition,
          price: sanitizeNumber(row.price) || 0,
          discountedPrice: sanitizeNumber(row.discountedPrice),
          cost: sanitizeNumber(row.cost),
          status: row.status || 'draft',
          isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
          images,
          specifications: {
            engine: row.engine || '',
            transmission: row.transmission || '',
            fuelType: row.fuelType || '',
            drivetrain: row.drivetrain || '',
            mileage: sanitizeNumber(row.mileage),
            exteriorColor: row.exteriorColor || '',
            interiorColor: row.interiorColor || '',
            doors: sanitizeNumber(row.doors),
            cylinders: sanitizeNumber(row.cylinders),
            horsepower: sanitizeNumber(row.horsepower)},
          features,
          tags});

        successCount++;
      } catch (error: any) {
        errors.push(`Row ${originalIndex + 1}: ${error.message || 'Failed to import vehicle'}`);
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} vehicle(s) imported successfully`);
    }

    if (errors.length > 0) {
      setImportErrors(errors);
      toast.error(`${errors.length} vehicle(s) failed to import`);
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

  const selectAllDuplicates = (field: string) => {
    if (!validationResults?.otherDuplicates[field]) return;
    setSelectedImports(prev => {
      const newSet = new Set(prev);
      validationResults.otherDuplicates[field].forEach(item => {
        newSet.add(item.index);
      });
      return newSet;
    });
  };

  const deselectAll = () => {
    setSelectedImports(new Set());
  };

  const selectAllValid = () => {
    if (!validationResults) return;
    setSelectedImports(new Set(validationResults.valid.map((_, idx) => idx)));
  };

  const goBackToUpload = () => {
    setImportStep('upload');
    setImportPreview([]);
    setValidationResults(null);
    setSelectedImports(new Set());
    setImportErrors([]);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveImage(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const resetModalState = () => {
    setCurrentStep(1);
    setUploadedImages([]);
    setFeaturedImage('');
    setFeaturesList([]);
    setFeatureInput('');
    reset();
  };

  const handleAddVehicle = async (data: VehicleFormData) => {
    console.log('handleAddVehicle called with data:', data);
    setIsSubmitting(true);

    try {
      // Use featuresList state instead of data.features
      const features = featuresList;

      const tags = data.tags
        ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      // Auto-generate reference if empty
      const reference = data.reference?.trim() || `VEH-${Date.now().toString(36).toUpperCase()}`;

      // Helper function to sanitize optional number values (convert NaN/undefined to undefined)
      const sanitizeNumber = (value: number | undefined): number | undefined => {
        return typeof value === 'number' && !isNaN(value) ? value : undefined;
      };

      // Sanitize specifications - filter out NaN values
      const specifications: Record<string, any> = {
        engine: data.engine || undefined,
        transmission: data.transmission || undefined,
        fuelType: data.fuelType || undefined,
        drivetrain: data.drivetrain || undefined,
        mileage: sanitizeNumber(data.mileage),
        exteriorColor: data.exteriorColor || undefined,
        interiorColor: data.interiorColor || undefined,
        doors: sanitizeNumber(data.doors),
        cylinders: sanitizeNumber(data.cylinders),
        horsepower: sanitizeNumber(data.horsepower)};

      await createVehicle({
        userId: user?.id as any,
        companyId: companyId as any,
        name: data.name,
        description: data.description,
        reference: reference,
        vin: data.vin || '',
        vehicleType: data.vehicleType,
        brand: data.brand,
        make: data.make,
        model: data.model || '',
        year: data.year || new Date().getFullYear(),
        condition: data.condition,
        price: data.price || 0,
        discountedPrice: sanitizeNumber(data.discountedPrice),
        cost: sanitizeNumber(data.cost),
        status: data.status,
        isActive: data.isActive,
        images: uploadedImages,
        featuredImage: featuredImage || (uploadedImages.length > 0 ? uploadedImages[0] : undefined),
        specifications,
        features,
        tags});

      setShowAddModal(false);
      resetModalState();
      toast.success('Vehicle created successfully');
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      toast.error(error.message || 'Failed to create vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = async (data: VehicleFormData) => {
    if (!selectedVehicle) return;

    setIsSubmitting(true);

    try {
      // Use featuresList state instead of data.features
      const features = featuresList;

      const tags = data.tags
        ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      // Use existing reference if empty, otherwise generate new one
      const reference = data.reference?.trim() || selectedVehicle.reference || `VEH-${Date.now().toString(36).toUpperCase()}`;

      const finalImages = uploadedImages.length > 0 ? uploadedImages : (selectedVehicle.images || []);

      // Helper function to sanitize optional number values (convert NaN/undefined to undefined)
      const sanitizeNumber = (value: number | undefined): number | undefined => {
        return typeof value === 'number' && !isNaN(value) ? value : undefined;
      };

      // Sanitize specifications - filter out NaN values
      const specifications: Record<string, any> = {
        engine: data.engine || undefined,
        transmission: data.transmission || undefined,
        fuelType: data.fuelType || undefined,
        drivetrain: data.drivetrain || undefined,
        mileage: sanitizeNumber(data.mileage),
        exteriorColor: data.exteriorColor || undefined,
        interiorColor: data.interiorColor || undefined,
        doors: sanitizeNumber(data.doors),
        cylinders: sanitizeNumber(data.cylinders),
        horsepower: sanitizeNumber(data.horsepower)};

      await updateVehicle({
        requestingUserId: user?.id as any,
        vehicleId: selectedVehicle._id as any,
        name: data.name,
        description: data.description,
        reference: reference,
        vin: data.vin || selectedVehicle.vin || '',
        vehicleType: data.vehicleType,
        brand: data.brand,
        make: data.make,
        model: data.model || selectedVehicle.model || '',
        year: data.year || selectedVehicle.year || new Date().getFullYear(),
        condition: data.condition,
        price: data.price || selectedVehicle.price || 0,
        discountedPrice: sanitizeNumber(data.discountedPrice),
        cost: sanitizeNumber(data.cost),
        status: data.status,
        isActive: data.isActive,
        images: finalImages,
        featuredImage: featuredImage || selectedVehicle.featuredImage || (finalImages.length > 0 ? finalImages[0] : undefined),
        specifications,
        features,
        tags});

      setShowEditModal(false);
      setSelectedVehicle(null);
      resetModalState();
      toast.success('Vehicle updated successfully');
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      toast.error(error.message || 'Failed to update vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    setIsSubmitting(true);

    try {
      await deleteVehicle({
        requestingUserId: user?.id as any,
        vehicleId: selectedVehicle._id as any
      });

      setShowDeleteModal(false);
      setSelectedVehicle(null);
      toast.success('Vehicle deleted successfully');
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast.error(error.message || 'Failed to delete vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (vehicle: Vehicle) => {
    try {
      await toggleVehicleStatus({
        requestingUserId: user?.id as any,
        vehicleId: vehicle._id as any
      });
      toast.success('Vehicle status updated');
    } catch (error: any) {
      console.error('Error toggling vehicle status:', error);
      toast.error('Failed to update vehicle status');
    }
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setValue('name', vehicle.name);
    setValue('description', vehicle.description || '');
    setValue('reference', vehicle.reference || '');
    setValue('vin', vehicle.vin || '');
    setValue('vehicleType', vehicle.vehicleType || 'sedan');
    setValue('brand', vehicle.brand || '');
    setValue('make', vehicle.make);
    setValue('model', vehicle.model || '');
    setValue('year', vehicle.year ?? undefined);
    setValue('condition', (vehicle.condition as any) || 'used');
    setValue('price', vehicle.price ?? undefined);
    setValue('discountedPrice', vehicle.discountedPrice ?? undefined);
    setValue('cost', vehicle.cost ?? undefined);
    setValue('status', (vehicle.status as any));
    setValue('isActive', vehicle.isActive);
    setValue('engine', vehicle.specifications?.engine || '');
    setValue('transmission', vehicle.specifications?.transmission || '');
    setValue('fuelType', vehicle.specifications?.fuelType || '');
    setValue('drivetrain', vehicle.specifications?.drivetrain || '');
    setValue('mileage', vehicle.specifications?.mileage ?? undefined);
    setValue('exteriorColor', vehicle.specifications?.exteriorColor || '');
    setValue('interiorColor', vehicle.specifications?.interiorColor || '');
    setValue('doors', vehicle.specifications?.doors ?? undefined);
    setValue('cylinders', vehicle.specifications?.cylinders ?? undefined);
    setValue('horsepower', vehicle.specifications?.horsepower ?? undefined);
    setFeaturesList(vehicle.features || []);
    setValue('tags', vehicle.tags?.join(', ') || '');
    setUploadedImages(vehicle.images || []);
    setFeaturedImage(vehicle.featuredImage || '');
    setCurrentStep(1);
    setShowEditModal(true);
  };

  const openDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteModal(true);
  };

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const getConditionInfo = (condition: string) => {
    return conditions.find(c => c.value === condition) || conditions[0];
  };

  // Selection handlers
  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  const selectAllVehicles = () => {
    setSelectedVehicleIds(new Set(filteredVehicles.map((v: Vehicle) => v._id)));
  };

  const deselectAllVehicles = () => {
    setSelectedVehicleIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedVehicleIds.size === 0) return;

    setIsSubmitting(true);

    try {
      // Delete all selected vehicles
      const deletePromises = Array.from(selectedVehicleIds).map(vehicleId =>
        deleteVehicle({
          requestingUserId: user?.id as any,
          vehicleId: vehicleId as any
        })
      );

      await Promise.all(deletePromises);

      setSelectedVehicleIds(new Set());
      setShowBulkDeleteModal(false);
      toast.success(`${selectedVehicleIds.size} vehicle(s) deleted successfully`);
    } catch (error: any) {
      console.error('Error deleting vehicles:', error);
      toast.error(error.message || 'Failed to delete vehicles');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step progress calculation
  const progressPercentage = ((currentStep - 1) / 3) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading listings...</p>
        </div>
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
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors">
              Companies
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors">
              {company.name}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors">
              CRM
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Listings</span>
          </div>

          {/* Title */}
          <div className="pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#409dbd] to-[#337a94] flex items-center justify-center shadow-lg">
                  <Car className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Vehicle Listings</h1>
                  <p className="text-slate-600 mt-1 text-sm sm:text-base">Manage your vehicle inventory</p>
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
                        onClick={() => exportVehicles('csv')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-xl"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => exportVehicles('excel')}
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
                  <span>Add Vehicle</span>
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
              placeholder="Search by name, reference, make, model, or VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-sm text-slate-900 appearance-none font-medium cursor-pointer hover:bg-slate-50"
              >
                <option value="all">All Status</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-sm text-slate-900 appearance-none font-medium cursor-pointer hover:bg-slate-50"
              >
                <option value="all">All Conditions</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedVehicleIds.size > 0 && (
          <div className="bg-gradient-to-r from-[#409dbd] to-[#409dbd] rounded-xl shadow-lg p-3 mb-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {selectedVehicleIds.size} selected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={deselectAllVehicles}
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
        {filteredVehicles.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={() =>
                selectedVehicleIds.size === filteredVehicles.length
                  ? deselectAllVehicles()
                  : selectAllVehicles()
              }
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {selectedVehicleIds.size === filteredVehicles.length && filteredVehicles.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-[#409dbd] fill-current" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-700">
                {selectedVehicleIds.size === filteredVehicles.length && filteredVehicles.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </span>
            </button>
            <span className="text-sm text-slate-500">
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Vehicles Grid */}
        {vehicles === undefined ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVehicles.map((vehicle: Vehicle) => {
              const statusInfo = getStatusInfo(vehicle.status);
              const conditionInfo = getConditionInfo(vehicle.condition || 'used');

              const isSelected = selectedVehicleIds.has(vehicle._id);

              return (
                <div
                  key={vehicle._id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border overflow-hidden group relative ${
                    isSelected ? 'border-[#409dbd] ring-2 ring-[#409dbd]/20' : 'border-slate-200'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    {vehicle.featuredImage || (vehicle.images && vehicle.images.length > 0) ? (
                      <img
                        src={vehicle.featuredImage || vehicle.images?.[0]}
                        alt={vehicle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-16 w-16 text-slate-300" />
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <button
                        onClick={() => toggleVehicleSelection(vehicle._id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-[#409dbd] text-white'
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                    </div>

                    {/* Active Toggle */}
                    <button
                      onClick={() => handleToggleActive(vehicle)}
                      className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                        vehicle.isActive
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
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5 truncate">{vehicle.name}</h3>
                    <p className="text-xs text-slate-500 mb-2 truncate">{vehicle.reference} • {vehicle.vin}</p>

                    {/* Vehicle Info */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                      <span className="font-medium">{vehicle.make}</span>
                      <span>•</span>
                      <span>{vehicle.model}</span>
                      <span>•</span>
                      <span>{vehicle.year}</span>
                    </div>

                    {/* Key Specs */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {vehicle.specifications?.mileage && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-md">
                          <Gauge className="h-2.5 w-2.5" />
                          {vehicle.specifications.mileage.toLocaleString()} km
                        </span>
                      )}
                      {vehicle.specifications?.fuelType && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-md">
                          <Fuel className="h-2.5 w-2.5" />
                          {vehicle.specifications.fuelType}
                        </span>
                      )}
                      {vehicle.specifications?.transmission && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-md">
                          <Settings className="h-2.5 w-2.5" />
                          {vehicle.specifications.transmission}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <div>
                          {vehicle.discountedPrice ? (
                            <>
                              <p className="text-sm font-bold text-emerald-600">
                                ${vehicle.discountedPrice.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-400 line-through">
                                ${vehicle.price.toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-slate-900">
                              ${vehicle.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />
                          {vehicle.viewsCount || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {vehicle.leadCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openEditModal(vehicle)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-[#409dbd] bg-[#f0f4f8] rounded-lg hover:bg-[#e0eaf0] transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(vehicle)}
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
              <Car className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || filterStatus !== 'all' || filterCondition !== 'all'
                ? 'No vehicles found'
                : 'No vehicles yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {searchQuery || filterStatus !== 'all' || filterCondition !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first vehicle'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterCondition === 'all' && (
              <button
                onClick={() => {
                  resetModalState();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add First Vehicle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Vehicle Wizard Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col my-4 sm:my-6 overflow-hidden max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
              <div className="relative">
                {/* Title Row with Step Indicators (Desktop) */}
                <div className="hidden sm:flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#409dbd] tracking-tight">
                      {showAddModal ? 'Add New Vehicle' : 'Edit Vehicle'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {showAddModal ? 'Create a new vehicle listing' : 'Update vehicle information'}
                    </p>
                  </div>

                  {/* Step Indicators - Desktop Inline */}
                  <div className="flex items-center gap-4 pr-2">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCompleted = currentStep > step.id;
                      const isCurrent = currentStep === step.id;

                      return (
                        <div key={step.id} className="flex items-center gap-1.5">
                          <div
                            className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? 'bg-[#409dbd] text-white shadow-md'
                                : isCurrent
                                ? 'bg-[#409dbd] text-white shadow-md ring-2 ring-[#409dbd]/30'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                            ) : (
                              <StepIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-semibold tracking-wide transition-colors ${
                              isCurrent ? 'text-[#409dbd]' : 'text-slate-400'
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedVehicle(null);
                      resetModalState();
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Header */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-[#409dbd]">
                        {showAddModal ? 'Add Vehicle' : 'Edit Vehicle'}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Step {currentStep} of {steps.length}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setSelectedVehicle(null);
                        resetModalState();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Mobile Step Indicators */}
                  <div className="flex items-center justify-between gap-1">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCompleted = currentStep > step.id;
                      const isCurrent = currentStep === step.id;

                      return (
                        <div key={step.id} className="flex flex-col items-center gap-1 flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? 'bg-[#409dbd] text-white shadow-sm'
                                : isCurrent
                                ? 'bg-[#409dbd] text-white shadow-sm ring-2 ring-[#409dbd]/20'
                                : 'bg-slate-100 text-slate-300'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <StepIcon className="h-3 w-3" />
                            )}
                          </div>
                          <span
                            className={`text-[8px] font-medium transition-colors leading-tight ${
                              isCurrent ? 'text-[#409dbd]' : 'text-slate-300'
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Bar - Desktop only */}
                <div className="hidden sm:block relative mt-3">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/90 shadow-lg shadow-white/20 transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={(e) => {
              e.preventDefault();
              // Only submit if we're on step 4 AND not transitioning
              if (currentStep === 4 && !isTransitioningToFinal) {
                handleSubmit((data) => {
                  console.log('Form submit triggered, currentStep:', currentStep);
                  console.log('Form data:', data);
                  console.log('Form errors:', errors);

                  if (showAddModal) {
                    handleAddVehicle(data as VehicleFormData);
                  } else {
                    handleEditVehicle(data as VehicleFormData);
                  }
                })(e);
              }
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting the form
              if (e.key === 'Enter' && (currentStep < 4 || isTransitioningToFinal)) {
                e.preventDefault();
              }
            }}>
              <div className="p-5 sm:p-8 overflow-y-auto flex-1 bg-gradient-to-b from-slate-50/50 to-white min-h-[300px] max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-340px)]">
                {/* Global Error Message */}
                {Object.keys(errors).length > 0 && currentStep === 4 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800 font-medium">Please fix the following errors before submitting:</p>
                    <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>
                          {fieldLabels[field] || field}: {String(error.message || '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6">Basic Information</h4>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Vehicle Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('name')}
                          type="text"
                          placeholder="e.g., 2023 Tesla Model 3"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600 mt-1.5">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Reference Number
                          </label>
                          <input
                            {...register('reference')}
                            type="text"
                            placeholder="Auto-generated if empty"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                          <p className="text-xs text-slate-500 mt-1">Leave empty for auto-generation</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            VIN
                          </label>
                          <input
                            {...register('vin')}
                            type="text"
                            placeholder="17-character VIN (optional)"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 uppercase"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Make <span className="text-red-500">*</span>
                          </label>
                          <input
                            {...register('make')}
                            type="text"
                            placeholder="e.g., Toyota"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                          {errors.make && (
                            <p className="text-sm text-red-600 mt-1.5">{errors.make.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Brand
                          </label>
                          <input
                            {...register('brand')}
                            type="text"
                            placeholder="e.g., Lexus (optional)"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                          <p className="text-xs text-slate-500 mt-1">Optional - for luxury brands or sub-brands</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Model
                          </label>
                          <input
                            {...register('model')}
                            type="text"
                            placeholder="e.g., Camry"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Year
                          </label>
                          <input
                            {...register('year', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="2024"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Vehicle Type
                          </label>
                          <select
                            {...register('vehicleType')}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 bg-white"
                          >
                            {vehicleTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Condition <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...register('condition')}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 bg-white"
                          >
                            {conditions.map(condition => (
                              <option key={condition.value} value={condition.value}>{condition.label}</option>
                            ))}
                          </select>
                          {errors.condition && (
                            <p className="text-sm text-red-600 mt-1.5">{errors.condition.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Description
                        </label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          placeholder="Detailed description of the vehicle..."
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Pricing & Specifications */}
                {currentStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-semibold text-slate-900 mb-6">Pricing & Specifications</h4>

                    {/* Pricing */}
                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Pricing
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Listing Price <span className="text-red-500">*</span>
                          </label>
                          <input
                            {...register('price', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="0.00"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                          {errors.price && (
                            <p className="text-sm text-red-600 mt-1.5">{String(errors.price.message || '')}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Discounted Price
                          </label>
                          <input
                            {...register('discountedPrice', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="0.00"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Cost (Internal)
                          </label>
                          <input
                            {...register('cost', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="0.00"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div>
                      <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-[#409dbd]" />
                        Specifications
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Engine
                          </label>
                          <input
                            {...register('engine')}
                            type="text"
                            placeholder="e.g., 2.0L Turbo"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Transmission
                          </label>
                          <input
                            {...register('transmission')}
                            type="text"
                            placeholder="e.g., Automatic"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Fuel Type
                          </label>
                          <input
                            {...register('fuelType')}
                            type="text"
                            placeholder="e.g., Gasoline"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Drivetrain
                          </label>
                          <input
                            {...register('drivetrain')}
                            type="text"
                            placeholder="e.g., FWD, AWD"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Mileage
                          </label>
                          <input
                            {...register('mileage', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="0"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Horsepower
                          </label>
                          <input
                            {...register('horsepower', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="0"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Cylinders
                          </label>
                          <input
                            {...register('cylinders', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="4"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Exterior Color
                          </label>
                          <input
                            {...register('exteriorColor')}
                            type="text"
                            placeholder="e.g., Black"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Interior Color
                          </label>
                          <input
                            {...register('interiorColor')}
                            type="text"
                            placeholder="e.g., Gray"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-900 placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Doors
                          </label>
                          <input
                            {...register('doors', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) return undefined;
                                const num = Number(value);
                                return isNaN(num) ? undefined : num;
                              }
                            })}
                            type="number"
                            placeholder="4"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Images */}
                {currentStep === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-semibold text-slate-900 mb-6">Vehicle Images</h4>

                    {/* Media Library Button */}
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={() => setShowMediaLibrary(true)}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#409dbd] to-[#337a94] text-white font-semibold rounded-xl hover:from-[#337a94] hover:to-[#2a5d73] transition-all duration-200 shadow-lg"
                      >
                        <Upload className="h-5 w-5" />
                        <span>Open Media Library</span>
                      </button>
                      <p className="text-sm text-slate-500 text-center mt-2">
                        Select images from your media library to add to this listing
                      </p>
                    </div>

                    {/* Images Grid */}
                    {uploadedImages.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-slate-600">
                            {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} selected
                          </p>
                          <p className="text-xs text-slate-500">Drag to reorder • Click star to set cover</p>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {uploadedImages.map((url, index) => (
                            <div
                              key={index}
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                                featuredImage === url
                                  ? 'border-[#409dbd] shadow-lg shadow-[#409dbd]/20'
                                  : 'border-slate-200'
                              } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                            >
                              <img
                                src={url}
                                alt={`Vehicle image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />

                              {/* Cover Badge */}
                              {featuredImage === url && (
                                <div className="absolute top-2 left-2 bg-[#409dbd] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-current" />
                                  Cover
                                </div>
                              )}

                              {/* Drag Handle */}
                              <div className="absolute top-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="h-5 w-5 text-white bg-black/50 rounded p-1" />
                                  </div>

                              {/* Actions Overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {url !== featuredImage && (
                                  <button
                                    type="button"
                                    onClick={() => setAsFeatured(url)}
                                    className="p-2 bg-[#409dbd] rounded-lg text-white hover:bg-[#337a94] transition-colors"
                                    title="Set as cover image"
                                  >
                                    <Star className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeImage(url)}
                                  className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Index Badge */}
                              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium mb-1">No images yet</p>
                        <p className="text-sm text-slate-500">Open the media library to add images</p>
                      </div>
                    )}

                    {errors.images && (
                      <p className="text-sm text-red-600 mt-3">{String(errors.images.message || '')}</p>
                    )}
                  </div>
                )}

                {/* Step 4: Inventory Status & Features */}
                {currentStep === 4 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-semibold text-slate-900 mb-6">Listing Details</h4>

                    {/* Inventory Status */}
                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#409dbd]" />
                        Inventory Status
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Status <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...register('status')}
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 bg-white"
                          >
                            {statuses.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                          {errors.status && (
                            <p className="text-sm text-red-600 mt-1.5">{errors.status.message}</p>
                          )}
                        </div>

                        <div className="flex items-end">
                          <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-colors w-full ${errors.isActive ? 'bg-red-50 border-red-300 hover:border-red-400' : 'bg-slate-50 border-slate-200 hover:border-[#80b5c9]'}`}>
                            <input
                              {...register('isActive')}
                              type="checkbox"
                              className="w-5 h-5 rounded border-slate-300 text-[#409dbd] focus:ring-[#409dbd]"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-slate-900">Active</span>
                              <p className="text-xs text-slate-500">Visible on website</p>
                              {errors.isActive && (
                                <p className="text-xs text-red-600 mt-1">{errors.isActive.message}</p>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Features & Tags */}
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-[#409dbd]" />
                          Features
                        </h5>

                        {/* Add Feature Input */}
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addFeature();
                              }
                            }}
                            placeholder="Enter a feature..."
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={addFeature}
                            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#409dbd] to-[#337a94] text-white text-sm font-medium rounded-xl hover:from-[#337a94] hover:to-[#2a5d73] transition-all duration-200 shadow-lg flex items-center gap-1.5 flex-shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Add</span>
                          </button>
                        </div>

                        {/* Features List */}
                        {featuresList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {featuresList.map((feature, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#f0f4f8] to-[#e0eaf0] border border-[#b3d1dc] rounded-full group"
                              >
                                <span className="text-sm font-medium text-[#296d82]">{feature}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  className="p-0.5 text-[#6bc0d6] hover:text-red-500 transition-colors"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-slate-500 italic">No features added yet</p>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Tag className="h-4 w-4 text-[#409dbd]" />
                          Tags (comma-separated)
                        </h5>
                        <input
                          {...register('tags')}
                          type="text"
                          placeholder="e.g., luxury, sport, fuel-efficient"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#409dbd] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Navigation */}
              <div className="flex items-center justify-between gap-3 px-5 sm:px-8 py-4 sm:py-5 bg-white border-t border-slate-200/80 flex-shrink-0 sticky bottom-0">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                  <span className="sm:hidden">Back</span>
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-slate-400 hidden sm:block">
                    Step {currentStep} of {steps.length}
                  </span>
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#409dbd] to-[#337a94] hover:from-[#337a94] hover:to-[#2a5d73] rounded-xl shadow-lg shadow-[#409dbd]/20 transition-all"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : currentStep === 3 ? (
                    <button
                      type="button"
                      onClick={handleContinueToFinalStep}
                      className="flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : showAddModal ? (
                        <>
                          <Plus className="h-4 w-4" />
                          Add Vehicle
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibraryModal
          userId={user?.id || ''}
          onSelectImage={(url) => {
            handleMediaLibrarySelect([url]);
            setShowMediaLibrary(false);
          }}
          allowMultiSelect={true}
          maxImages={20}
          currentImageCount={uploadedImages.length}
          onSelectMultipleImages={(mediaIds: any, urls: string[]) => {
            handleMediaLibrarySelect(urls);
            setShowMediaLibrary(false);
          }}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVehicle && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Vehicle</h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedVehicle.name}</span>?
              </p>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The vehicle will be permanently removed from the system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedVehicle(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVehicle}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Vehicle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Multiple Vehicles</h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedVehicleIds.size} vehicle(s)</span>?
              </p>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. All selected vehicles will be permanently removed from the system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Deleting...' : `Delete ${selectedVehicleIds.size} Vehicle${selectedVehicleIds.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col my-0 sm:my-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Import Vehicles</h3>
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
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center hover:border-[#6bc0d6] transition-colors">
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
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-slate-500 mb-4">CSV or Excel files only</p>
                        <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg text-sm">
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
                        <span>Required fields: <strong>name</strong>, <strong>make</strong>, <strong>condition</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Optional fields: reference, vin, model, year, price, etc.</span>
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
                          <p className="text-xs sm:text-sm font-medium text-emerald-600">Valid Vehicles</p>
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

                    {/* VIN Errors Count */}
                    <div className={`rounded-2xl p-4 border ${validationResults.vinDuplicates.length > 0 ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${validationResults.vinDuplicates.length > 0 ? 'bg-red-500' : 'bg-slate-300'}`}>
                          <XCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${validationResults.vinDuplicates.length > 0 ? 'text-white' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className={`text-2xl sm:text-3xl font-bold ${validationResults.vinDuplicates.length > 0 ? 'text-red-700' : 'text-slate-500'}`}>{validationResults.vinDuplicates.length}</p>
                          <p className={`text-xs sm:text-sm font-medium ${validationResults.vinDuplicates.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>VIN Conflicts</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VIN Conflicts - Blocking Errors */}
                  {validationResults.vinDuplicates.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-bold text-red-900 mb-1">VIN Conflicts Found</h4>
                          <p className="text-xs sm:text-sm text-red-700">These vehicles have VINs that already exist in your inventory. They cannot be imported.</p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {validationResults.vinDuplicates.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{importPreview[item.index]?.name || 'Unknown'}</p>
                              <p className="text-xs text-red-600 font-mono">VIN: {item.vin}</p>
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
                                onClick={() => selectAllDuplicates(field)}
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

                  {/* Valid Vehicles Table */}
                  {validationResults.valid.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900">Valid Vehicles</h4>
                            <p className="text-xs sm:text-sm text-slate-500">{validationResults.valid.length} vehicle(s) ready to import</p>
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
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Make</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Model</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Year</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Condition</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Price</th>
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
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600">{row.make || '-'}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600">{row.model || '-'}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600">{row.year || '-'}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                                    row.condition === 'new' ? 'bg-emerald-100 text-emerald-700' :
                                    row.condition === 'used' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {row.condition || '-'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600">{row.price ? `$${Number(row.price).toLocaleString()}` : '-'}</td>
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
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600 animate-spin" />
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
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
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
                        Import {selectedImports.size} Vehicle{selectedImports.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                )}
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
