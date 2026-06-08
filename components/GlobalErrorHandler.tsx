'use client';

import { useEffect } from 'react';

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('🚨 GLOBAL ERROR HANDLER: Unhandled promise rejection caught:', event);
      console.log('🚨 GLOBAL ERROR HANDLER: Reason:', event.reason);
      console.log('🚨 GLOBAL ERROR HANDLER: Reason type:', typeof event.reason);
      console.log('🚨 GLOBAL ERROR HANDLER: Stack:', event.reason?.stack);
      
      // Check if this is a Convex error we should handle
      if (event.reason && typeof event.reason === 'object') {
        const reason = event.reason;
        console.log('🚨 Reason properties:', Object.keys(reason));
        
        // Look for EXISTING_USER error in various formats
        let errorMessage = '';
        if (reason.message && typeof reason.message === 'string') {
          errorMessage = reason.message;
        } else if (typeof reason === 'string') {
          errorMessage = reason;
        } else if (reason.data?.message) {
          errorMessage = reason.data.message;
        }
        
        console.log('🚨 Extracted error message:', errorMessage);
        
        // Check for EXISTING_USER pattern in wrapped error message
        const existingUserMatch = errorMessage.match(/EXISTING_USER:([a-zA-Z0-9]+)/);
        console.log('🚨 GLOBAL ERROR HANDLER: EXISTING_USER match:', existingUserMatch);
        
        if (existingUserMatch) {
          console.log('🎯 GlobalErrorHandler detected EXISTING_USER error');
          // We could dispatch a custom event here that the registration form listens to
          const customEvent = new CustomEvent('convex-existing-user-error', {
            detail: { error: errorMessage, originalEvent: event }
          });
          window.dispatchEvent(customEvent);
        }
      }
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      console.log('🚨 Global error caught by GlobalErrorHandler:', event);
      console.log('🚨 Error message:', event.message);
      console.log('🚨 Error source:', event.filename);
      console.log('🚨 Error line:', event.lineno);
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}