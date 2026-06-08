'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyIntegrationsSettingsTabProps {
  companyId: string;
  userId: string;
  company: any;
}

export default function CompanyIntegrationsSettingsTab({ companyId, userId, company }: CompanyIntegrationsSettingsTabProps) {
  const [payfastEnabled, setPayfastEnabled] = useState(false);
  const [payfastTestMode, setPayfastTestMode] = useState(true);
  const [payfastMerchantId, setPayfastMerchantId] = useState('');
  const [payfastMerchantKey, setPayfastMerchantKey] = useState('');
  const [payfastPassphrase, setPayfastPassphrase] = useState('');

  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paypalTestMode, setPaypalTestMode] = useState(true);
  const [paypalTestClientId, setPaypalTestClientId] = useState('');
  const [paypalTestClientSecret, setPaypalTestClientSecret] = useState('');
  const [paypalLiveClientId, setPaypalLiveClientId] = useState('');
  const [paypalLiveClientSecret, setPaypalLiveClientSecret] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updatePaymentSettings = useMutation(api.companies.updateCompanyPaymentSettings);

  useEffect(() => {
    if (company?.paymentSettings) {
      if (company.paymentSettings.payfast) {
        setPayfastEnabled(company.paymentSettings.payfast.enabled ?? false);
        setPayfastTestMode(company.paymentSettings.payfast.testMode ?? true);
        setPayfastMerchantId(company.paymentSettings.payfast.merchantId || '');
        setPayfastMerchantKey(company.paymentSettings.payfast.merchantKey || '');
        setPayfastPassphrase(company.paymentSettings.payfast.passphrase || '');
      }
      if (company.paymentSettings.paypal) {
        setPaypalEnabled(company.paymentSettings.paypal.enabled ?? false);
        setPaypalTestMode(company.paymentSettings.paypal.testMode ?? true);
        setPaypalTestClientId(company.paymentSettings.paypal.testClientId || '');
        setPaypalTestClientSecret(company.paymentSettings.paypal.testClientSecret || '');
        setPaypalLiveClientId(company.paymentSettings.paypal.liveClientId || '');
        setPaypalLiveClientSecret(company.paymentSettings.paypal.liveClientSecret || '');
      }
    }
  }, [company]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updatePaymentSettings({
        userId: userId as any,
        companyId: companyId as any,
        paymentSettings: {
          payfast: {
            enabled: payfastEnabled,
            testMode: payfastTestMode,
            merchantId: payfastMerchantId.trim() || undefined,
            merchantKey: payfastMerchantKey.trim() || undefined,
            passphrase: payfastPassphrase.trim() || undefined,
          },
          paypal: {
            enabled: paypalEnabled,
            testMode: paypalTestMode,
            testClientId: paypalTestClientId.trim() || undefined,
            testClientSecret: paypalTestClientSecret.trim() || undefined,
            liveClientId: paypalLiveClientId.trim() || undefined,
            liveClientSecret: paypalLiveClientSecret.trim() || undefined,
          },
        },
      });
      setSaveSuccess(true);
      toast.success('Payment settings saved!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Integrations</h2>
        <p className="text-slate-600 text-sm">Configure payment gateway settings.</p>
      </div>

      <div className="border-t border-slate-200 pt-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">PayFast</h3>
              <p className="text-sm text-slate-500">South African payment gateway (ZAR)</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium">Enable</span>
              <div className="relative">
                <input type="checkbox" checked={payfastEnabled} onChange={(e) => setPayfastEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </div>
            </label>
          </div>

          {payfastEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-200">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">Test Mode</p>
                    <p className="text-xs text-slate-500">Use PayFast sandbox</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" checked={payfastTestMode} onChange={(e) => setPayfastTestMode(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Merchant ID</label>
                  <input type="text" value={payfastMerchantId} onChange={(e) => setPayfastMerchantId(e.target.value)} placeholder={payfastTestMode ? '10000100' : 'Enter merchant ID'} className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Merchant Key</label>
                  <input type="text" value={payfastMerchantKey} onChange={(e) => setPayfastMerchantKey(e.target.value)} placeholder={payfastTestMode ? '46f0cd694581a' : 'Enter merchant key'} className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Passphrase (Optional)</label>
                <input type="text" value={payfastPassphrase} onChange={(e) => setPayfastPassphrase(e.target.value)} placeholder="Enter passphrase" className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">PayPal</h3>
              <p className="text-sm text-slate-500">International payment gateway</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium">Enable</span>
              <div className="relative">
                <input type="checkbox" checked={paypalEnabled} onChange={(e) => setPaypalEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </div>
            </label>
          </div>

          {paypalEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-200">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div><p className="text-sm font-medium">Test Mode</p></div>
                  <div className="relative">
                    <input type="checkbox" checked={paypalTestMode} onChange={(e) => setPaypalTestMode(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>

              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <h4 className="text-sm font-medium">Test Credentials</h4>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">SANDBOX</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Client ID</label>
                    <input type="text" value={paypalTestClientId} onChange={(e) => setPaypalTestClientId(e.target.value)} placeholder="Sandbox client ID" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Secret</label>
                    <input type="password" value={paypalTestClientSecret} onChange={(e) => setPaypalTestClientSecret(e.target.value)} placeholder="Sandbox secret" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <h4 className="text-sm font-medium">Live Credentials</h4>
                  <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full">PRODUCTION</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Live Client ID</label>
                    <input type="text" value={paypalLiveClientId} onChange={(e) => setPaypalLiveClientId(e.target.value)} placeholder="Live client ID" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Live Secret</label>
                    <input type="password" value={paypalLiveClientSecret} onChange={(e) => setPaypalLiveClientSecret(e.target.value)} placeholder="Live secret" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50">
          {saveSuccess ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}</>}
        </button>
      </div>
    </div>
  );
}