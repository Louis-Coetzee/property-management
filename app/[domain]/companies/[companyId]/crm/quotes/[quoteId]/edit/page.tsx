'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { 
  ArrowLeft, Save, Send, X, Plus, Trash2, 
  Calendar, User, Building2, Phone, Mail, MapPin, Eye,
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
}

interface Service {
  _id: string;
  name: string;
  price: number;
}

export default function EditQuotePage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const quoteId = params.quoteId as string;

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
  const [priceUpdateContext, setPriceUpdateContext] = useState<{ item: QuoteItem; index: number; itemType: string; itemId: string } | null>(null);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(15);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [template, setTemplate] = useState('default');
  const [quoteNumber, setQuoteNumber] = useState('');

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const quote = useQuery(
    api.quotes.getById,
    user?.id && quoteId ? { userId: user.id as any, quoteId: quoteId as any } : "skip"
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

  const updateQuote = useMutation(api.quotes.update);
  const updateProductPrice = useMutation(api.products.updateProduct);
  const updateServicePrice = useMutation(api.services.updateService);

  useEffect(() => {
    if (quote) {
      setQuoteNumber(quote.quoteNumber || '');
      setSelectedClient({
        _id: quote.clientId || '',
        contactName: quote.clientName || '',
        companyName: quote.clientCompany,
        email: quote.clientEmail,
        contactNumber: quote.clientPhone,
        address: quote.clientAddress,
      });
      setItems(quote.items || []);
      setTaxEnabled((quote.taxRate || 0) > 0);
      setTaxRate(quote.taxRate || 15);
      setIssueDate(quote.createdAt ? new Date(quote.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setValidUntil(quote.validUntil || '');
      setNotes(quote.notes || '');
      setStatus(quote.status || 'draft');
      setTemplate(quote.template || 'default');
      setQuoteNumber(quote.quoteNumber || '');
    }
  }, [quote]);

  const filteredClients = useMemo(() => {
    if (!clients || !clientSearch) return [];
    const search = clientSearch.toLowerCase();
    return (clients as Client[]).filter(c => 
      c.contactName.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.companyName?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    if (!products || !productSearch) return [];
    const search = productSearch.toLowerCase();
    return (products as Product[]).filter(p => p.name.toLowerCase().includes(search)).slice(0, 10);
  }, [products, productSearch]);

  const filteredServices = useMemo(() => {
    if (!services || !serviceSearch) return [];
    const search = serviceSearch.toLowerCase();
    return (services as Service[]).filter(s => s.name.toLowerCase().includes(search)).slice(0, 10);
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

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    if (field === 'quantity' || field === 'unitPrice' || field === 'customPrice') {
      const unitPrice = field === 'customPrice' ? (value || item.unitPrice) : value;
      item[field] = value;
      const effectivePrice = item.customPrice !== undefined ? item.customPrice : item.unitPrice;
      item.total = effectivePrice * item.quantity;
    } else {
      (item as any)[field] = value;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleCustomPriceChange = (index: number, customPrice: number | undefined) => {
    const item = items[index];
    if (customPrice !== undefined && customPrice !== item.unitPrice && item.itemId) {
      setPriceUpdateContext({ item: { ...item, customPrice }, index, itemType: item.itemType || 'product', itemId: item.itemId });
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
          await updateProductPrice({ userId: user!.id as any, productId: itemId as any, name: '', price: customPrice } as any);
          toast.success('Product price updated');
        } else if (itemType === 'service') {
          await updateServicePrice({ userId: user!.id as any, serviceId: itemId as any, name: '', price: customPrice } as any);
          toast.success('Service price updated');
        }
      } catch (e) { toast.error('Failed to update price'); }
    } else {
      toast.success('Price updated for this quote only');
    }
    updateItem(index, 'customPrice', customPrice);
    setShowPriceUpdateModal(false);
    setPriceUpdateContext(null);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const addProduct = (product: Product) => {
    const existing = items.findIndex(i => i.itemId === product._id && i.itemType === 'product');
    if (existing >= 0) {
      const newItems = [...items];
      newItems[existing].quantity += 1;
      newItems[existing].total = (newItems[existing].customPrice || newItems[existing].unitPrice) * newItems[existing].quantity;
      setItems(newItems);
    } else {
      setItems([...items, { itemType: 'product', itemId: product._id, description: product.name, quantity: 1, unitPrice: product.price, total: product.price }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const addService = (service: Service) => {
    const existing = items.findIndex(i => i.itemId === service._id && i.itemType === 'service');
    if (existing >= 0) {
      const newItems = [...items];
      newItems[existing].quantity += 1;
      newItems[existing].total = (newItems[existing].customPrice || newItems[existing].unitPrice) * newItems[existing].quantity;
      setItems(newItems);
    } else {
      setItems([...items, { itemType: 'service', itemId: service._id, description: service.name, quantity: 1, unitPrice: service.price, total: service.price }]);
    }
    setServiceSearch('');
    setShowServiceDropdown(false);
  };

  const handleSave = async (send: boolean = false) => {
    if (!selectedClient || items.length === 0 || !quote) {
      toast.error('Please select a client and add at least one item');
      return;
    }
    try {
      await updateQuote({
        userId: user!.id as any,
        quoteId: quoteId as any,
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
        validUntil: validUntil || undefined,
        sentAt: send ? Date.now() : (quote.sentAt || undefined),
        notes,
        template,
      });
      toast.success(send ? 'Quote sent!' : 'Quote saved!');
      router.push(`/${params.domain}/companies/${companyId}/crm/quotes`);
    } catch (error) { toast.error('Failed to save quote'); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
              <div><h1 className="text-2xl font-bold text-slate-900">Edit Quote</h1></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPreview(true)} className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"><Eye className="h-4 w-4" /> Preview</button>
              <button onClick={() => handleSave(false)} className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"><Save className="h-4 w-4" /> Save</button>
              <button onClick={() => handleSave(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800"><Send className="h-4 w-4" /> Save & Send</button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Client */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Client Details</h2>
              {selectedClient && selectedClient._id ? (
                <div className="bg-slate-50 p-4 rounded-xl border">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{selectedClient.contactName}</p>
                      {selectedClient.companyName && <p className="text-sm text-slate-600">{selectedClient.companyName}</p>}
                    </div>
                    <button onClick={() => setSelectedClient({ ...selectedClient, _id: '' })}><X className="h-5 w-5" /></button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input type="text" placeholder="Search clients..." value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} className="w-full pl-4 pr-4 py-3 bg-slate-50 border rounded-xl" />
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.map(c => <button key={c._id} onClick={() => selectClient(c)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b"><p className="font-medium">{c.contactName}</p><p className="text-sm text-slate-500">{c.email}</p></button>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Quote Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <input type="text" placeholder="Search products..." value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }} onFocus={() => setShowProductDropdown(true)} className="w-full pl-4 pr-4 py-3 bg-slate-50 border rounded-xl" />
                  {showProductDropdown && filteredProducts.length > 0 && <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">{filteredProducts.map(p => <button key={p._id} onClick={() => addProduct(p)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between"><span>{p.name}</span><span>${p.price}</span></button>)}</div>}
                </div>
                <div className="relative">
                  <input type="text" placeholder="Search services..." value={serviceSearch} onChange={e => { setServiceSearch(e.target.value); setShowServiceDropdown(true); }} onFocus={() => setShowServiceDropdown(true)} className="w-full pl-4 pr-4 py-3 bg-slate-50 border rounded-xl" />
                  {showServiceDropdown && filteredServices.length > 0 && <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">{filteredServices.map(s => <button key={s._id} onClick={() => addService(s)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between"><span>{s.name}</span><span>${s.price}</span></button>)}</div>}
                </div>
              </div>
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left py-3 text-sm text-slate-600">Description</th><th className="text-center py-3 text-sm text-slate-600 w-20">Qty</th><th className="text-right py-3 text-sm text-slate-600 w-28">Price</th><th className="text-right py-3 text-sm text-slate-600 w-28">Custom</th><th className="text-right py-3 text-sm text-slate-600 w-28">Total</th><th className="w-12"></th></tr></thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3"><input type="text" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-lg" /></td>
                      <td className="py-3"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-center" /></td>
                      <td className="py-3"><input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-right" /></td>
                      <td className="py-3"><input type="number" value={item.customPrice || ''} onChange={e => handleCustomPriceChange(index, e.target.value ? parseFloat(e.target.value) : undefined)} className="w-full px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-right" placeholder="Override" /></td>
                      {formatCurrency(item.total)}
                      <td className="py-3"><button onClick={() => removeItem(index)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addItem} className="mt-4 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><Plus className="h-4 w-4" /> Add Custom Item</button>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Quote Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm text-slate-700 mb-2">Quote Number</label><input type="text" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" /></div>
                <div><label className="block text-sm text-slate-700 mb-2">Valid Until</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" /></div>
                <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Tax</label>
                      <button
                        type="button"
                        onClick={() => setTaxEnabled(!taxEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${taxEnabled ? 'bg-slate-900' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${taxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {taxEnabled && (
                    <div className="flex-1">
                      <label className="block text-sm text-slate-700 mb-2">Tax Rate (%)</label>
                      <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                    </div>
                    )}
                  </div>
              </div>
              <div className="mt-4"><label className="block text-sm text-slate-700 mb-2">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" /></div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Quote Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                {taxEnabled && <div className="flex justify-between text-sm"><span className="text-slate-600">Tax ({taxRate}%)</span><span className="font-medium">{formatCurrency(taxAmount)}</span></div>}
                <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-xl">{formatCurrency(total)}</span></div>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Update Price?</h3>
            <p className="text-slate-600 mb-4">Price changed from {formatCurrency(priceUpdateContext.item.unitPrice)} to {formatCurrency(priceUpdateContext.item.customPrice || 0)}.</p>
            <div className="space-y-3">
              <button onClick={() => handlePriceUpdateDecision(true)} className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-slate-900 text-left"><p className="font-semibold">Update in database</p><p className="text-sm text-slate-500">Permanently update product/service price</p></button>
              <button onClick={() => handlePriceUpdateDecision(false)} className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-slate-900 text-left"><p className="font-semibold">Quote only</p><p className="text-sm text-slate-500">Apply custom price just for this quote</p></button>
            </div>
            <button onClick={() => { setShowPriceUpdateModal(false); setPriceUpdateContext(null); }} className="w-full mt-4 px-4 py-3 border rounded-xl">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}