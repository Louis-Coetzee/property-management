'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function NotificationSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const subscribeToNewsletter = useMutation(api.newsletter.subscribe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;

      const result = await subscribeToNewsletter({
        email: email.trim(),
        source: 'coming_soon',
        userAgent,
      });

      if (result.success) {
        setIsSubmitted(true);
        setEmail('');
        toast.success("Thank you! We'll notify you when we launch.");
      }
    } catch (error: any) {
      console.error('Error submitting email:', error);

      if (error?.message?.includes('already subscribed')) {
        toast.error('This email is already on our notification list');
      } else if (error?.message?.includes('Invalid email')) {
        toast.error('Please enter a valid email address');
      } else {
        toast.error('Failed to sign up for notifications. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-2 border-green-200">
        <CardContent className="p-8">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              You're All Set!
            </h3>
            <p className="text-gray-600">
              We'll send you an email as soon as we launch. Get ready for something amazing!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-green-200">
      <CardContent className="p-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get notified when we launch and receive exclusive early access
            </h3>
            <p className="text-gray-600">
              Be the first to know when we're ready for you!
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 bg-white"
                disabled={isSubmitting}
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Notify Me
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
