'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthGuard } from '../../../../../AuthProvider';
import { 
  ArrowLeft, Save, Send, X, Plus, Trash2, 
  Search, Calendar, User, Building2, Phone, Mail, MapPin, Eye,
  Layout, Check
} from 'lucide-react';
import { QuoteTemplateClassic, QuoteTemplateModern } from '@/lib/documents/templates';
import toast, { Toaster } from 'react-hot-toast';

interface QuoteItem {
  itemType?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  customPrice?: number;
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

export default function NewQuotePage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
  const [priceUpdateContext, setPriceUpdateContext] = useState<{
    item: QuoteItem;
    index: number;
    itemType: string;
    itemId: string;
  } | null>(null);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(15);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [template, setTemplate] = useState('default');
  const [quoteNumber] = useState(`QUO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
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

  const createQuote = useMutation(api.quotes.create);
  const updateProductPrice = useMutation(api.products.updateProduct);
  const updateServicePrice = useMutation(api.services.updateService);

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
  const taxAmount = (subtotal * taxRate) / 100;
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

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'customPrice') {
      const unitPrice = field === 'customPrice' ? (value || item.unitPrice) : value;
      const qty = field === 'quantity' ? value : item.quantity;
      item[field] = value;
      
      const effectivePrice = item.customPrice !== undefined ? item.customPrice : item.unitPrice;
      item.total = effectivePrice * qty;
    } else {
      (item as any)[field] = value;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const handleCustomPriceChange = (index: number, customPrice: number | undefined) => {
    const item = items[index];
    const originalPrice = item.unitPrice;
    
    if (customPrice !== undefined && customPrice !== originalPrice && item.itemId) {
      setPriceUpdateContext({
        item: { ...item, customPrice },
        index,
        itemType: item.itemType || 'product',
        itemId: item.itemId,
      });
      setShowPriceUpdateModal(true);
    } else {
      updateItem(index, 'customPrice', customPrice);
    }
  };

  const handlePriceUpdateDecision = async (updateDb: boolean) => {
    if (!priceUpdateContext) return;
    
    const { index, item, itemType, itemId } = priceUpdateContext;
    const customPrice = item.customPrice;
    
    if (updateDb && itemType && itemId && customPrice !== undefined) {
      try {
        if (itemType === 'product') {
          await updateProductPrice({
            userId: user!.id as any,
            productId: itemId as any,
            name: '', 
            price: customPrice,
          } as any);
          toast.success('Product price updated in database');
        } else if (itemType === 'service') {
          await updateServicePrice({
            userId: user!.id as any,
            serviceId: itemId as any,
            name: '',
            price: customPrice,
          } as any);
          toast.success('Service price updated in database');
        }
      } catch (e) {
        toast.error('Failed to update price in database');
      }
    } else {
      toast.success('Price updated for this quote only');
    }
    
    updateItem(index, 'customPrice', customPrice);
    setShowPriceUpdateModal(false);
    setPriceUpdateContext(null);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addProduct = (product: Product) => {
    const existingIndex = items.findIndex(i => i.itemId === product._id && i.itemType === 'product');
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total = (newItems[existingIndex].customPrice || newItems[existingIndex].unitPrice) * newItems[existingIndex].quantity;
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
    const existingIndex = items.findIndex(i => i.itemId === service._id && i.itemType === 'service');
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total = (newItems[existingIndex].customPrice || newItems[existingIndex].unitPrice) * newItems[existingIndex].quantity;
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

  const handleSave = async (send: boolean = false) => {
    if (!selectedClient || items.length === 0) {
      toast.error('Please select a client and add at least one item');
      return;
    }

    const quoteNumber = `QUO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    try {
      const result = await createQuote({
        userId: user!.id as any,
        companyId: companyId as any,
        quoteNumber,
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
        validUntil,
        notes,
        template,
      });

      toast.success(send ? 'Quote sent to client!' : 'Quote saved successfully!');
      router.push(`/${params.domain}/companies/${companyId}/crm/quotes`);
    } catch (error) {
      toast.error('Failed to save quote');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
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
                <h1 className="text-2xl font-bold text-slate-900">New Quote</h1>
                <p className="text-slate-600 text-sm">Create a new quotation</p>
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
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                <Send className="h-4 w-4" />
                Create & Send
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Details
              </h2>
              
              {selectedClient ? (
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
                      onClick={() => setSelectedClient(null)}
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
                      className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                  <div className="flex items-center gap-4 mt-3">
                    <Link 
                      href={`/${params.domain}/companies/${companyId}/crm/clients/new`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add New Client
                    </Link>
                    {selectedClient && (selectedClient as any)._id && (
                      <Link 
                        href={`/${params.domain}/companies/${companyId}/crm/clients/${(selectedClient as any)._id}/edit`}
                        className="text-sm text-slate-600 hover:text-slate-800"
                      >
                        Edit Selected Client
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quote Items */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Quote Items
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
                      className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                      className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-600 w-20">Qty</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 w-28">Unit Price</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 w-28">Custom Price</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 w-28">Total</th>
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
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.customPrice || ''}
                            onChange={(e) => handleCustomPriceChange(index, e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-right"
                            placeholder="Override price"
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
                Quote Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
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
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quote Summary</h2>
              
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
                  <p className="text-sm text-slate-600 mb-2">Quote For:</p>
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
                  <span className="text-slate-600">Valid Until:</span>
                  <span className="text-slate-900">{validUntil}</span>
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

      {/* Price Update Modal */}
      {showPriceUpdateModal && priceUpdateContext && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Update Price?</h3>
            <p className="text-slate-600 mb-4">
              You've changed the price from <span className="font-semibold">{formatCurrency(priceUpdateContext.item.unitPrice)}</span> to <span className="font-semibold text-green-600">{formatCurrency(priceUpdateContext.item.customPrice || 0)}</span>.
            </p>
            <p className="text-slate-600 mb-6">
              How would you like to proceed?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handlePriceUpdateDecision(true)}
                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
              >
                <p className="font-semibold text-slate-900">Update in database</p>
                <p className="text-sm text-slate-500">Permanently update the price for this product/service</p>
              </button>
              <button
                onClick={() => handlePriceUpdateDecision(false)}
                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
              >
                <p className="font-semibold text-slate-900">Quote only</p>
                <p className="text-sm text-slate-500">Apply custom price only for this quote</p>
              </button>
            </div>
            <button
              onClick={() => {
                setShowPriceUpdateModal(false);
                setPriceUpdateContext(null);
              }}
              className="w-full mt-4 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Quote Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="p-8">
              {template === 'modern' ? (
                <QuoteTemplateModern
                  company={company}
                  quote={{
                    quoteNumber,
                    clientName: selectedClient?.contactName || 'Client Name',
                    clientEmail: selectedClient?.email,
                    clientCompany: selectedClient?.companyName,
                    clientPhone: selectedClient?.contactNumber,
                    clientAddress: selectedClient?.address,
                    createdAt: issueDate,
                    validUntil,
                    status,
                    items,
                    subtotal,
                    taxRate: taxEnabled ? taxRate : 0,
                    taxAmount: taxEnabled ? taxAmount : 0,
                    total,
                    notes
                  }}
                  formatCurrency={formatCurrency}
                />
              ) : (
                <QuoteTemplateClassic
                  company={company}
                  quote={{
                    quoteNumber,
                    clientName: selectedClient?.contactName || 'Client Name',
                    clientEmail: selectedClient?.email,
                    clientCompany: selectedClient?.companyName,
                    clientPhone: selectedClient?.contactNumber,
                    clientAddress: selectedClient?.address,
                    createdAt: issueDate,
                    validUntil,
                    status,
                    items,
                    subtotal,
                    taxRate: taxEnabled ? taxRate : 0,
                    taxAmount: taxEnabled ? taxAmount : 0,
                    total,
                    notes
                  }}
                  formatCurrency={formatCurrency}
                />
              )}
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
                Save Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}