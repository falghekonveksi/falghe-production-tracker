import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';

interface InvoiceProps {
  language: 'id' | 'en';
  onBackToTracking?: () => void;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function Invoice({ language, onBackToTracking }: InvoiceProps) {
  const [orderCode, setOrderCode] = useState('');
  const [foundInvoice, setFoundInvoice] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const t = {
    id: {
      title: 'Invoice',
      subtitle: 'Cari dan lihat invoice pesanan',
      inputPlaceholder: 'Masukkan kode pesanan (contoh: FLG-00001)',
      searchButton: 'Cari',
      noInvoice: 'Invoice tidak ditemukan',
      enterCode: 'Masukkan kode pesanan untuk melihat invoice',
      invoiceNumber: 'Nomor Invoice',
      date: 'Tanggal',
      dueDate: 'Jatuh Tempo',
      from: 'Dari',
      billTo: 'Tagihan Kepada',
      description: 'Deskripsi',
      quantity: 'Qty',
      unitPrice: 'Harga Satuan',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Pajak',
      grandTotal: 'Total Akhir',
      draft: 'Draft',
      sent: 'Terkirim',
      paid: 'Lunas',
      footerNote: 'Terima kasih atas kepercayaan Anda kepada Falghe!',
      loading: 'Mencari...',
      editInvoice: 'Edit Invoice',
      doneEdit: 'Selesai Edit',
      addItem: 'Tambah Baris',
      backToTracking: 'Kembali ke Tracking',
    },
    en: {
      title: 'Invoice',
      subtitle: 'Search and view your order invoices',
      inputPlaceholder: 'Enter order code (e.g.: FLG-00001)',
      searchButton: 'Search',
      noInvoice: 'Invoice not found',
      enterCode: 'Enter order code to view invoice',
      invoiceNumber: 'Invoice Number',
      date: 'Date',
      dueDate: 'Due Date',
      from: 'From',
      billTo: 'Bill To',
      description: 'Description',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax',
      grandTotal: 'Grand Total',
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      footerNote: 'Thank you for trusting Falghe!',
      loading: 'Searching...',
      editInvoice: 'Edit Invoice',
      doneEdit: 'Done Editing',
      addItem: 'Add Item',
      backToTracking: 'Back to Tracking',
    },
  };

  const handleSearch = async () => {
    setError('');
    setFoundInvoice(null);
    if (!orderCode.trim()) { setError(t[language].enterCode); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices?orderCode=${orderCode.toUpperCase()}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setFoundInvoice(data);
      const fetchedItems = data.items || [];
      setItems(fetchedItems.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || item.unit_price || 0,
        total: item.total || 0,
      })));
      setTaxRate(data.tax && data.subtotal ? Math.round((data.tax / data.subtotal) * 100) : 10);
      setDueDate(data.order?.eta || '');
      setIsEditing(false);
    } catch { setError(t[language].noInvoice); }
    finally { setIsLoading(false); }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : updated[index].quantity;
      const price = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
      updated[index].total = qty * price;
    }
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + tax;

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return 'bg-green-100 text-green-700';
    if (status === 'sent') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'paid') return t[language].paid;
    if (status === 'sent') return t[language].sent;
    return t[language].draft;
  };

  const order = foundInvoice?.order;
  const createdAt = foundInvoice?.created_at ? new Date(foundInvoice.created_at) : new Date();
  const inputClass = "px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02]";

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-br from-[#FFF3EC] to-[#FFF8F4] py-8 px-4">
        <div className="container max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t[language].title}</h1>
            <p className="text-muted-foreground mt-1">{t[language].subtitle}</p>
          </div>
          {onBackToTracking && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onBackToTracking}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-foreground hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{t[language].backToTracking}</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="container max-w-3xl px-4 py-8">
        {/* Search */}
        <div className="sbc-card p-6 mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input type="text" placeholder={t[language].inputPlaceholder} value={orderCode}
                onChange={e => setOrderCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pr-10 px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02]" />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <button onClick={handleSearch} disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] disabled:opacity-60 font-medium transition-colors">
              {isLoading ? t[language].loading : t[language].searchButton}
            </button>
          </div>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />{error}
            </motion.div>
          )}
        </div>

        {foundInvoice && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="sbc-card p-8 bg-white">

            {/* Invoice Header */}
            <div className="flex items-start justify-between mb-8 pb-8 border-b border-border">
              <div>
                <img src="/falghe-logo.png" alt="Falghe" className="w-14 h-14 object-contain mb-3" />
                <p className="text-sm font-semibold">Falghe Production Tracker</p>
                <p className="text-xs text-muted-foreground">Surakarta, Indonesia</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">{t[language].invoiceNumber}</p>
                <p className="text-2xl font-bold text-[#FB5F02] mb-4">{foundInvoice.invoice_number}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(foundInvoice.status)}`}>
                  {getStatusLabel(foundInvoice.status)}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t[language].date}</p>
                <p className="font-medium">{createdAt.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t[language].dueDate}</p>
                {isEditing ? (
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${inputClass} h-8`} />
                ) : (
                  <p className="font-medium">{dueDate ? new Date(dueDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                )}
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-sm font-semibold mb-2">{t[language].from}</p>
                <p className="text-sm font-medium">Falghe Production Tracker</p>
                <p className="text-xs text-muted-foreground">Surakarta, Indonesia</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">{t[language].billTo}</p>
                <p className="text-sm font-medium">{order?.client_name || '-'}</p>
                <p className="text-xs text-muted-foreground">{order?.whatsapp || '-'}</p>
                {order?.company && <p className="text-xs text-muted-foreground">{order.company}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 font-semibold">{t[language].description}</th>
                    <th className="text-right py-3 font-semibold w-16">{t[language].quantity}</th>
                    <th className="text-right py-3 font-semibold w-28">{t[language].unitPrice}</th>
                    <th className="text-right py-3 font-semibold w-28">{t[language].total}</th>
                    {isEditing && <th className="w-8"></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="py-2">
                        {isEditing ? (
                          <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className={`${inputClass} w-full`} />
                        ) : <span>{item.description}</span>}
                      </td>
                      <td className="text-right py-2">
                        {isEditing ? (
                          <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className={`${inputClass} w-16 text-right ml-auto block`} />
                        ) : <span>{item.quantity.toLocaleString()}</span>}
                      </td>
                      <td className="text-right py-2">
                        {isEditing ? (
                          <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className={`${inputClass} w-full text-right`} />
                        ) : <span>Rp {item.unitPrice.toLocaleString('id-ID')}</span>}
                      </td>
                      <td className="text-right py-2 font-medium">Rp {item.total.toLocaleString('id-ID')}</td>
                      {isEditing && (
                        <td className="py-2 pl-2">
                          <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isEditing && (
                <button onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])}
                  className="mt-3 flex items-center gap-2 text-sm text-[#FB5F02] hover:text-[#E85500] font-medium">
                  <Plus className="w-4 h-4" />{t[language].addItem}
                </button>
              )}
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-80">
                <div className="flex justify-between py-2 border-b border-border mb-2">
                  <span>{t[language].subtotal}</span>
                  <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <span>{t[language].tax}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={taxRate} min={0} max={100}
                          onChange={e => setTaxRate(Number(e.target.value))}
                          className={`${inputClass} h-7 w-16 text-center`} />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">({taxRate}%)</span>
                    )}
                  </div>
                  <span className="font-medium">Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-3 bg-[#FB5F02]/10 px-4 rounded-lg">
                  <span className="font-bold">{t[language].grandTotal}</span>
                  <span className="font-bold text-[#FB5F02] text-lg">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Edit Toggle */}
            <div className="flex justify-end mb-6">
              <button onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditing ? 'bg-[#FB5F02] text-white hover:bg-[#E85500]' : 'border border-border hover:bg-secondary'}`}>
                {isEditing ? t[language].doneEdit : t[language].editInvoice}
              </button>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">{t[language].footerNote}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Invoice;
