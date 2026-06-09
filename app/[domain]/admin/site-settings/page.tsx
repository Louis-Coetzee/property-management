'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Settings,
  Save,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Plus,
  X,
  CreditCard,
  Bell,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  siteMode: {
    comingSoonEnabled: false,
    comingSoonMessage: '',
    comingSoonAutoDisableAt: '',
    maintenanceEnabled: false,
    maintenanceMessage: '',
    maintenanceAutoDisableAt: '',
  },
  socialMedia: {
    facebook: '',
    facebookEnabled: true,
    instagram: '',
    instagramEnabled: true,
    twitter: '',
    twitterEnabled: true,
    linkedin: '',
    linkedinEnabled: false,
    youtube: '',
    youtubeEnabled: false,
  },
  adminNotificationEmails: [] as string[],
  payment: {
    bookingPaymentBankName: '',
    bookingPaymentAccountHolder: '',
    bookingPaymentAccountNumber: '',
    bookingPaymentBranchCode: '',
    bookingPaymentAccountType: 'current',
    bookingPaymentSwiftCode: '',
    bookingPaymentReference: '[BOOKING_CODE]',
    bookingPaymentInstructions: '',
    defaultPaymentGateway: 'payfast' as 'payfast' | 'paygate',
    payfast: {
      enabled: false,
      liveMode: false,
      merchantId: '',
      merchantKey: '',
      passphrase: '',
    },
    paygate: {
      enabled: false,
      liveMode: false,
      payGateId: '',
      encryptionKey: '',
    },
    notificationEmails: [] as string[],
  },
};

