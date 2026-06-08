'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ChevronDown, Check, Save, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar' },
  { code: 'BWP', symbol: 'P', name: 'Botswanan Pula' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
];

const TIMEZONES = [
  { value: 'Africa/Johannesburg', label: 'South Africa (Johannesburg)', offset: 'UTC+2' },
  { value: 'Africa/Lagos', label: 'Nigeria (Lagos)', offset: 'UTC+1' },
  { value: 'Africa/Nairobi', label: 'Kenya (Nairobi)', offset: 'UTC+3' },
  { value: 'Africa/Cairo', label: 'Egypt (Cairo)', offset: 'UTC+2' },
  { value: 'Africa/Dakar', label: 'Senegal (Dakar)', offset: 'UTC+0' },
  { value: 'America/New_York', label: 'USA (New York)', offset: 'UTC-5' },
  { value: 'America/Los_Angeles', label: 'USA (Los Angeles)', offset: 'UTC-8' },
  { value: 'America/Chicago', label: 'USA (Chicago)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'USA (Denver)', offset: 'UTC-7' },
  { value: 'America/Toronto', label: 'Canada (Toronto)', offset: 'UTC-5' },
  { value: 'America/Vancouver', label: 'Canada (Vancouver)', offset: 'UTC-8' },
  { value: 'America/Sao_Paulo', label: 'Brazil (São Paulo)', offset: 'UTC-3' },
  { value: 'America/Buenos_Aires', label: 'Argentina (Buenos Aires)', offset: 'UTC-3' },
  { value: 'America/Mexico_City', label: 'Mexico (Mexico City)', offset: 'UTC-6' },
  { value: 'Europe/London', label: 'UK (London)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'France (Paris)', offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: 'Germany (Berlin)', offset: 'UTC+1' },
  { value: 'Europe/Amsterdam', label: 'Netherlands (Amsterdam)', offset: 'UTC+1' },
  { value: 'Europe/Madrid', label: 'Spain (Madrid)', offset: 'UTC+1' },
  { value: 'Europe/Rome', label: 'Italy (Rome)', offset: 'UTC+1' },
  { value: 'Europe/Moscow', label: 'Russia (Moscow)', offset: 'UTC+3' },
  { value: 'Asia/Dubai', label: 'UAE (Dubai)', offset: 'UTC+4' },
  { value: 'Asia/Mumbai', label: 'India (Mumbai)', offset: 'UTC+5:30' },
  { value: 'Asia/Kolkata', label: 'India (Kolkata)', offset: 'UTC+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: 'UTC+8' },
  { value: 'Asia/Shanghai', label: 'China (Shanghai)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Japan (Tokyo)', offset: 'UTC+9' },
  { value: 'Asia/Seoul', label: 'South Korea (Seoul)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Australia (Sydney)', offset: 'UTC+11' },
  { value: 'Australia/Melbourne', label: 'Australia (Melbourne)', offset: 'UTC+11' },
  { value: 'Australia/Perth', label: 'Australia (Perth)', offset: 'UTC+8' },
  { value: 'Pacific/Auckland', label: 'New Zealand (Auckland)', offset: 'UTC+13' },
  { value: 'Pacific/Honolulu', label: 'USA (Hawaii)', offset: 'UTC-10' },
];

interface CompanyGeneralSettingsTabProps {
  companyId: string;
  userId: string;
  company: any;
}

export default function CompanyGeneralSettingsTab({ companyId, userId, company }: CompanyGeneralSettingsTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [useCustomSymbol, setUseCustomSymbol] = useState(false);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [customSymbol, setCustomSymbol] = useState('');
  const [symbolPosition, setSymbolPosition] = useState<'before' | 'after'>('before');
  const [timezone, setTimezone] = useState('Africa/Johannesburg');
  const [saveTimezoneSuccess, setSaveTimezoneSuccess] = useState(false);

  const updateCurrency = useMutation(api.companies.updateCompanyCurrency);
  const updateTimezone = useMutation(api.companies.updateCompanyTimezone);

  useEffect(() => {
    if (company?.currency) {
      setCurrencyCode(company.currency.code || 'USD');
      setSymbolPosition((company.currency.symbolPosition as 'before' | 'after') || 'before');
      if (company.currency.customSymbol) {
        setCustomSymbol(company.currency.customSymbol);
        setUseCustomSymbol(true);
      }
    }
    if (company?.timezone) {
      setTimezone(company.timezone);
    }
  }, [company]);

  const handleSaveCurrency = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const selectedCurrency = COMMON_CURRENCIES.find(c => c.code === currencyCode);
      const currencyData = {
        code: currencyCode,
        symbol: useCustomSymbol ? customSymbol : selectedCurrency?.symbol,
        symbolPosition: symbolPosition,
        customSymbol: useCustomSymbol ? customSymbol : undefined,
      };
      await updateCurrency({
        userId: userId as any,
        companyId: companyId as any,
        currency: currencyData,
      });
      setSaveSuccess(true);
      toast.success('Currency settings saved!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTimezone = async () => {
    setIsSaving(true);
    setSaveTimezoneSuccess(false);
    try {
      await updateTimezone({
        userId: userId as any,
        companyId: companyId as any,
        timezone: timezone,
      });
      setSaveTimezoneSuccess(true);
      toast.success('Timezone settings saved!');
      setTimeout(() => setSaveTimezoneSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save timezone');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCurrency = COMMON_CURRENCIES.find(c => c.code === currencyCode);
  const displaySymbol = useCustomSymbol ? customSymbol : selectedCurrency?.symbol;

  return (
    <div className="space-y-8">
      {/* Currency Settings */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Currency Settings</h2>
        <p className="text-slate-600 text-sm">Configure how prices are displayed.</p>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-2">Preview</p>
            <div className="flex items-center gap-4 text-2xl font-bold text-slate-900">
              <span>
                {symbolPosition === 'before' && <span className="text-emerald-600">{displaySymbol}</span>}
                {Number(123456.78).toLocaleString()}
                {symbolPosition === 'after' && <span className="text-emerald-600 ml-1">{displaySymbol}</span>}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Example price</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Currency</label>
            <div className="relative">
              <select
                value={currencyCode}
                onChange={(e) => { setCurrencyCode(e.target.value); setUseCustomSymbol(false); }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-slate-900 text-sm">Custom Symbol</h3>
                <p className="text-xs text-slate-500">Use your own symbol</p>
              </div>
              <button
                type="button"
                onClick={() => setUseCustomSymbol(!useCustomSymbol)}
                className={`relative w-12 h-6 rounded-full transition-all ${useCustomSymbol ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${useCustomSymbol ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            {useCustomSymbol && (
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                placeholder="R"
                maxLength={10}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Symbol Position</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSymbolPosition('before')}
                className={`p-3 rounded-xl border-2 ${symbolPosition === 'before' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
              >
                <p className="text-lg font-bold">{displaySymbol}123.45</p>
                <p className="text-xs text-slate-600">Before</p>
              </button>
              <button
                type="button"
                onClick={() => setSymbolPosition('after')}
                className={`p-3 rounded-xl border-2 ${symbolPosition === 'after' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
              >
                <p className="text-lg font-bold">123.45{displaySymbol}</p>
                <p className="text-xs text-slate-600">After</p>
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveCurrency}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50"
          >
            {saveSuccess ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save'}</>}
          </button>
        </div>
      </div>

      {/* Timezone Settings */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-5 w-5 text-slate-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Timezone Settings</h2>
            <p className="text-slate-600 text-sm">Set your company's timezone for scheduled tasks.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-2">Current Timezone</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">
                {TIMEZONES.find(tz => tz.value === timezone)?.label || timezone}
              </span>
              <span className="text-sm text-slate-500">
                {TIMEZONES.find(tz => tz.value === timezone)?.offset}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Timezone</label>
            <div className="relative">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Recurring invoices will be processed based on this timezone at the scheduled time (08:00, 13:00, or 18:00) set on each invoice.
            </p>
          </div>

          <button
            onClick={handleSaveTimezone}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50"
          >
            {saveTimezoneSuccess ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Timezone'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}