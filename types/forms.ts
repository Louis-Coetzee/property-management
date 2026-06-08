// ============================================================================
// Form Types
// ============================================================================

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'file'
  | 'email_confirmation';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Form {
  _id: string;
  websiteId: string;
  name: string;
  description?: string;
  fields: FormField[];
  recipients: string[];
  submitButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
  themeColor?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface FormSubmission {
  _id: string;
  formId: string;
  websiteId: string;
  data: Array<{
    fieldId: string;
    fieldLabel: string;
    value: string;
  }>;
  submittedAt: number;
  ipAddress?: string;
  userAgent?: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  emailsSent?: Array<{
    recipient: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: number;
    errorMessage?: string;
  }>;
}

export interface FormSubmissionData {
  [fieldId: string]: string | string[] | File;
}

// ============================================================================
// Form Builder UI Types
// ============================================================================

export interface FormFieldEditor extends FormField {
  // Temporary UI state
  isEditing?: boolean;
}

export interface FormBuilderState {
  form: Partial<Form>;
  fields: FormFieldEditor[];
  isDirty: boolean;
  isSaving: boolean;
  validationErrors: Record<string, string>;
}

// ============================================================================
// Form Modal Props
// ============================================================================

export interface FormModalProps {
  formId?: string;
  form?: Form;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: FormSubmissionData) => Promise<void>;
  websiteId?: string;
  // Context for tracking where the form was submitted from
  sourcePage?: string;
  vehicleId?: string;
  vehicleName?: string;
}
