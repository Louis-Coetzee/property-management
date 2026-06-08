/**
 * Centralized error handling utility to convert technical errors to user-friendly messages
 */

interface ErrorContext {
  action?: 'login' | 'register' | 'verify-email' | 'reset-password' | 'forgot-password' | 'resend-verification' | 'profile-update' | 'password-change' | 'logout' | 'general';
  fallback?: string;
}

/**
 * Extracts and converts technical error messages to user-friendly ones
 */
export function getErrorMessage(error: unknown, context: ErrorContext = {}): string {
  const { action = 'general', fallback } = context;
  
  // Default fallback messages based on action
  const defaultFallbacks: Record<string, string> = {
    login: 'Unable to log in. Please check your credentials and try again.',
    register: 'Registration failed. Please check your information and try again.',
    'verify-email': 'Email verification failed. Please try again or request a new verification email.',
    'reset-password': 'Password reset failed. Please try again or request a new reset link.',
    'forgot-password': 'Unable to send password reset email. Please try again.',
    'resend-verification': 'Unable to send verification email. Please try again.',
    'profile-update': 'Unable to update your profile. Please try again.',
    'password-change': 'Unable to change your password. Please try again.',
    logout: 'Logout failed. Please try refreshing the page.',
    general: 'Something went wrong. Please try again.',
  };

  const defaultFallback = fallback || defaultFallbacks[action] || defaultFallbacks.general;

  // Extract raw error message
  let rawMessage = '';
  if (error instanceof Error) {
    rawMessage = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    rawMessage = (error as { message: string }).message;
  } else if (typeof error === 'string') {
    rawMessage = error;
  }

  if (!rawMessage) {
    return defaultFallback;
  }

  // Clean up Convex error wrapper patterns
  const convexPatterns = [
    /^\[CONVEX [^\]]+\]/,  // Remove [CONVEX M(...)] prefix
    /\[Request ID: [^\]]+\]/,  // Remove [Request ID: ...] 
    /Server Error\s*/,  // Remove "Server Error"
    /Uncaught Error:\s*/,  // Remove "Uncaught Error:"
    /at handler \([^)]+\)/,  // Remove "at handler (...)"
    /Called by client\s*$/,  // Remove "Called by client"
  ];

  let cleanMessage = rawMessage;
  convexPatterns.forEach(pattern => {
    cleanMessage = cleanMessage.replace(pattern, '').trim();
  });

  // Handle specific error patterns and convert to user-friendly messages
  const errorMappings: Array<{ pattern: RegExp | string; message: string }> = [
    // Authentication errors
    { pattern: /password.*incorrect/i, message: 'The password you entered is incorrect. Please try again.' },
    { pattern: /current password.*incorrect/i, message: 'Your current password is incorrect. Please try again.' },
    { pattern: /user not found/i, message: 'Account not found. Please check your email or create a new account.' },
    { pattern: /account.*not.*found/i, message: 'Account not found. Please check your email or create a new account.' },
    { pattern: /no account.*email/i, message: 'No account found with this email address. Please check your email or register for a new account.' },
    
    // Email verification errors
    { pattern: /invalid.*verification.*link/i, message: 'This verification link has expired or is invalid. Please request a new verification email.' },
    { pattern: /expired.*verification.*link/i, message: 'This verification link has expired. Please request a new verification email.' },
    { pattern: /verification.*token.*invalid/i, message: 'This verification link is invalid. Please request a new verification email.' },
    { pattern: /verification.*token.*expired/i, message: 'This verification link has expired. Please request a new verification email.' },
    { pattern: /already.*verified/i, message: 'Your email is already verified! You can proceed to login.' },
    
    // Password reset errors
    { pattern: /invalid.*reset.*token/i, message: 'This password reset link has expired or is invalid. Please request a new password reset.' },
    { pattern: /expired.*reset.*token/i, message: 'This password reset link has expired. Please request a new password reset.' },
    { pattern: /reset.*token.*invalid/i, message: 'This password reset link is invalid. Please request a new password reset.' },
    { pattern: /reset.*token.*expired/i, message: 'This password reset link has expired. Please request a new password reset.' },
    
    // Registration errors
    { pattern: /email.*already.*registered/i, message: 'This email address is already registered. Please try logging in instead.' },
    { pattern: /user.*already.*exists/i, message: 'An account with this email already exists. Please try logging in instead.' },
    { pattern: /already.*account.*domain/i, message: 'You already have an account for this domain. Please login instead.' },
    { pattern: /EXISTING_USER/i, message: 'We found an existing account with this email. Please enter your password to continue.' },
    
    // Domain/access errors
    { pattern: /access.*domain/i, message: 'You don\'t have access to this domain. Please register for this domain first.' },
    { pattern: /register.*domain.*first/i, message: 'You need to register for this domain first before you can log in.' },
    
    // Email sending errors
    { pattern: /failed.*send.*email/i, message: 'Unable to send email. Please try again or contact support if the problem persists.' },
    { pattern: /email.*service.*unavailable/i, message: 'Email service is temporarily unavailable. Please try again later.' },
    
    // Session/authentication state errors
    { pattern: /session.*expired/i, message: 'Your session has expired. Please log in again.' },
    { pattern: /authentication.*required/i, message: 'Please log in to access this feature.' },
    { pattern: /not.*authenticated/i, message: 'Please log in to continue.' },
    
    // Network/connection errors
    { pattern: /network.*error/i, message: 'Network connection failed. Please check your internet connection and try again.' },
    { pattern: /connection.*failed/i, message: 'Connection failed. Please check your internet connection and try again.' },
    { pattern: /timeout/i, message: 'Request timed out. Please try again.' },
    
    // Validation errors
    { pattern: /invalid.*email/i, message: 'Please enter a valid email address.' },
    { pattern: /password.*requirements/i, message: 'Password does not meet the required criteria. Please choose a stronger password.' },
    { pattern: /passwords.*match/i, message: 'Passwords do not match. Please make sure both passwords are identical.' },
    
    // Server errors
    { pattern: /server.*error/i, message: 'A server error occurred. Please try again later.' },
    { pattern: /internal.*error/i, message: 'An internal error occurred. Please try again later.' },
    { pattern: /service.*unavailable/i, message: 'Service is temporarily unavailable. Please try again later.' },
    
    // Rate limiting
    { pattern: /too.*many.*requests/i, message: 'Too many requests. Please wait a moment before trying again.' },
    { pattern: /rate.*limit/i, message: 'You\'re making requests too quickly. Please wait a moment and try again.' },
  ];

  // Find matching error mapping
  for (const mapping of errorMappings) {
    if (typeof mapping.pattern === 'string') {
      if (cleanMessage.toLowerCase().includes(mapping.pattern.toLowerCase())) {
        return mapping.message;
      }
    } else if (mapping.pattern.test(cleanMessage)) {
      return mapping.message;
    }
  }

  // If no specific mapping found, check if the cleaned message is user-friendly enough
  // User-friendly messages should be simple, not contain technical jargon
  const technicalTerms = [
    'convex', 'handler', 'mutation', 'query', 'action', 'ctx.db', 'typescript',
    'undefined', 'null', 'stack trace', 'function', 'await', 'async', 'promise',
    'object', 'array', 'json', 'parse', 'stringify', 'console', 'log', 'error',
    'exception', 'uncaught', 'runtime', 'compile', 'build', 'webpack', 'node',
    '.ts:', '.js:', '.tsx:', '.jsx:', 'line:', 'column:', 'at ', 'Error:', 'Warning:'
  ];

  const containsTechnicalTerms = technicalTerms.some(term => 
    cleanMessage.toLowerCase().includes(term.toLowerCase())
  );

  // If the message contains technical terms or is very short/cryptic, use fallback
  if (containsTechnicalTerms || cleanMessage.length < 5 || !cleanMessage.includes(' ')) {
    return defaultFallback;
  }

  // If the cleaned message seems user-friendly, use it
  return cleanMessage;
}

/**
 * Shorthand functions for specific contexts
 */
export const getLoginError = (error: unknown) => getErrorMessage(error, { action: 'login' });
export const getRegisterError = (error: unknown) => getErrorMessage(error, { action: 'register' });
export const getVerificationError = (error: unknown) => getErrorMessage(error, { action: 'verify-email' });
export const getPasswordResetError = (error: unknown) => getErrorMessage(error, { action: 'reset-password' });
export const getForgotPasswordError = (error: unknown) => getErrorMessage(error, { action: 'forgot-password' });
export const getProfileUpdateError = (error: unknown) => getErrorMessage(error, { action: 'profile-update' });
export const getPasswordChangeError = (error: unknown) => getErrorMessage(error, { action: 'password-change' });
export const getResendVerificationError = (error: unknown) => getErrorMessage(error, { action: 'resend-verification' });