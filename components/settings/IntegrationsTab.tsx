'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Zap, Check, Loader2, FileText, X, Info, Key, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface IntegrationsTabProps {
  website: {
    _id: Id<"websites">;
    integrations?: {
      autoTrader?: boolean;
      easyQuotes?: boolean | {
        enabled: boolean;
        formIds?: Id<"forms">[];
        mode?: string;
        liveCredentials?: {
          username?: string;
          password?: string;
          clientId?: string;
          clientSecret?: string;
          dealerId?: string;
        };
      };
    };
  };
  userId: string;
}

interface IntegrationConfig {
  id: 'autoTrader' | 'easyQuotes';
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

interface Form {
  _id: Id<"forms">;
  name: string;
  fields?: FormField[];
}

// Test credentials (read-only)
const TEST_CREDENTIALS = {
  username: 'ESTest',
  password: 'eb7475f7-92b8-4dd8-8cdd-deb70e0f081b',
  clientId: 'b3259840-0b2e-4ed7-b928-7774bcfea500',
  clientSecret: 'sLf5YNNdTFLDyUrVD7MTtTLYsQqPfpbdkLPfmCE2wdpztpqDRK',
  dealerId: '355',
};

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'autoTrader',
    name: 'Auto Trader',
    description: 'Enable integration with Auto Trader to automatically sync your vehicle inventory.',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: 'easyQuotes',
    name: 'Easy Quotes',
    description: 'Enable Easy Quotes integration to provide instant quote generation for your customers.',
    icon: <Zap className="h-5 w-5" />,
  },
];

// Helper function to check if a form has the required fields for EasyQuotes
const hasRequiredFieldsForEasyQuotes = (form: Form): boolean => {
  if (!form.fields || form.fields.length === 0) {
    return false;
  }

  const fieldLabels = form.fields.map(f => f.label.toLowerCase());

  // Check for first name field (required, not optional)
  const hasFirstName = form.fields.some(
    f => f.required && (
      f.label.toLowerCase().includes('first name') ||
      f.label.toLowerCase() === 'first name' ||
      f.id.toLowerCase().includes('firstname') ||
      f.id.toLowerCase().includes('first_name')
    )
  );

  // Check for last name field (required, not optional)
  const hasLastName = form.fields.some(
    f => f.required && (
      f.label.toLowerCase().includes('last name') ||
      f.label.toLowerCase() === 'last name' ||
      f.id.toLowerCase().includes('lastname') ||
      f.id.toLowerCase().includes('last_name')
    )
  );

  // Check for contact number field (required, not optional)
  const hasContactNumber = form.fields.some(
    f => f.required && (
      f.label.toLowerCase().includes('contact number') ||
      f.label.toLowerCase().includes('contact') ||
      f.label.toLowerCase().includes('phone') ||
      f.label.toLowerCase().includes('mobile') ||
      f.type === 'tel'
    )
  );

  return hasFirstName && hasLastName && hasContactNumber;
};

