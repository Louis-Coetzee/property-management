'use client';

import { useState } from 'react';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Shield,
  ChevronRight,
  Plug,
  Loader2,
  Save,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface BobGoSettings {
  sandboxApiKey: string;
  sandboxApiSecret: string;
  liveApiKey: string;
  liveApiSecret: string;
  sandboxUserEmail: string;
  sandboxUserPassword: string;
  liveUserEmail: string;
  liveUserPassword: string;
  enabled: boolean;
  mode: string;
}

export default function IntegrationsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSandboxKey, setShowSandboxKey] = useState(false);
  const [showSandboxSecret, setShowSandboxSecret] = useState(false);
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [showSandboxUserPassword, setShowSandboxUserPassword] = useState(false);
  const [showLiveUserPassword, setShowLiveUserPassword] = useState(false);

  const [bobgoSettings, setBobgoSettings] = useState<BobGoSettings>({
    sandboxApiKey: '',
    sandboxApiSecret: '',
    liveApiKey: '',
    liveApiSecret: '',
    sandboxUserEmail: '',
    sandboxUserPassword: '',
    liveUserEmail: '',
    liveUserPassword: '',
    enabled: false,
    mode: 'sandbox',
  });

  // Fetch existing BobGo settings
  const bobgoIntegration = useQuery(api.integrations.getBobgoSettings);

  const saveBobgoSettings = useMutation(api.integrations.saveBobgoSettings);

  useEffect(() => {
    if (!authLoading && (!user || (user.userType !== 'admin' && user.userType !== 'administrator'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (bobgoIntegration) {
      const config = bobgoIntegration.config as any;
      setBobgoSettings({
        sandboxApiKey: config?.sandboxApiKey || '',
        sandboxApiSecret: config?.sandboxApiSecret || '',
        liveApiKey: config?.liveApiKey || '',
        liveApiSecret: config?.liveApiSecret || '',
        sandboxUserEmail: config?.sandboxUserEmail || '',
        sandboxUserPassword: config?.sandboxUserPassword || '',
        liveUserEmail: config?.liveUserEmail || '',
        liveUserPassword: config?.liveUserPassword || '',
        enabled: bobgoIntegration.enabled || false,
        mode: bobgoIntegration.mode || 'sandbox',
      });
    }
  }, [bobgoIntegration]);

  useEffect(() => {
    if (authLoading) return;
    if (user && (user.userType === 'admin' || user.userType === 'administrator')) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleSaveBobgo = async () => {
    setIsSaving(true);
    try {
      await saveBobgoSettings({
        sandboxApiKey: bobgoSettings.sandboxApiKey,
        sandboxApiSecret: bobgoSettings.sandboxApiSecret,
        liveApiKey: bobgoSettings.liveApiKey,
        liveApiSecret: bobgoSettings.liveApiSecret,
        sandboxUserEmail: bobgoSettings.sandboxUserEmail,
        sandboxUserPassword: bobgoSettings.sandboxUserPassword,
        liveUserEmail: bobgoSettings.liveUserEmail,
        liveUserPassword: bobgoSettings.liveUserPassword,
        enabled: bobgoSettings.enabled,
        mode: bobgoSettings.mode,
      });
      toast.success('BobGo settings saved successfully!');
    } catch (error) {
      console.error('Error saving BobGo settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || authLoading) {
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
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Admin
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Integrations</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
                <Plug className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Integrations
                </h1>
                <p className="text-slate-600 text-base">
                  Configure third-party services and APIs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* BobGo Integration Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden max-w-4xl">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">BobGo Shipping</h2>
                  <p className="text-orange-100 text-sm">Courier and logistics API</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {bobgoSettings.enabled ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-white/20 text-white/70 text-sm rounded-full">
                    <XCircle className="h-4 w-4" />
                    Disabled
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <h3 className="font-medium text-slate-900">Enable BobGo</h3>
                <p className="text-sm text-slate-500">Turn on BobGo shipping calculations</p>
              </div>
              <button
                onClick={() => setBobgoSettings({ ...bobgoSettings, enabled: !bobgoSettings.enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  bobgoSettings.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    bobgoSettings.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Mode Selection */}
            {bobgoSettings.enabled && (
              <div className="space-y-3">
                <label className="font-medium text-slate-900">Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBobgoSettings({ ...bobgoSettings, mode: 'sandbox' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      bobgoSettings.mode === 'sandbox'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-slate-900">Sandbox</span>
                    </div>
                    <p className="text-xs text-slate-500">Test environment</p>
                  </button>
                  <button
                    onClick={() => setBobgoSettings({ ...bobgoSettings, mode: 'live' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      bobgoSettings.mode === 'live'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-slate-900">Live</span>
                    </div>
                    <p className="text-xs text-slate-500">Production environment</p>
                  </button>
                </div>
              </div>
            )}

            {/* API Credentials */}
            {bobgoSettings.enabled && (
              <div className="space-y-6">
                {/* Sandbox Credentials */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <Key className="h-4 w-4 text-slate-500" />
                    Sandbox Credentials (Testing)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSandboxKey ? 'text' : 'password'}
                          value={bobgoSettings.sandboxApiKey}
                          onChange={(e) => setBobgoSettings({ ...bobgoSettings, sandboxApiKey: e.target.value })}
                          className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter sandbox API key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSandboxKey(!showSandboxKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showSandboxKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        API Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showSandboxSecret ? 'text' : 'password'}
                          value={bobgoSettings.sandboxApiSecret}
                          onChange={(e) => setBobgoSettings({ ...bobgoSettings, sandboxApiSecret: e.target.value })}
                          className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter sandbox API secret"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSandboxSecret(!showSandboxSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showSandboxSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Credentials */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <Key className="h-4 w-4 text-slate-500" />
                    Live Credentials (Production)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showLiveKey ? 'text' : 'password'}
                          value={bobgoSettings.liveApiKey}
                          onChange={(e) => setBobgoSettings({ ...bobgoSettings, liveApiKey: e.target.value })}
                          className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter live API key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLiveKey(!showLiveKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showLiveKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        API Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showLiveSecret ? 'text' : 'password'}
                          value={bobgoSettings.liveApiSecret}
                          onChange={(e) => setBobgoSettings({ ...bobgoSettings, liveApiSecret: e.target.value })}
                          className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter live API secret"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLiveSecret(!showLiveSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showLiveSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Credentials */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <Key className="h-4 w-4 text-slate-500" />
                    User Credentials (for authentication)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Enter your BobGo account email and password. These are required to authenticate and get shipping rates.
                  </p>
                  
                  {/* Sandbox User Credentials */}
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <h4 className="text-sm font-medium text-slate-800 mb-3">Sandbox</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={bobgoSettings.sandboxUserEmail}
                          onChange={(e) => setBobgoSettings({ ...bobgoSettings, sandboxUserEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="sandbox@bobgo.co.za"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSandboxUserPassword ? 'text' : 'password'}
                            value={bobgoSettings.sandboxUserPassword}
                            onChange={(e) => setBobgoSettings({ ...bobgoSettings, sandboxUserPassword: e.target.value })}
                            className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Enter sandbox password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSandboxUserPassword(!showSandboxUserPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showSandboxUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live User Credentials */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-800 mb-3">Live</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={bobgoSettings.liveUserEmail}
                          onChange={(e) => setBobgoSettings({ ...bobgoSettings, liveUserEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showLiveUserPassword ? 'text' : 'password'}
                            value={bobgoSettings.liveUserPassword}
                            onChange={(e) => setBobgoSettings({ ...bobgoSettings, liveUserPassword: e.target.value })}
                            className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Enter live password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLiveUserPassword(!showLiveUserPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showLiveUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">How BobGo Works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Add a shipping option with type "BobGo" in store settings</li>
                    <li>• Configure pickup address on each shipping option</li>
                    <li>• Products must have dimensions (L×W×H in cm) and weight (kg)</li>
                    <li>• Shipping cost is calculated at checkout based on destination</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSaveBobgo}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save BobGo Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}