'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Building2, Save, Check, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyBankingSettingsTabProps {
  companyId: string;
  userId: string;
  company: any;
}

const ACCOUNT_TYPES = [
  { value: 'cheque', label: 'Cheque / Current' },
  { value: 'savings', label: 'Savings' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'business', label: 'Business' },
  { value: 'credit', label: 'Credit' },
];

export default function CompanyBankingSettingsTab({ companyId, userId, company }: CompanyBankingSettingsTabProps) {
  const [bankName, setBankName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('cheque');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateBanking = useMutation(api.companies.updateCompanyBanking);

  useEffect(() => {
    if (company?.bankingDetails) {
      const b = company.bankingDetails;
      setBankName(b.bankName || '');
      setBranchCode(b.branchCode || '');
      setAccountType(b.accountType || 'cheque');
      setAccountNumber(b.accountNumber || '');
      setAccountHolder(b.accountHolder || '');
      setSwiftCode(b.swiftCode || '');
    } else if (company?.name) {
      setAccountHolder(company.name);
    }
  }, [company]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateBanking({
        userId: userId as any,
        companyId: companyId as any,
        bankingDetails: {
          bankName: bankName || undefined,
          branchCode: branchCode || undefined,
          accountType: accountType || undefined,
          accountNumber: accountNumber || undefined,
          accountHolder: accountHolder || undefined,
          swiftCode: swiftCode || undefined,
        },
      });
      setSaveSuccess(true);
      toast.success('Banking details saved!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving banking details:', error);
      toast.error('Failed to save banking details');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm";
  const labelStyle = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Banking Details</h2>
        <p className="text-slate-600 text-sm">
          These details will be shown on your invoices so clients know where to make payment.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <strong>Private & Secure.</strong> Banking details are only visible on invoices you send to clients and are not publicly listed on your site.
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Bank Account</h3>
            <p className="text-xs text-slate-500">Required for EFT payments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className={inputStyle}
              placeholder="e.g., First National Bank, Standard Bank"
            />
          </div>

          <div>
            <label className={labelStyle}>Branch Code</label>
            <input
              type="text"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value.replace(/[^0-9]/g, ''))}
              className={inputStyle}
              placeholder="e.g., 250655"
              maxLength={10}
            />
          </div>

          <div>
            <label className={labelStyle}>Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className={inputStyle}
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelStyle}>Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9\- ]/g, ''))}
              className={inputStyle}
              placeholder="e.g., 1234567890"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelStyle}>Account Holder</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className={inputStyle}
              placeholder="Name on the account"
            />
          </div>

          <div>
            <label className={labelStyle}>SWIFT / BIC Code <span className="text-slate-400 font-normal">(Optional, for international payments)</span></label>
            <input
              type="text"
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
              className={inputStyle}
              placeholder="e.g., FIRNZAJJ"
              maxLength={11}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check className="h-4 w-4" />
            Saved successfully
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Banking Details
            </>
          )}
        </button>
      </div>
    </div>
  );
}
