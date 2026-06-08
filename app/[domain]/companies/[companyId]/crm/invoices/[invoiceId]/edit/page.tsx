'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { 
  ArrowLeft, Save, Send, X, Plus, Trash2, 
  Calendar, User, Building2, Phone, Mail, MapPin,
  Clock, RefreshCw, Eye, Layout, Check
} from 'lucide-react';
import { InvoiceTemplateClassic, InvoiceTemplateModern } from '@/lib/documents/templates';
import InvoiceTemplate from '@/components/invoices/InvoiceTemplate';
import toast, { Toaster } from 'react-hot-toast';

interface InvoiceItem {
  itemType?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Client {
  _id: string;
  contactName: string;
  companyName?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  description?: string;
}

export default function EditInvoicePage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const invoiceId = params.invoiceId as string;

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(15);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [template, setTemplate] = useState('default');
  const [paymentLink, setPaymentLink] = useState('');
  const [showBankingDetails, setShowBankingDetails] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Recurring settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'days' | 'monthly'>('days');
  const [recurringDays, setRecurringDays] = useState(30);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState(1);
  const [recurringDueDays, setRecurringDueDays] = useState(30);
  const [recurringDueDayOfMonth, setRecurringDueDayOfMonth] = useState(15);
  const [recurringDueDateDayOfNextMonth, setRecurringDueDateDayOfNextMonth] = useState<number | null>(null);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const invoice = useQuery(
    api.invoices.getById,
    user?.id && invoiceId ? { userId: user.id as any, invoiceId: invoiceId as any } : "skip"
  );

  const clients = useQuery(
    api.clients.getClientsByCompany,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  ) as unknown as Client[] | undefined;

  const products = useQuery(
    api.products.getProductsByCompany,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  ) as unknown as Product[] | undefined;

  const services = useQuery(
    api.services.getServicesByCompany,
    companyId ? { companyId: companyId as any } : "skip"
  ) as unknown as Service[] | undefined;

  const updateInvoice = useMutation(api.invoices.update);

  // Load invoice data when available
  useEffect(() => {
    if (invoice) {
      setInvoiceNumber(invoice.invoiceNumber || '');
      setSelectedClient({
        _id: invoice.clientId || '',
        contactName: invoice.clientName || '',
        companyName: invoice.clientCompany,
        email: invoice.clientEmail,
        contactNumber: invoice.clientPhone,
        address: invoice.clientAddress,
      });
      setItems(invoice.items || []);
      setTaxEnabled((invoice.taxRate || 0) > 0);
      setTaxRate(invoice.taxRate || 15);
      setIssueDate(invoice.issueDate || new Date().toISOString().split('T')[0]);
      setDueDate(invoice.dueDate || '');
      setNotes(invoice.notes || '');
      setStatus(invoice.status || 'draft');
      setTemplate(invoice.template || 'default');
      setPaymentLink(invoice.paymentLink || '');
      setShowBankingDetails(invoice.showBankingDetails !== false);
      setIsRecurring(invoice.isRecurring || false);
      setRecurringInterval((invoice.recurringInterval as 'days' | 'monthly') || 'days');
      setRecurringDays(invoice.recurringDays || 30);
      setRecurringDayOfMonth(invoice.recurringDayOfMonth || 1);
      setRecurringDueDays(invoice.recurringDueDays || 30);
      setRecurringDueDayOfMonth(invoice.recurringDueDayOfMonth || 15);
      setRecurringDueDateDayOfNextMonth(invoice.recurringDueDateDayOfNextMonth || null);
    }
  }, [invoice]);

