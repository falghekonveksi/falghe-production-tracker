import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle2, AlertCircle, Trash2, ArrowLeft, Loader } from 'lucide-react';
import { getOrders, createOrder, deleteOrder } from '@/lib/api';

interface AdminProps {
  language: 'id' | 'en';
  onBackToTracking?: () => void;
}

export function Admin({ language, onBackToTracking }: AdminProps) {
  const [manualCode, setManualCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [quantity, setQuantity] = useState('');
  const [size, setSize] = useState('');
  const [pricePerPcs, setPricePerPcs] = useState('');
  const [eta, setEta] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);

  const t = {
    id: {
      title: 'Admin Dashboard',
      subtitle: 'Kelola pesanan produksi Falghe',
      createOrder: 'Buat Pesanan Baru',
      manualCode: 'Kode Pesanan Manual (Opsional)',
      manualCodePlaceholder: 'Biarkan kosong untuk auto-generate',
      clientName: 'Nama Klien',
      whatsapp: 'Nomor WhatsApp',
      quantity: 'Kuantitas (pcs)',
      size: 'Ukuran',
      pricePerPcs: 'Harga per pcs (Rp)',
      etaLabel: 'Estimasi Selesai',
      company: 'Perusahaan/Event',
      submit: 'Buat Pesanan',
      orderCreated: 'Pesanan berhasil dibuat!',
      trackingLink: 'Link Tracking',
      copy: 'Salin',
      copied: 'Tersalin!',
      activeOrders: 'Pesanan Aktif',
      noOrders: 'Tidak ada pesanan aktif',
      code: 'Kode',
      delete: 'Hapus',
      deleteConfirm: 'Hapus pesanan ini?',
      cancel: 'Batal',
      backToTracking: 'Kembali ke Tracking',
    },
    en: {
      title: 'Admin Dashboard',
      subtitle: 'Manage Falghe production orders',
      createOrder: 'Create New Order',
      manualCode: 'Manual Order Code (Optional)',
      manualCodePlaceholder: 'Leave empty for auto-generate',
      clientName: 'Client Name',
      whatsapp: 'WhatsApp Number',
      quantity: 'Quantity (pcs)',
      size: 'Size',
      pricePerPcs: 'Price per pcs (Rp)',
      etaLabel: 'Estimated Completion',
      company: 'Company/Event',
      submit: 'Create Order',
      orderCreated: 'Order created successfully!',
      trackingLink: 'Tracking Link',
      copy: 'Copy',
      copied: 'Copied!',
      activeOrders: 'Active Orders',
      noOrders: 'No active orders',
      code: 'Code',
      delete: 'Delete',
      deleteConfirm: 'Delete this order?',
      cancel: 'Cancel',
      backToTracking: 'Back to Tracking',
    },
  };

  const fetchOrders = async () => {
    setIsFetchingOrders(true);
    try {
      const orders = await getOrders();
      setActiveOrders(orders.filter((o: any) => o.status !== 'completed'));
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingOrders(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const generateOrderCode = (orders: any[]) => {
    if (orders.length === 0) return 'FLG-00001';
    const last = orders[0];
    const lastNum = parseInt(last.code?.split('-')[1] || '0', 10);
    return `FLG-${String(lastNum + 1).padStart(5, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!clientName || !whatsapp || !quantity || !size || !pricePerPcs || !eta) {
      setError('Lengkapi semua field yang diperlukan');
      return;
    }
    setIsLoading(true);
    try {
      const allOrders = await getOrders();
      const orderCode = manualCode || generateOrderCode(allOrders);
      const newOrder = await createOrder({
        code: orderCode,
        clientName, whatsapp,
        quantity: parseInt(quantity),
        size,
        pricePerPcs: parseInt(pricePerPcs),
        eta, company,
      });
      setCreatedOrder(newOrder);
      setSuccess(t[language].orderCreated);
      setManualCode(''); setClientName(''); setWhatsapp('');
      setQuantity(''); setSize(''); setPricePerPcs('');
      setEta(''); setCompany('');
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(parseInt(orderId));
      setDeleteConfirm(null);
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const inputClass = "w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02]";

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-br from-[#FFF3EC] to-[#FFF8F4] py-8 px-4">
        <div className="container max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t[language].title}</h1>
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

      <div className="container max-w-4xl px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="sbc-card p-6">
              <h2 className="text-xl font-bold mb-6">{t[language].createOrder}</h2>

              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />{success}
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />{error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t[language].manualCode}</label>
                  <input type="text" placeholder={t[language].manualCodePlaceholder} value={manualCode}
                    onChange={e => setManualCode(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t[language].clientName} *</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t[language].whatsapp} *</label>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t[language].quantity} *</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t[language].size} *</label>
                    <input type="text" value={size} onChange={e => setSize(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t[language].pricePerPcs} *</label>
                    <input type="number" value={pricePerPcs} onChange={e => setPricePerPcs(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t[language].etaLabel} *</label>
                    <input type="date" value={eta} onChange={e => setEta(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t[language].company}</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} className={inputClass} />
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full h-11 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] disabled:opacity-60 font-medium flex items-center justify-center gap-2 transition-colors">
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : t[language].submit}
                </button>
              </form>
            </div>

            {createdOrder && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mt-6 sbc-card p-6 bg-gradient-to-br from-[#FFF3EC] to-[#FFF8F4]">
                <h3 className="text-lg font-bold mb-4">{t[language].orderCreated}</h3>
                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-[#FB5F02]">
                  <p className="text-sm text-muted-foreground mb-1">{t[language].code}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#FB5F02]">{createdOrder.code}</p>
                    <button onClick={() => handleCopy(createdOrder.code, 'code')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">
                      <Copy className="w-4 h-4" />
                      {copiedCode === 'code' ? t[language].copied : t[language].copy}
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">{t[language].trackingLink}</p>
                  <button onClick={() => handleCopy(`${window.location.origin}?order=${createdOrder.code}`, 'link')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] transition-colors text-sm font-medium">
                    <Copy className="w-4 h-4" />
                    {copiedCode === 'link' ? t[language].copied : t[language].copy}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Active Orders Sidebar */}
          <div className="lg:col-span-1">
            <div className="sbc-card p-6 sticky top-[180px]">
              <h3 className="text-lg font-bold mb-4">{t[language].activeOrders}</h3>
              {isFetchingOrders ? (
                <div className="flex justify-center py-4"><Loader className="w-5 h-5 animate-spin text-[#FB5F02]" /></div>
              ) : activeOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t[language].noOrders}</p>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map(order => (
                    <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-secondary rounded-lg text-sm">
                      <p className="font-medium text-foreground mb-1">{order.code}</p>
                      <p className="text-xs text-muted-foreground mb-2">{order.client_name}</p>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-gradient-to-r from-[#FB5F02] to-[#FF8C47]" style={{ width: `${order.progress}%` }} />
                      </div>
                      <button onClick={() => setDeleteConfirm(order.id)}
                        className="w-full flex items-center justify-center gap-2 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3 h-3" />{t[language].delete}
                      </button>

                      <AnimatePresence>
                        {deleteConfirm === order.id && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                              className="bg-card rounded-lg p-6 max-w-sm mx-4 shadow-lg">
                              <p className="font-medium mb-4">{t[language].deleteConfirm}</p>
                              <div className="flex gap-3">
                                <button onClick={() => handleDeleteOrder(order.id)}
                                  className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium">{t[language].delete}</button>
                                <button onClick={() => setDeleteConfirm(null)}
                                  className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary font-medium">{t[language].cancel}</button>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
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

export default Admin;