export default function SiteSettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const router = useRouter();
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [newEmail, setNewEmail] = useState('');
  const [newPaymentEmail, setNewPaymentEmail] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const existingSettings = useQuery(api.siteSettings.getSiteSettings, { key: 'platform' });
  const upsertSettings = useMutation(api.siteSettings.upsertSiteSettings);

  useEffect(() => {
    if (!isLoading && (!user || (user.userType !== 'admin' && user.userType !== 'administrator'))) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (existingSettings) {
      const loaded = { ...DEFAULT_SETTINGS, ...existingSettings.settings };
      setSettings(loaded);
    }
  }, [existingSettings]);

  const updateSettings = (path: string, value: any) => {
    setSettings((prev: any) => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertSettings({
        key: 'platform',
        settings,
        updatedBy: user?.id as any,
      });
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addAdminEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (settings.adminNotificationEmails.includes(newEmail)) {
      toast.error('Email already exists');
      return;
    }
    updateSettings('adminNotificationEmails', [...settings.adminNotificationEmails, newEmail]);
    setNewEmail('');
  };

  const removeAdminEmail = (email: string) => {
    updateSettings('adminNotificationEmails', settings.adminNotificationEmails.filter((e: string) => e !== email));
  };

  const addPaymentEmail = () => {
    if (!newPaymentEmail || !newPaymentEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (settings.payment.notificationEmails.includes(newPaymentEmail)) {
      toast.error('Email already exists');
      return;
    }
    updateSettings('payment.notificationEmails', [...settings.payment.notificationEmails, newPaymentEmail]);
    setNewPaymentEmail('');
  };

  const removePaymentEmail = (email: string) => {
    updateSettings('payment.notificationEmails', settings.payment.notificationEmails.filter((e: string) => e !== email));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (user.userType !== 'admin' && user.userType !== 'administrator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link href="/admin" className="text-slate-500 hover:text-slate-700 transition-colors">Admin</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">Site Settings</span>
          </div>
          <div className="pb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-slate-600" />
                  Site Settings
                </h1>
                <p className="text-slate-500 text-sm">Manage Find Accommodation platform settings</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="flex items-center gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payment">Payment Gateway</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            {/* Coming Soon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Coming Soon Mode
                </CardTitle>
                <CardDescription>Show a coming soon page to all visitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Coming Soon</Label>
                  <Switch
                    checked={settings.siteMode.comingSoonEnabled}
                    onCheckedChange={(checked) => updateSettings('siteMode.comingSoonEnabled', checked)}
                  />
                </div>
                {settings.siteMode.comingSoonEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Coming Soon Message</Label>
                      <Textarea
                        value={settings.siteMode.comingSoonMessage}
                        onChange={(e) => updateSettings('siteMode.comingSoonMessage', e.target.value)}
                        placeholder="We're working on something amazing. Stay tuned!"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-Disable At (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={settings.siteMode.comingSoonAutoDisableAt}
                        onChange={(e) => updateSettings('siteMode.comingSoonAutoDisableAt', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Maintenance Mode
                </CardTitle>
                <CardDescription>Show a maintenance page to all visitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Maintenance</Label>
                  <Switch
                    checked={settings.siteMode.maintenanceEnabled}
                    onCheckedChange={(checked) => updateSettings('siteMode.maintenanceEnabled', checked)}
                  />
                </div>
                {settings.siteMode.maintenanceEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Maintenance Message</Label>
                      <Textarea
                        value={settings.siteMode.maintenanceMessage}
                        onChange={(e) => updateSettings('siteMode.maintenanceMessage', e.target.value)}
                        placeholder="We're currently performing maintenance. Please check back later."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-Disable At (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={settings.siteMode.maintenanceAutoDisableAt}
                        onChange={(e) => updateSettings('siteMode.maintenanceAutoDisableAt', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Manage your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
                  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
                  { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/...' },
                  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/...' },
                  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/...' },
                ].map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="flex items-center gap-4">
                    <Icon className="h-5 w-5 text-slate-400 w-8" />
                    <div className="flex-1">
                      <Input
                        value={settings.socialMedia[key] || ''}
                        onChange={(e) => updateSettings(`socialMedia.${key}`, e.target.value)}
                        placeholder={placeholder}
                      />
                    </div>
                    <Switch
                      checked={settings.socialMedia[`${key}Enabled`]}
                      onCheckedChange={(checked) => updateSettings(`socialMedia.${key}Enabled`, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Admin Notification Emails
                </CardTitle>
                <CardDescription>Emails that receive notifications for new listings and inquiries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@example.com"
                    onKeyDown={(e) => e.key === 'Enter' && addAdminEmail()}
                  />
                  <Button onClick={addAdminEmail} size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {settings.adminNotificationEmails.map((email: string) => (
                    <div key={email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{email}</span>
                      </div>
                      <button onClick={() => removeAdminEmail(email)} className="text-slate-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {settings.adminNotificationEmails.length === 0 && (
                    <p className="text-sm text-slate-400 italic">No admin notification emails configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Gateway */}
          <TabsContent value="payment" className="space-y-6">
            {/* Booking Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Booking Payment Details
                </CardTitle>
                <CardDescription>Bank account details sent to clients for manual booking payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={settings.payment.bookingPaymentBankName}
                      onChange={(e) => updateSettings('payment.bookingPaymentBankName', e.target.value)}
                      placeholder="e.g. Standard Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Holder</Label>
                    <Input
                      value={settings.payment.bookingPaymentAccountHolder}
                      onChange={(e) => updateSettings('payment.bookingPaymentAccountHolder', e.target.value)}
                      placeholder="Account holder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={settings.payment.bookingPaymentAccountNumber}
                      onChange={(e) => updateSettings('payment.bookingPaymentAccountNumber', e.target.value)}
                      placeholder="Account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch Code</Label>
                    <Input
                      value={settings.payment.bookingPaymentBranchCode}
                      onChange={(e) => updateSettings('payment.bookingPaymentBranchCode', e.target.value)}
                      placeholder="Branch code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <select
                      value={settings.payment.bookingPaymentAccountType}
                      onChange={(e) => updateSettings('payment.bookingPaymentAccountType', e.target.value)}
                      className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="current">Current</option>
                      <option value="savings">Savings</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Swift Code (optional)</Label>
                    <Input
                      value={settings.payment.bookingPaymentSwiftCode}
                      onChange={(e) => updateSettings('payment.bookingPaymentSwiftCode', e.target.value)}
                      placeholder="For international payments"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment Reference Format</Label>
                  <Input
                    value={settings.payment.bookingPaymentReference}
                    onChange={(e) => updateSettings('payment.bookingPaymentReference', e.target.value)}
                    placeholder="[BOOKING_CODE]"
                  />
                  <p className="text-xs text-slate-400">Use [BOOKING_CODE] as placeholder for the booking reference</p>
                </div>
                <div className="space-y-2">
                  <Label>Payment Instructions</Label>
                  <Textarea
                    value={settings.payment.bookingPaymentInstructions}
                    onChange={(e) => updateSettings('payment.bookingPaymentInstructions', e.target.value)}
                    placeholder="Additional payment instructions for booking confirmation emails"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Default Gateway */}
            <Card>
              <CardHeader>
                <CardTitle>Default Payment Gateway</CardTitle>
                <CardDescription>Select which payment gateway is used by default</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {(['payfast', 'paygate'] as const).map((gw) => (
                    <button
                      key={gw}
                      onClick={() => updateSettings('payment.defaultPaymentGateway', gw)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        settings.payment.defaultPaymentGateway === gw
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold capitalize">{gw}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PayFast */}
            <Card>
              <CardHeader>
                <CardTitle>PayFast Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable PayFast</Label>
                  <Switch
                    checked={settings.payment.payfast.enabled}
                    onCheckedChange={(checked) => updateSettings('payment.payfast.enabled', checked)}
                  />
                </div>
                {settings.payment.payfast.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Live Mode</Label>
                      <Switch
                        checked={settings.payment.payfast.liveMode}
                        onCheckedChange={(checked) => updateSettings('payment.payfast.liveMode', checked)}
                      />
                    </div>
                    {!settings.payment.payfast.liveMode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                        Using test credentials: Merchant ID 10023443
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Merchant ID {settings.payment.payfast.liveMode && '*'}</Label>
                        <Input
                          value={settings.payment.payfast.merchantId}
                          onChange={(e) => updateSettings('payment.payfast.merchantId', e.target.value)}
                          placeholder="Merchant ID"
                          type={settings.payment.payfast.liveMode ? 'password' : 'text'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Merchant Key {settings.payment.payfast.liveMode && '*'}</Label>
                        <Input
                          value={settings.payment.payfast.merchantKey}
                          onChange={(e) => updateSettings('payment.payfast.merchantKey', e.target.value)}
                          placeholder="Merchant Key"
                          type="password"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Passphrase (optional)</Label>
                      <Input
                        value={settings.payment.payfast.passphrase}
                        onChange={(e) => updateSettings('payment.payfast.passphrase', e.target.value)}
                        placeholder="Passphrase"
                        type="password"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Paygate */}
            <Card>
              <CardHeader>
                <CardTitle>Paygate Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Paygate</Label>
                  <Switch
                    checked={settings.payment.paygate.enabled}
                    onCheckedChange={(checked) => updateSettings('payment.paygate.enabled', checked)}
                  />
                </div>
                {settings.payment.paygate.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Live Mode</Label>
                      <Switch
                        checked={settings.payment.paygate.liveMode}
                        onCheckedChange={(checked) => updateSettings('payment.paygate.liveMode', checked)}
                      />
                    </div>
                    {!settings.payment.paygate.liveMode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                        Using test credentials: PayGate ID 10011072130
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>PayGate ID {settings.payment.paygate.liveMode && '*'}</Label>
                        <Input
                          value={settings.payment.paygate.payGateId}
                          onChange={(e) => updateSettings('payment.paygate.payGateId', e.target.value)}
                          placeholder="PayGate ID"
                          type={settings.payment.paygate.liveMode ? 'password' : 'text'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Encryption Key {settings.payment.paygate.liveMode && '*'}</Label>
                        <Input
                          value={settings.payment.paygate.encryptionKey}
                          onChange={(e) => updateSettings('payment.paygate.encryptionKey', e.target.value)}
                          placeholder="Encryption Key"
                          type="password"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Notification Emails */}
            {(settings.payment.payfast.enabled || settings.payment.paygate.enabled) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    Payment Notification Emails
                  </CardTitle>
                  <CardDescription>Emails that receive payment success notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newPaymentEmail}
                      onChange={(e) => setNewPaymentEmail(e.target.value)}
                      placeholder="payments@example.com"
                      onKeyDown={(e) => e.key === 'Enter' && addPaymentEmail()}
                    />
                    <Button onClick={addPaymentEmail} size="sm" className="flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {settings.payment.notificationEmails.map((email: string) => (
                      <div key={email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{email}</span>
                        </div>
                        <button onClick={() => removePaymentEmail(email)} className="text-slate-400 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {settings.payment.notificationEmails.length === 0 && (
                      <p className="text-sm text-slate-400 italic">No payment notification emails configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