  const filteredClients = useMemo(() => {
    if (!clients || !clientSearch) return [];
    const search = clientSearch.toLowerCase();
    return (clients as Client[]).filter(c => 
      c.contactName.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.companyName?.toLowerCase().includes(search) ||
      c.contactNumber?.includes(search)
    ).slice(0, 10);
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    if (!products || !productSearch) return [];
    const search = productSearch.toLowerCase();
    return (products as Product[]).filter(p => 
      p.name.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [products, productSearch]);

  const filteredServices = useMemo(() => {
    if (!services || !serviceSearch) return [];
    const search = serviceSearch.toLowerCase();
    return (services as Service[]).filter(s => 
      s.name.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [services, serviceSearch]);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = taxEnabled ? (subtotal * taxRate) / 100 : 0;
  const total = subtotal + taxAmount;

  const formatCurrency = (value: number) => {
    const currencyCode = company?.currency?.code || 'ZAR';
    const currencySymbol = company?.currency?.symbol || (currencyCode === 'ZAR' ? 'R' : '$');
    const symbolPosition = company?.currency?.symbolPosition || 'before';
    
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    if (symbolPosition === 'after') {
      return value.toFixed(2) + ' ' + currencySymbol;
    }
    return formatted;
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addProduct = (product: Product) => {
    const existingIndex = items.findIndex(i => i.itemId === product._id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
      setItems(newItems);
    } else {
      setItems([...items, {
        itemType: 'product',
        itemId: product._id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const addService = (service: Service) => {
    const existingIndex = items.findIndex(i => i.itemId === service._id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
      setItems(newItems);
    } else {
      setItems([...items, {
        itemType: 'service',
        itemId: service._id,
        description: service.name,
        quantity: 1,
        unitPrice: service.price,
        total: service.price
      }]);
    }
    setServiceSearch('');
    setShowServiceDropdown(false);
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const handleSave = async (send: boolean = false) => {
    if (!selectedClient || items.length === 0 || !invoice) {
      toast.error('Please select a client and add at least one item');
      return;
    }

    try {
      const result = await updateInvoice({
        userId: user!.id as any,
        invoiceId: invoiceId as any,
        invoiceNumber,
        clientId: selectedClient._id as any,
        clientName: selectedClient.contactName,
        clientEmail: selectedClient.email,
        clientCompany: selectedClient.companyName,
        clientPhone: selectedClient.contactNumber,
        clientAddress: selectedClient.address,
        status: send ? 'sent' : status,
        items,
        subtotal,
        taxRate: taxEnabled ? taxRate : 0,
        taxAmount: taxEnabled ? taxAmount : 0,
        total,
        amountPaid: invoice.amountPaid || 0,
        issueDate,
        dueDate,
        sentAt: send ? Date.now() : (invoice.sentAt || undefined),
        paidAt: invoice.paidAt || undefined,
        notes,
        template,
        paymentLink: paymentLink.trim() || undefined,
        showBankingDetails,
        isRecurring: isRecurring || undefined,
        recurringInterval: isRecurring ? recurringInterval : undefined,
        recurringDays: isRecurring && recurringInterval === 'days' ? recurringDays : undefined,
        recurringDayOfMonth: isRecurring && recurringInterval === 'monthly' ? recurringDayOfMonth : undefined,
        recurringDueDays: isRecurring && recurringDueDateDayOfNextMonth === null ? recurringDueDays : undefined,
        recurringDueDayOfMonth: isRecurring && recurringDueDateDayOfNextMonth === null ? recurringDueDayOfMonth : undefined,
        recurringDueDateDayOfNextMonth: isRecurring ? (recurringDueDateDayOfNextMonth ?? undefined) : undefined,
      });

      toast.success(send ? 'Invoice sent successfully!' : 'Invoice saved successfully!');
      router.push(`/${params.domain}/companies/${companyId}/crm/invoices`);
    } catch (error) {
      toast.error('Failed to save invoice');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
                <p className="text-slate-600 text-sm">Update invoice details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => handleSave(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-all"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                <Send className="h-4 w-4" />
                Save & Send
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Number */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoice Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Client Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Details
              </h2>
              
              {selectedClient && selectedClient._id ? (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{selectedClient.contactName}</p>
                      {selectedClient.companyName && <p className="text-slate-600 text-sm">{selectedClient.companyName}</p>}
                      {selectedClient.email && <p className="text-slate-600 text-sm flex items-center gap-1 mt-1"><Mail className="h-3 w-3" />{selectedClient.email}</p>}
                      {selectedClient.contactNumber && <p className="text-slate-600 text-sm flex items-center gap-1 mt-1"><Phone className="h-3 w-3" />{selectedClient.contactNumber}</p>}
                      {selectedClient.address && <p className="text-slate-600 text-sm flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{selectedClient.address}</p>}
                    </div>
                    <button 
                      onClick={() => setSelectedClient({ ...selectedClient, _id: '' })}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search clients by name, email, phone..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <button
                          key={client._id}
                          onClick={() => selectClient(client)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <p className="font-medium text-slate-900">{client.contactName}</p>
                          <p className="text-sm text-slate-500">{client.email || client.contactNumber}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Invoice Items
              </h2>

              {/* Add Products/Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product._id}
                          onClick={() => addProduct(product)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{product.name}</p>
                          </div>
                          {formatCurrency(product.price)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={(e) => {
                        setServiceSearch(e.target.value);
                        setShowServiceDropdown(true);
                      }}
                      onFocus={() => setShowServiceDropdown(true)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  {showServiceDropdown && filteredServices.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredServices.map((service) => (
                        <button
                          key={service._id}
                          onClick={() => addService(service)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{service.name}</p>
                          </div>
                          {formatCurrency(service.price)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Description</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-600 w-24">Qty</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 w-32">Unit Price</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 w-32">Total</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-center"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-right"
                          />
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-slate-900">
{formatCurrency(item.total)}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addItem}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Custom Item
              </button>
            </div>

            {/* Dates & Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Invoice Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
                  <button
                    type="button"
                    onClick={() => setTaxEnabled(!taxEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${taxEnabled ? 'bg-slate-900' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${taxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {taxEnabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Additional notes or terms..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Link (optional)
                </label>
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="https://pay.example.com/your-link"
                />
                <p className="mt-1 text-xs text-slate-500">
                  If set, this URL is used for the &quot;Pay Now&quot; button in the invoice email (overrides the public invoice link).
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-900">Include Banking Details</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Show the company&apos;s saved banking details on this invoice and in the email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBankingDetails(!showBankingDetails)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${showBankingDetails ? 'bg-slate-900' : 'bg-slate-200'}`}
                  aria-label="Toggle banking details"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${showBankingDetails ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Recurring Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recurring Invoice
              </h2>
              
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-5 w-5 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700">
                  Enable recurring invoices
                </label>
              </div>

              {isRecurring && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Repeat Every</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={recurringInterval}
                          onChange={(e) => setRecurringInterval(e.target.value as 'days' | 'monthly')}
                          className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                        >
                          <option value="days">Days</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        {recurringInterval === 'days' ? (
                          <input
                            type="number"
                            min="1"
                            value={recurringDays}
                            onChange={(e) => setRecurringDays(parseInt(e.target.value) || 1)}
                            className="w-full sm:w-24 px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                          />
                        ) : (
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={recurringDayOfMonth}
                            onChange={(e) => setRecurringDayOfMonth(parseInt(e.target.value) || 1)}
                            className="w-full sm:w-24 px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                            placeholder="Day"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Payment Due Date</label>
                      <div className="flex flex-col gap-2">
                        <select
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val === -1) {
                              setRecurringDueDateDayOfNextMonth(1);
                              setRecurringDueDayOfMonth(0);
                              setRecurringDueDays(0);
                            } else if (val === 0) {
                              setRecurringDueDateDayOfNextMonth(null);
                              setRecurringDueDayOfMonth(15);
                              setRecurringDueDays(0);
                            } else {
                              setRecurringDueDateDayOfNextMonth(null);
                              setRecurringDueDayOfMonth(0);
                              setRecurringDueDays(val);
                            }
                          }}
                          value={recurringDueDateDayOfNextMonth !== null ? -1 : (recurringDueDays > 0 ? recurringDueDays : 0)}
                        >
                          <option value={30}>30 days after</option>
                          <option value={60}>60 days after</option>
                          <option value={15}>15 days after</option>
                          <option value={0}>Specific day of month</option>
                          <option value={-1}>Day of following month</option>
                        </select>
                        {recurringDueDateDayOfNextMonth !== null ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={recurringDueDateDayOfNextMonth || ''}
                              onChange={(e) => setRecurringDueDateDayOfNextMonth(parseInt(e.target.value) || null)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                              placeholder="Day 1-31"
                            />
                            <span className="text-sm text-slate-500">of next month</span>
                          </div>
                        ) : recurringDueDayOfMonth > 0 ? (
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={recurringDueDayOfMonth || ''}
                            onChange={(e) => setRecurringDueDayOfMonth(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                            placeholder="Day 1-31"
                          />
                        ) : null}
                        {recurringDueDateDayOfNextMonth !== null && (
                          <p className="text-xs text-slate-500">Day {recurringDueDateDayOfNextMonth} of the following month</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoice Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {taxEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax ({taxRate}%)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {selectedClient && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Bill To:</p>
                  <p className="font-medium text-slate-900">{selectedClient.contactName}</p>
                  {selectedClient.email && <p className="text-sm text-slate-500">{selectedClient.email}</p>}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Issue Date:</span>
                  <span className="text-slate-900">{issueDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Due Date:</span>
                  <span className="text-slate-900">{dueDate}</span>
                </div>
              </div>

              <button
                onClick={() => setShowTemplateModal(true)}
                className="mt-4 w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <Layout className="h-4 w-4" />
                Template: {template === 'default' ? 'Classic' : 'Modern'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Select Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setTemplate('default'); setShowTemplateModal(false); }}
                  className={`relative p-4 border-2 rounded-xl transition-all ${template === 'default' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="aspect-[3/4] bg-white rounded-lg border border-slate-200 p-4 mb-3">
                    <div className="h-8 w-24 bg-slate-200 rounded mb-3"></div>
                    <div className="h-4 w-16 bg-slate-100 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-slate-100 rounded mb-4"></div>
                    <div className="h-3 w-full bg-slate-50 rounded mb-1"></div>
                    <div className="h-3 w-full bg-slate-50 rounded mb-1"></div>
                    <div className="h-3 w-3/4 bg-slate-50 rounded mb-4"></div>
                    <div className="h-6 w-20 bg-slate-200 rounded ml-auto"></div>
                  </div>
                  <p className="font-medium text-slate-900">Classic</p>
                  <p className="text-xs text-slate-500">Traditional clean design</p>
                  {template === 'default' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => { setTemplate('modern'); setShowTemplateModal(false); }}
                  className={`relative p-4 border-2 rounded-xl transition-all ${template === 'modern' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 mb-3">
                    <div className="h-6 w-20 bg-white/20 rounded mb-3"></div>
                    <div className="h-3 w-14 bg-white/10 rounded mb-2"></div>
                    <div className="h-2 w-28 bg-white/10 rounded mb-4"></div>
                    <div className="h-2 w-full bg-white/5 rounded mb-1"></div>
                    <div className="h-2 w-full bg-white/5 rounded mb-1"></div>
                    <div className="h-2 w-2/3 bg-white/5 rounded mb-4"></div>
                    <div className="h-5 w-16 bg-white/20 rounded ml-auto"></div>
                  </div>
                  <p className="font-medium text-slate-900">Modern</p>
                  <p className="text-xs text-slate-500">Dark header, bold style</p>
                  {template === 'modern' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Invoice Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="p-8">
              <InvoiceTemplate
                invoiceNumber={invoiceNumber}
                clientName={selectedClient?.contactName || 'Client Name'}
                clientEmail={selectedClient?.email}
                clientCompany={selectedClient?.companyName}
                clientPhone={selectedClient?.contactNumber}
                clientAddress={selectedClient?.address}
                issueDate={issueDate}
                dueDate={dueDate}
                items={items}
                subtotal={subtotal}
                taxRate={taxEnabled ? taxRate : 0}
                taxAmount={taxEnabled ? taxAmount : 0}
                total={total}
                notes={notes}
                template={template as 'default' | 'modern'}
                showBankingDetails={showBankingDetails}
                paymentLink={paymentLink.trim() || undefined}
                company={{
                  name: company?.name,
                  description: company?.description,
                  logoUrl: company?.branding?.logoUrl,
                  primaryColor: company?.branding?.primaryColor,
                  bankingDetails: company?.bankingDetails,
                }}
                formatCurrency={formatCurrency}
              />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleSave(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}