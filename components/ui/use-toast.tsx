'use client';

import { toast as hotToast, type Toast } from 'react-hot-toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  action?: React.ReactNode;
}

export const useToast = () => {
  function toast(options: ToastOptions) {
    const { title, description, variant = "default" } = options;
    
    const message = title ? (description ? `${title}: ${description}` : title) : description;
    
    if (!message) return "";
    
    if (variant === "destructive") {
      return hotToast.error(message);
    } else if (variant === "success") {
      return hotToast.success(message);
    } else {
      // For default variant, treat as success if title contains success-related words
      if (title?.toLowerCase().includes('success') || 
          title?.toLowerCase().includes('sent') ||
          title?.toLowerCase().includes('saved') ||
          title?.toLowerCase().includes('created') ||
          title?.toLowerCase().includes('updated')) {
        return hotToast.success(message);
      }
      return hotToast(message);
    }
  }

  return {
    toast,
  };
};

// Re-export these for compatibility
export const ToastClose = ({ children }: { children: React.ReactNode }) => children;
export const ToastDescription = ({ children }: { children: React.ReactNode }) => children;
export const ToastTitle = ({ children }: { children: React.ReactNode }) => children; 