// Credential input field component
const CredentialField = ({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  readOnly?: boolean;
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
        <Key className="h-4 w-4 text-slate-700" />
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 ${
            readOnly ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''
          }`}
        />
      </div>
    </div>
  );
};

export function IntegrationsTab({ website, userId }: IntegrationsTabProps) {
  // Extract easyQuotes settings - handle both old boolean format and new object format
  const easyQuotesSetting = website.integrations?.easyQuotes;
  const isEasyQuotesEnabled = typeof easyQuotesSetting === 'boolean'
    ? easyQuotesSetting
    : easyQuotesSetting?.enabled ?? false;
  const easyQuotesFormIds = typeof easyQuotesSetting === 'object' && easyQuotesSetting?.formIds
    ? easyQuotesSetting.formIds
    : [];
  const easyQuotesMode = typeof easyQuotesSetting === 'object' && easyQuotesSetting?.mode
    ? easyQuotesSetting.mode
    : 'test';
  const existingLiveCredentials = typeof easyQuotesSetting === 'object' && easyQuotesSetting?.liveCredentials
    ? easyQuotesSetting.liveCredentials
    : {};

  const [autoTrader, setAutoTrader] = useState(website.integrations?.autoTrader ?? false);
  const [easyQuotes, setEasyQuotes] = useState(isEasyQuotesEnabled);
  const [selectedEasyQuotesFormIds, setSelectedEasyQuotesFormIds] = useState<Id<"forms">[]>(easyQuotesFormIds);
  const [easyQuotesModeState, setEasyQuotesModeState] = useState<'test' | 'live'>(easyQuotesMode as 'test' | 'live' || 'test');

  // Live credentials state - use masked placeholders for existing values
  const MASKED_VALUE = '••••••••••••';
  const hasExistingCredentials = Object.values(existingLiveCredentials).some(v => v && v.length > 0);

  const [liveUsername, setLiveUsername] = useState('');
  const [livePassword, setLivePassword] = useState('');
  const [liveClientId, setLiveClientId] = useState('');
  const [liveClientSecret, setLiveClientSecret] = useState('');
  const [liveDealerId, setLiveDealerId] = useState('');

  // Track which fields have been modified by the user
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateIntegrations = useMutation(api.websites.updateWebsiteIntegrations);

  // Fetch all forms for the website
  const forms = useQuery(api.forms.getFormsByWebsite, {
    userId: userId as any,
    websiteId: website._id,
  });

  // Filter forms that are eligible for EasyQuotes (have required fields)
  const eligibleForms = useMemo(() => {
    if (!forms) return [];
    return forms.filter(hasRequiredFieldsForEasyQuotes);
  }, [forms]);

  // Update local state when website data changes
  useEffect(() => {
    if (website.integrations) {
      setAutoTrader(website.integrations.autoTrader ?? false);
      const eqSetting = website.integrations.easyQuotes;
      setEasyQuotes(typeof eqSetting === 'boolean' ? eqSetting : eqSetting?.enabled ?? false);
      if (typeof eqSetting === 'object') {
        if (eqSetting?.formIds) {
          setSelectedEasyQuotesFormIds(eqSetting.formIds);
        }
        if (eqSetting?.mode) {
          setEasyQuotesModeState(eqSetting.mode as 'test' | 'live');
        }
        // Don't load encrypted credentials into state - they're encrypted in the database
        // We'll track whether credentials exist but show masked placeholders
      }
    }
  }, [website]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Build live credentials object - only include modified fields
      let liveCredentialsToSave = undefined;
      if (easyQuotesModeState === 'live' && modifiedFields.size > 0) {
        liveCredentialsToSave = {
          username: modifiedFields.has('username') ? liveUsername : undefined,
          password: modifiedFields.has('password') ? livePassword : undefined,
          clientId: modifiedFields.has('clientId') ? liveClientId : undefined,
          clientSecret: modifiedFields.has('clientSecret') ? liveClientSecret : undefined,
          dealerId: modifiedFields.has('dealerId') ? liveDealerId : undefined,
        };
      }

      // Update integrations
      await updateIntegrations({
        userId: userId as any,
        websiteId: website._id,
        integrations: {
          autoTrader,
          easyQuotes: {
            enabled: easyQuotes,
            formIds: easyQuotes ? selectedEasyQuotesFormIds : [],
            mode: easyQuotesModeState,
            liveCredentials: liveCredentialsToSave,
          },
        },
      });

      // Reset modified fields after successful save
      setModifiedFields(new Set());

      setSaveSuccess(true);
      toast.success('Integration settings saved successfully!', {
        duration: 3000,
        position: 'top-right',
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save integration settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save integration settings. Please try again.', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    const currentEasyQuotesEnabled = isEasyQuotesEnabled;
    const currentEasyQuotesFormIds = easyQuotesFormIds;
    const currentMode = easyQuotesMode as 'test' | 'live' || 'test';

    return (
      autoTrader !== (website.integrations?.autoTrader ?? false) ||
      easyQuotes !== currentEasyQuotesEnabled ||
      easyQuotesModeState !== currentMode ||
      JSON.stringify(selectedEasyQuotesFormIds.sort()) !== JSON.stringify(currentEasyQuotesFormIds.sort()) ||
      modifiedFields.size > 0
    );
  };

  // Helper to mark a field as modified
  const markFieldModified = (field: string) => {
    setModifiedFields(prev => new Set(prev).add(field));
  };

  // Get display value for credential fields
  const getCredentialDisplayValue = (fieldName: string, currentValue: string): string => {
    const hasExisting = Object.keys(existingLiveCredentials).length > 0 &&
                        existingLiveCredentials[fieldName as keyof typeof existingLiveCredentials];

    if (hasExisting && !modifiedFields.has(fieldName)) {
      return MASKED_VALUE;
    }
    return currentValue;
  };

  const handleAddEasyQuotesForm = (formId: string) => {
    if (formId && !selectedEasyQuotesFormIds.includes(formId as Id<"forms">)) {
      setSelectedEasyQuotesFormIds([...selectedEasyQuotesFormIds, formId as Id<"forms">]);
    }
  };

  const handleRemoveEasyQuotesForm = (formId: Id<"forms">) => {
    setSelectedEasyQuotesFormIds(selectedEasyQuotesFormIds.filter(id => id !== formId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Integrations</h2>
        <p className="text-slate-600 text-sm">Manage third-party integrations for your website.</p>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="space-y-4">
          {INTEGRATIONS.map((integration) => {
            const isEnabled = integration.id === 'autoTrader' ? autoTrader : easyQuotes;
            const setEnabled = integration.id === 'autoTrader' ? setAutoTrader : setEasyQuotes;

            return (
              <div
                key={integration.id}
                className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{integration.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{integration.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => setEnabled(!isEnabled)}
                  className={`
                    relative w-12 h-7 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                    ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300'}
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200
                      ${isEnabled ? 'right-0.5' : 'left-0.5'}
                    `}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* EasyQuotes Form Selection & Configuration */}
      {easyQuotes && (
        <div className="border-t border-slate-200 pt-6 space-y-8">
          {/* Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">EasyQuotes Mode</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Select between test mode (for testing) and live mode (for production)
                </p>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setEasyQuotesModeState('test')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    easyQuotesModeState === 'test'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Test Mode
                </button>
                <button
                  onClick={() => setEasyQuotesModeState('live')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    easyQuotesModeState === 'live'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Mode
                </button>
              </div>
            </div>

            {/* Test Credentials Display */}
            {easyQuotesModeState === 'test' && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Test Credentials</p>
                    <p className="text-sm text-amber-700">
                      These are the predefined test credentials. They cannot be modified.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CredentialField
                    label="Username"
                    value={TEST_CREDENTIALS.username}
                    onChange={() => {}}
                    placeholder="Username"
                    readOnly
                  />
                  <CredentialField
                    label="Password"
                    value={TEST_CREDENTIALS.password}
                    onChange={() => {}}
                    placeholder="Password"
                    readOnly
                  />
                  <CredentialField
                    label="Client ID"
                    value={TEST_CREDENTIALS.clientId}
                    onChange={() => {}}
                    placeholder="Client ID"
                    readOnly
                  />
                  <CredentialField
                    label="Client Secret"
                    value={TEST_CREDENTIALS.clientSecret}
                    onChange={() => {}}
                    placeholder="Client Secret"
                    readOnly
                  />
                  <CredentialField
                    label="Dealer ID"
                    value={TEST_CREDENTIALS.dealerId}
                    onChange={() => {}}
                    placeholder="Dealer ID"
                    readOnly
                  />
                </div>
              </div>
            )}

            {/* Live Credentials Input */}
            {easyQuotesModeState === 'live' && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900 mb-1">Live Credentials</p>
                    <p className="text-sm text-emerald-700">
                      Enter your production EasyQuotes credentials below. These will be securely encrypted and stored.
                      {hasExistingCredentials && ' Fields showing •••••••••••• have saved values. Leave them unchanged to keep existing values.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CredentialField
                    label="Username"
                    value={getCredentialDisplayValue('username', liveUsername)}
                    onChange={(val) => { setLiveUsername(val); markFieldModified('username'); }}
                    placeholder="Enter your live username"
                  />
                  <CredentialField
                    label="Password"
                    value={getCredentialDisplayValue('password', livePassword)}
                    onChange={(val) => { setLivePassword(val); markFieldModified('password'); }}
                    placeholder="Enter your live password"
                  />
                  <CredentialField
                    label="Client ID"
                    value={getCredentialDisplayValue('clientId', liveClientId)}
                    onChange={(val) => { setLiveClientId(val); markFieldModified('clientId'); }}
                    placeholder="Enter your live client ID"
                  />
                  <CredentialField
                    label="Client Secret"
                    value={getCredentialDisplayValue('clientSecret', liveClientSecret)}
                    onChange={(val) => { setLiveClientSecret(val); markFieldModified('clientSecret'); }}
                    placeholder="Enter your live client secret"
                  />
                  <CredentialField
                    label="Dealer ID"
                    value={getCredentialDisplayValue('dealerId', liveDealerId)}
                    onChange={(val) => { setLiveDealerId(val); markFieldModified('dealerId'); }}
                    placeholder="Enter your live dealer ID"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Selection */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">EasyQuotes Form Selection</h3>
            <p className="text-sm text-slate-600 mb-4">
              Select which forms should have EasyQuotes integration enabled. Only forms with the required fields are eligible.
            </p>

            {/* Requirements info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Required Fields</p>
                  <p className="text-sm text-blue-700">
                    To enable EasyQuotes on a form, it must have the following <strong>required</strong> fields:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc space-y-1">
                    <li>First Name</li>
                    <li>Last Name</li>
                    <li>Contact Number (Phone/Mobile)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Add Form to EasyQuotes
              </label>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddEasyQuotesForm(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white text-slate-900"
                disabled={eligibleForms.length === 0 || selectedEasyQuotesFormIds.length === eligibleForms.length}
              >
                <option value="" disabled>
                  {eligibleForms.length === 0
                    ? 'No eligible forms available'
                    : selectedEasyQuotesFormIds.length === eligibleForms.length
                    ? 'All eligible forms already added'
                    : 'Select a form to add...'}
                </option>
                {eligibleForms
                  .filter(form => !selectedEasyQuotesFormIds.includes(form._id))
                  .map((form) => (
                    <option key={form._id} value={form._id as string}>
                      {form.name} ({form.fields?.length || 0} fields)
                    </option>
                  ))}
              </select>
              <p className="text-xs text-slate-500 mt-1.5">
                Only forms with required first name, last name, and contact number fields are shown
              </p>
            </div>

            {/* Selected forms as tags */}
            {selectedEasyQuotesFormIds.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Enabled Forms ({selectedEasyQuotesFormIds.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedEasyQuotesFormIds.map((formId) => {
                    const form = forms?.find(f => f._id === formId);
                    return form ? (
                      <div
                        key={formId}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium"
                      >
                        <FileText className="h-4 w-4" />
                        {form.name}
                        <button
                          onClick={() => handleRemoveEasyQuotesForm(formId)}
                          className="ml-1 hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                          title="Remove form"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {selectedEasyQuotesFormIds.length === 0 && eligibleForms.length > 0 && (
              <p className="text-sm text-slate-500 italic">
                No forms selected. Add a form from the dropdown above to enable EasyQuotes.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="border-t border-slate-200 pt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges() || isSaving}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
            hasChanges() && !isSaving
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
        {!hasChanges() && !isSaving && (
          <span className="text-sm text-slate-500">No changes to save</span>
        )}
      </div>
    </div>
  );
}
