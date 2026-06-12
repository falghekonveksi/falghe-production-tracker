import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, Clock, AlertCircle, Loader } from 'lucide-react';
import { getOrderByCode, getProductionSteps, getPhotos } from '@/lib/api';
import { Lightbox } from '@/components/Lightbox';

const DIVISION_ORDER = ['Cutting','Sablon','Jahit','Finishing','QC','Packing','Delivery'];

function sortSteps(steps: any[]) {
  return [...steps].sort((a, b) => {
    const ai = DIVISION_ORDER.indexOf(a.step_name);
    const bi = DIVISION_ORDER.indexOf(b.step_name);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

interface TrackingProps {
  language: 'id' | 'en';
}

export function Tracking({ language }: TrackingProps) {
  const [orderCode, setOrderCode] = useState('');
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const [productionSteps, setProductionSteps] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const t = {
    id: {
      title: 'Tracking Produksi',
      subtitle: 'Pantau progress produksi pesanan Anda secara real-time',
      inputPlaceholder: 'Masukkan kode pesanan (contoh: FLG-00001)',
      checkButton: 'Cek Status',
      noOrder: 'Pesanan tidak ditemukan',
      enterCode: 'Masukkan kode pesanan untuk melihat status',
      progress: 'Progress',
      eta: 'Estimasi Selesai',
      timeline: 'Timeline Produksi',
      done: 'Selesai',
      active: 'Sedang Berjalan',
      pending: 'Menunggu',
      clientName: 'Nama Klien',
      quantity: 'Kuantitas',
      size: 'Ukuran',
      price: 'Harga per pcs',
      loading: 'Mencari...',
      whatsapp: 'Notifikasi WhatsApp',
      notificationInfo: 'Anda akan menerima update melalui WhatsApp',
    },
    en: {
      title: 'Production Tracking',
      subtitle: 'Monitor your order production progress in real-time',
      inputPlaceholder: 'Enter order code (e.g.: FLG-00001)',
      checkButton: 'Check Status',
      noOrder: 'Order not found',
      enterCode: 'Enter order code to view status',
      progress: 'Progress',
      eta: 'Estimated Completion',
      timeline: 'Production Timeline',
      done: 'Completed',
      active: 'In Progress',
      pending: 'Pending',
      clientName: 'Client Name',
      quantity: 'Quantity',
      size: 'Size',
      price: 'Price per pcs',
      loading: 'Searching...',
      whatsapp: 'WhatsApp Notification',
      notificationInfo: 'You will receive updates via WhatsApp',
    },
  };

  const handleCheck = async () => {
    setError('');
    setFoundOrder(null);
    setProductionSteps([]);
    setPhotos([]);
    if (!orderCode.trim()) { setError(t[language].enterCode); return; }
    setIsLoading(true);
    try {
      const order = await getOrderByCode(orderCode.toUpperCase());
      if (order) {
        setFoundOrder(order);
        const [steps, pics] = await Promise.all([
          getProductionSteps(order.id),
          getPhotos(order.id),
        ]);
        setProductionSteps(sortSteps(steps || []));
        setPhotos(Array.isArray(pics) ? pics : []);
      } else {
        setError(t[language].noOrder);
      }
    } catch {
      setError(t[language].noOrder);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return t[language].done;
    if (status === 'in_progress') return t[language].active;
    return t[language].pending;
  };

  const lastActiveIndex = productionSteps.map(s => s.status).lastIndexOf('in_progress');

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-br from-[#FFF3EC] to-[#FFF8F4] py-8 px-4">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t[language].title}</h1>
          <p className="text-muted-foreground">{t[language].subtitle}</p>
        </div>
      </div>

      <div className="container max-w-2xl px-4 py-8">
        <div className="sbc-card p-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t[language].inputPlaceholder}
                value={orderCode}
                onChange={e => setOrderCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                className="w-full pr-10 px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <button onClick={handleCheck} disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] disabled:opacity-60 font-medium flex items-center gap-2 transition-colors">
              {isLoading ? <><Loader className="w-4 h-4 animate-spin" />{t[language].loading}</> : t[language].checkButton}
            </button>
          </div>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />{error}
            </motion.div>
          )}
          {!foundOrder && !error && (
            <div className="mt-4 p-4 bg-secondary/50 text-muted-foreground rounded-lg text-sm text-center">
              {t[language].enterCode}
            </div>
          )}
        </div>

        {foundOrder && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">

            <div className="sbc-card p-6">
              <h2 className="text-xl font-semibold mb-4">{language === 'id' ? 'Informasi Pesanan' : 'Order Information'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  [t[language].clientName, foundOrder.client_name],
                  ['Status', foundOrder.status],
                  [t[language].quantity, `${foundOrder.quantity?.toLocaleString('id-ID')} pcs`],
                  [t[language].size, foundOrder.size],
                  [t[language].price, `Rp ${foundOrder.price_per_pcs?.toLocaleString('id-ID')}`],
                  [t[language].eta, foundOrder.eta ? new Date(foundOrder.eta).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="sbc-card p-6">
              <h3 className="text-lg font-semibold mb-4">{t[language].progress}</h3>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${foundOrder.progress || 0}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: 'linear-gradient(90deg, #FB5F02, #FF8C47)' }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {foundOrder.progress || 0}% {language === 'id' ? 'selesai' : 'complete'}
              </p>
            </div>

            <div className="sbc-card p-6">
              <h3 className="text-lg font-semibold mb-6">{t[language].timeline}</h3>
              {productionSteps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'id' ? 'Belum ada tahap produksi' : 'No production steps yet'}
                </p>
              ) : (
                <div className="space-y-4">
                  {productionSteps.map((step, index) => {
                    const isLastActive = index === lastActiveIndex;
                    return (
                      <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                            step.status === 'completed' ? 'bg-[#FB5F02]/10' :
                            step.status === 'in_progress' ? 'bg-[#FF8C47]/20' : 'bg-gray-100'
                          }`}>
                            {isLastActive && (
                              <motion.div
                                className="absolute inset-0 rounded-full bg-[#FF8C47]/40"
                                animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                              />
                            )}
                            {step.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-[#FB5F02]" />}
                            {step.status === 'in_progress' && <Clock className="w-5 h-5 text-[#FF8C47]" />}
                            {step.status === 'pending' && <AlertCircle className="w-5 h-5 opacity-30" />}
                          </div>
                          {index < productionSteps.length - 1 && (
                            <div className={`w-0.5 h-12 mt-2 ${step.status === 'completed' ? 'bg-[#FB5F02]/30' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="flex-1 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{step.step_name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              step.status === 'completed' ? 'bg-[#FB5F02]/10 text-[#FB5F02]' :
                              step.status === 'in_progress' ? 'bg-[#FF8C47]/20 text-[#E85500]' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {getStatusLabel(step.status)}
                            </span>
                          </div>
                          {step.notes && <p className="text-sm text-muted-foreground mt-1">{step.notes}</p>}
                          {step.started_at && <p className="text-xs text-muted-foreground mt-1">{language === 'id' ? 'Mulai:' : 'Started:'} {new Date(step.started_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</p>}
                          {step.completed_at && <p className="text-xs text-muted-foreground mt-1">{language === 'id' ? 'Selesai:' : 'Completed:'} {new Date(step.completed_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</p>}
                          {photos.filter(p => p.step_name === step.step_name).map((p, i) => (
                            <div key={i} className="mt-2">
                              <img src={p.photo_url} alt={step.step_name}
                                className="rounded-lg max-w-full h-40 object-cover border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
                                onClick={() => setLightboxUrl(p.photo_url)} />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sbc-card p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">💬</span>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">{t[language].whatsapp}</h4>
                  <p className="text-sm text-green-800 mt-1">{t[language].notificationInfo}</p>
                  {foundOrder.whatsapp && <p className="text-sm text-green-700 mt-2 font-mono">{foundOrder.whatsapp}</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}

export default Tracking;
