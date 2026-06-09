// Environment variables with better validation and fallbacks
export const env = {
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "RefreshTech <no-reply@online-site.co.za>",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : "https://refreshproperty.vercel.app"),
  USE_TEST_EMAIL: process.env.USE_TEST_EMAIL === 'true',
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_PLATFORM_DOMAIN: process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'refreshproperty.vercel.app',
};

// Validation function to check if required environment variables are set
export function validateEmailConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!env.RESEND_API_KEY) {
    errors.push("RESEND_API_KEY is not set");
  } else if (env.RESEND_API_KEY.length < 10) {
    errors.push("RESEND_API_KEY appears to be invalid (too short)");
  }

  if (!env.EMAIL_FROM) {
    errors.push("EMAIL_FROM/RESEND_FROM_EMAIL is required but not set");
  } else if (env.EMAIL_FROM === "onboarding@resend.dev") {
    warnings.push("EMAIL_FROM is using default Resend email - consider setting a custom from address");
  }

  if (env.USE_TEST_EMAIL && env.NODE_ENV === 'production') {
    warnings.push("USE_TEST_EMAIL is enabled in production - emails will go to test address");
  }

  if (warnings.length > 0) {
    console.warn("Email configuration warnings:", warnings);
  }

  if (errors.length > 0) {
    console.error("Email configuration errors:", errors);
    return false;
  }

  return true;
}

// Debug function to check email configuration
export function debugEmailConfig() {
  return {
    hasResendKey: !!env.RESEND_API_KEY,
    resendKeyLength: env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0,
    emailFrom: env.EMAIL_FROM,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    useTestEmail: env.USE_TEST_EMAIL,
    nodeEnv: env.NODE_ENV,
    isValid: validateEmailConfig()
  };
}
