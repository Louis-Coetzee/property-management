import { action } from "./_generated/server";
import { v } from "convex/values";

// Email sending action that can be called from mutations
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    verificationToken: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real application, you would call your email service here
    // For now, we'll simulate email sending
    console.log(`Sending verification email to ${args.email} for domain ${args.domain}`);
    console.log(`Verification token: ${args.verificationToken}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: "Verification email sent successfully",
    };
  },
});

export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    resetToken: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real application, you would call your email service here
    console.log(`Sending password reset email to ${args.email} for domain ${args.domain}`);
    console.log(`Reset token: ${args.resetToken}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: "Password reset email sent successfully",
    };
  },
});
