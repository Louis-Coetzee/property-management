'use client';

import { useState } from 'react';
import { Send, Check, X, Loader2, Eye, EyeOff, Info, Copy, ChevronDown, ChevronUp } from 'lucide-react';

// Shimmer animation for progress bar
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .animate-shimmer {
      animation: shimmer 1.5s infinite linear;
    }
  `;
  document.head.appendChild(style);
}

// Test credentials (predefined) - for display only
const TEST_CREDENTIALS = {
  username: 'ESTest',
  password: 'eb7475f7-92b8-4dd8-8cdd-deb70e0f081b',
  client_id: 'b3259840-0b2e-4ed7-b928-7774bcfea500',
  client_secret: 'sLf5YNNdTFLDyUrVD7MTtTLYsQqPfpbdkLPfmCE2wdpztpqDRK',
  dealer_id: '355'};

type LogLevel = 'info' | 'success' | 'error' | 'request' | 'response';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export default function EasyQuotesTestPage() {
  // Form state
  const [formData, setFormData] = useState({
    // Required fields
    firstName: 'Test',
    lastName: 'User',
    contactNumber: '0721234567',
    newUsed: 'New' as 'New' | 'Used',

    // Optional fields
    title: '',
    emailAddress: 'test@example.com',
    comments: 'Testing EasySystems Leads API integration',
    salesPerson: '',
    leadOrigin: 'Website Test Page',

    // Vehicle fields
    vehicleBrand: '',
    vehicle: '',
    modelYear: '',
    stockNo: '',
    currentVehicle: ''});

  // UI state
  const [showCredentials, setShowCredentials] = useState(false);
  const [showLogs, setShowLogs] = useState(true);

  // Settings
  const [useTestCredentials, setUseTestCredentials] = useState(true);
  const [customCredentials, setCustomCredentials] = useState({
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    dealer_id: ''});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [submissionSteps, setSubmissionSteps] = useState<string[]>([]);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean | null;
    subId?: number;
    message?: string;
    error?: string;
  }>({ success: null });

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogLevel, message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data};
    setLogs(prev => [...prev, entry]);
    console.log(`[EasyQuotes Test] ${level.toUpperCase()}:`, message, data || '');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult({ success: null });
    setLogs([]);
    setSubmissionSteps([]);
    const steps: string[] = [];

    const addStep = (step: string) => {
      steps.push(step);
      setSubmissionSteps([...steps]);
      setSubmissionStep(step);
    };

    try {
      addStep('Validating form data...');

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.contactNumber || !formData.newUsed) {
        addLog('error', 'Missing required fields', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          contactNumber: formData.contactNumber,
          newUsed: formData.newUsed});
        setIsSubmitting(false);
        setSubmissionStep('');
        return;
      }

      addLog('info', 'Starting lead submission via API route...');
      addStep('Preparing lead data...');

      // Prepare form data for the API route
      const submissionData = [
        { fieldId: 'firstName', fieldLabel: 'First Name', value: formData.firstName },
        { fieldId: 'lastName', fieldLabel: 'Last Name', value: formData.lastName },
        { fieldId: 'contactNumber', fieldLabel: 'Contact Number', value: formData.contactNumber },
      ];

      // Add optional fields if provided
      if (formData.title) submissionData.push({ fieldId: 'title', fieldLabel: 'Title', value: formData.title });
      if (formData.emailAddress) submissionData.push({ fieldId: 'email', fieldLabel: 'Email', value: formData.emailAddress });
      if (formData.comments) submissionData.push({ fieldId: 'comments', fieldLabel: 'Comments', value: formData.comments });

      addStep('Connecting to EasySystems API...');

      // Determine credentials
      const credentials = useTestCredentials ? TEST_CREDENTIALS : customCredentials;

      addLog('request', 'Calling /api/easyquotes/submit...');
      addStep('Authenticating with EasySystems...');

      // Call the API route (server-side, no CORS issues)
      const response = await fetch('/api/easyquotes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({
          formData: submissionData,
          formId: 'test-page',
          mode: useTestCredentials ? 'test' : 'live',
          liveCredentials: useTestCredentials ? undefined : {
            username: customCredentials.username,
            password: customCredentials.password,
            clientId: customCredentials.client_id,
            clientSecret: customCredentials.client_secret,
            dealerId: customCredentials.dealer_id},
          vehicleData: formData.vehicleBrand ? {
            make: formData.vehicleBrand,
            model: formData.vehicle,
            year: formData.modelYear ? parseInt(formData.modelYear) : undefined,
            reference: formData.stockNo} : undefined})});

      addStep('Submitting lead data...');

      addLog('response', `Response status: ${response.status} ${response.statusText}`);

      const result = await response.json();
      addLog('response', 'Full response:', result);

      addStep('Processing response...');

      if (result.success) {
        addLog('success', '✅ LEAD SUBMITTED SUCCESSFULLY!', {
          SubID: result.subId,
          Message: result.message});
        addStep('Lead submitted successfully!');
        setSubmitResult({
          success: true,
          subId: result.subId,
          message: result.message});
      } else {
        addLog('error', '❌ Lead submission failed!', {
          error: result.error,
          message: result.message});
        setSubmitResult({
          success: false,
          error: result.error});
      }
    } catch (error) {
      addLog('error', 'Exception occurred!', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined});
      setSubmitResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'});
    } finally {
      setIsSubmitting(false);
      // Keep the final step visible briefly
      setTimeout(() => {
        if (!isSubmitting) setSubmissionStep('');
      }, 1500);
    }
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      case 'success': return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'error': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'request': return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800';
      case 'response': return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-700 dark:bg-amber-900/20 dark:border-amber-800';
    }
  };

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'success': return <Check className="h-4 w-4" />;
      case 'error': return <X className="h-4 w-4" />;
      case 'request': return <Send className="h-4 w-4" />;
      case 'response': return <Send className="h-4 w-4 transform rotate-180" />;
    }
  };

  const copyLogs = () => {
    const logText = logs.map(log => {
      const dataStr = log.data ? `\n${JSON.stringify(log.data, null, 2)}` : '';
      return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${dataStr}`;
    }).join('\n\n');

    navigator.clipboard.writeText(logText).then(() => {
      alert('Logs copied to clipboard!');
    });
  };

  const copySingleLog = (log: LogEntry) => {
    const dataStr = log.data ? `\n${JSON.stringify(log.data, null, 2)}` : '';
    const logText = `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${dataStr}`;
    navigator.clipboard.writeText(logText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-4 sm:py-8 px-3 sm:px-4">
      {/* Professional Submission Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
            {/* Animated Progress Bar */}
            <div className="mb-6">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-shimmer rounded-full" style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite linear'
                }}></div>
              </div>
            </div>

            {/* Status Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
            </div>

            {/* Current Step */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {submissionStep || 'Processing...'}
              </h3>
              <p className="text-sm text-slate-500">
                Please wait while we submit your lead
              </p>
            </div>

            {/* Completed Steps */}
            {submissionSteps.length > 1 && (
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Progress</p>
                <div className="space-y-1.5">
                  {submissionSteps.slice(0, -1).map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="line-through opacity-60">{step}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span>{submissionStep}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            EasySystems Leads API Test Page
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Test the EasySystems Leads API v6.0 integration directly
          </p>
        </div>

        {/* Mobile Quick Actions */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <Info className="h-4 w-4" />
            {showLogs ? 'Hide' : 'Show'} Logs
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                Lead Submission Form
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Required Fields Section */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></span>
                  Required Fields
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0721234567"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      New/Used <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.newUsed}
                      onChange={(e) => handleInputChange('newUsed', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400"></span>
                    Optional Fields
                    <ChevronDown className="w-4 h-4 sm:hidden group-open:rotate-180 transition-transform" />
                  </h3>
                </summary>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Title</label>
                      <select
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select...</option>
                        <option value="MR.">Mr.</option>
                        <option value="MRS.">Mrs.</option>
                        <option value="MS.">Ms.</option>
                        <option value="DR.">Dr.</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.emailAddress}
                        onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                        className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Comments</label>
                    <textarea
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Sales Person</label>
                      <input
                        type="text"
                        value={formData.salesPerson}
                        onChange={(e) => handleInputChange('salesPerson', e.target.value)}
                        className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Sales person name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Lead Origin</label>
                      <input
                        type="text"
                        value={formData.leadOrigin}
                        onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                        className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Website Test Page"
                      />
                    </div>
                  </div>
                </div>
              </details>

              {/* Vehicle Fields */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="text-xs sm:text-sm">🚗</span>
                    Vehicle Information
                    <ChevronDown className="w-4 h-4 sm:hidden group-open:rotate-180 transition-transform" />
                  </h3>
                </summary>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Vehicle Brand</label>
                    <input
                      type="text"
                      value={formData.vehicleBrand}
                      onChange={(e) => handleInputChange('vehicleBrand', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="KIA"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                    <input
                      type="text"
                      value={formData.vehicle}
                      onChange={(e) => handleInputChange('vehicle', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="KIA RIO 1.4"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Model Year</label>
                    <input
                      type="text"
                      value={formData.modelYear}
                      onChange={(e) => handleInputChange('modelYear', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="2017"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Stock No</label>
                    <input
                      type="text"
                      value={formData.stockNo}
                      onChange={(e) => handleInputChange('stockNo', e.target.value)}
                      className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="STO147852"
                    />
                  </div>
                </div>
              </details>

              {/* Credentials Settings */}
              <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTestCredentials}
                      onChange={(e) => setUseTestCredentials(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    Use Test Credentials
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {showCredentials ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{showCredentials ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                {showCredentials && (
                  <div className="space-y-1.5 text-xs font-mono bg-white rounded-lg p-2 sm:p-3 border border-slate-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>User:</strong> {TEST_CREDENTIALS.username}</div>
                      <div><strong>Dealer:</strong> {TEST_CREDENTIALS.dealer_id}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="truncate"><strong>Pass:</strong> {TEST_CREDENTIALS.password.substring(0, 8)}...</div>
                      <div className="truncate"><strong>ID:</strong> {TEST_CREDENTIALS.client_id.substring(0, 8)}...</div>
                    </div>
                    <div className="truncate"><strong>Secret:</strong> {TEST_CREDENTIALS.client_secret.substring(0, 8)}...</div>
                  </div>
                )}

                {!useTestCredentials && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Username"
                      value={customCredentials.username}
                      onChange={(e) => setCustomCredentials({ ...customCredentials, username: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={customCredentials.password}
                      onChange={(e) => setCustomCredentials({ ...customCredentials, password: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Client ID"
                      value={customCredentials.client_id}
                      onChange={(e) => setCustomCredentials({ ...customCredentials, client_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="password"
                      placeholder="Client Secret"
                      value={customCredentials.client_secret}
                      onChange={(e) => setCustomCredentials({ ...customCredentials, client_secret: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Dealer ID"
                      value={customCredentials.dealer_id}
                      onChange={(e) => setCustomCredentials({ ...customCredentials, dealer_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Lead
                  </>
                )}
              </button>

              {/* Result */}
              {submitResult.success !== null && (
                <div className={`p-3 sm:p-4 rounded-xl border ${
                  submitResult.success
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {submitResult.success ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="font-semibold text-sm">
                      {submitResult.success ? 'Success!' : 'Failed'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    {submitResult.success ? (
                      <>
                        <p>SubID: <strong>{submitResult.subId}</strong></p>
                        <p>Message: {submitResult.message}</p>
                      </>
                    ) : (
                      <p>Error: {submitResult.error}</p>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Logs Section - Desktop always visible, Mobile togglable */}
          <div className={`${showLogs ? 'block' : 'hidden lg:block'} bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden`}>
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                <Info className="h-4 w-4 sm:h-5" />
                API Logs
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={copyLogs}
                    className="text-xs sm:text-sm text-slate-300 hover:text-white px-2 sm:px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Copy All</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-xs sm:text-sm text-slate-300 hover:text-white px-2 sm:px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="p-2 sm:p-4 bg-slate-50 max-h-[300px] sm:max-h-[700px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">No logs yet. Submit the form to see API activity.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 sm:p-3 rounded-lg border ${getLogColor(log.level)} group relative`}
                    >
                      <button
                        type="button"
                        onClick={() => copySingleLog(log)}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                        title="Copy this log"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <div className="flex items-start gap-1.5 pr-4">
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 mt-0.5">
                          {log.timestamp}
                        </span>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {getLogIcon(log.level)}
                          <span className="font-medium text-xs sm:text-sm break-words">{log.message}</span>
                        </div>
                      </div>
                      {log.data && (
                        <pre className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs overflow-x-auto bg-white/50 rounded p-1.5 sm:p-2 whitespace-pre-wrap break-all">
                          {typeof log.data === 'string'
                            ? log.data
                            : JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
