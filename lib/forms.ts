import type { Form, FormField, FormFieldType } from '@/types/forms';

// Helper function to convert Convex form to our Form type
// Convex returns fields with type: string, but we need FormFieldType
export function convertConvexForm(convexForm: any): Form {
  return {
    ...convexForm,
    fields: convexForm.fields?.map((f: any) => ({
      ...f,
      type: f.type as FormFieldType,
    })) || [],
  };
}

// Helper function to convert our FormField to Convex field format
export function convertFormFieldToConvex(field: FormField) {
  return {
    ...field,
    type: field.type as string,
  };
}
