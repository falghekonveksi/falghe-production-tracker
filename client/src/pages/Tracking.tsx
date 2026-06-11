import { useState } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, Clock, AlertCircle, Loader } from 'lucide-react';
import { getOrderByCode, getProductionSteps, getPhotos } from '@/lib/api';

interface TrackingProps {
  language: 'id' | 'en';
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const [scale, setScale] = React.useState(1);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const VW = 320, VH = 240;

  function clamp(s: number, x: number, y: number) {
    const maxX = Math.max(0, (VW * s - VW) / 2);
    const maxY = Math.max(0, (VH * s - VH) / 2);
    return [Math.min(maxX, Math.max(-maxX, x)), Math.min(maxY, Math.max(-maxY, y))];
  }

  function zoomStep(delta: number) {
    setScale(prev => {
      const next = Math.min(4, Math.max(0.5, prev + delta));
      const [cx, cy] = clamp(next, tx, ty);
      setTx(cx); setTy(cy);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(14px)', background: 'rgba(255,255,255,0.25)' }}
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        <div style={{ width: VW, height: VH, overflow: 'hidden', borderRadius: 12, border: '0.5px solid #e2e8f0', background: '#fff', position: 'relative' }}>
          <img
            src={url}
            alt="foto produksi"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', transform: `translate(${tx}px,${ty}px) scale(${scale})`, userSelect: 'none' }}
            draggable={false}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 99, padding: '6px 14px' }}>
          <button onClick={() => zoomStep(-0.25)} style={{ width: 32, height: 32, borderRadius: '50%', border: '0.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span style={{ fontSize: 13, color: '#64748b', minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => zoomStep(0.25)} style={{ width: 32, height: 32, borderRadius: '50%', border: '0.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '0.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Klik di luar untuk tutup · Scroll/pinch untuk zoom</p>
      </div>
    </div>
  );
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
        setProductionSteps(steps || []);
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

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-[#FB5F02]" />;
    if (status === 'in_progress') return <Clock className="w-5 h-5 text-[#FF8C47] animate-pulse-soft" />;
    return <AlertCircle className="w-5 h-5 opacity-30" />;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return t[language].done;
    if (status === 'in_progress') return t[language].active;
    return t[language].pending;
  };

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
            <button
              onClick={handleCheck}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] disabled:opacity-60 font-medium flex items-center gap-2 transition-colors"
            >
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
            {/* Order Info */}
            <div className="sbc-card p-6">
              <h2 className="text-xl font-semibold mb-4">{language === 'id' ? 'Informasi Pesanan' : 'Order Information'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  [t[language].clientName, foundOrder.client_name],
                  ['Status', foundOrder.status],
                  [t[language].quantity, `${foundOrder.quantity} pcs`],
                  [t[language].size, foundOrder.size],
                  [t[language].price, `Rp ${foundOrder.price_per_pcs?.toLocaleString('id-ID')}`],
                  [t[language].eta, foundOrder.eta ? new Date(foundOrder.eta).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="sbc-card p-6">
              <h3 className="text-lg font-semibold mb-4">{t[language].progress}</h3>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${foundOrder.progress || 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#FB5F02] to-[#FF8C47]"
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{foundOrder.progress || 0}% {language === 'id' ? 'selesai' : 'complete'}</p>
            </div>

            {/* Timeline */}
            <div className="sbc-card p-6">
              <h3 className="text-lg font-semibold mb-6">{t[language].timeline}</h3>
              {productionSteps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{language === 'id' ? 'Belum ada tahap produksi' : 'No production steps yet'}</p>
              ) : (
                <div className="space-y-4">
                  {productionSteps.map((step, index) => (
                    <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.status === 'completed' ? 'bg-[#FB5F02]/10' :
                          step.status === 'in_progress' ? 'bg-[#FF8C47]/20' : 'bg-gray-100'
                        }`}>
                          {getStatusIcon(step.status)}
                        </div>
                        {index < productionSteps.length - 1 && <div className="w-1 h-12 bg-border mt-2" />}
                      </div>
                      <div className="flex-1 py-2">
                        <h4 className="font-semibold">{step.step_name}</h4>
                        <p className="text-sm text-muted-foreground">{getStatusLabel(step.status)}</p>
                        {step.notes && <p className="text-sm mt-1">{step.notes}</p>}
                        {step.started_at && <p className="text-xs text-muted-foreground mt-1">{language === 'id' ? 'Mulai:' : 'Started:'} {new Date(step.started_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</p>}
                        {step.completed_at && <p className="text-xs text-muted-foreground mt-1">{language === 'id' ? 'Selesai:' : 'Completed:'} {new Date(step.completed_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</p>}
                        {photos.filter(p => p.step_name === step.step_name).map((p, i) => (
                          <div key={i} className="mt-2">
                            <img src={p.photo_url} alt={step.step_name} className="rounded-lg max-w-full h-40 object-cover border border-border cursor-pointer" onClick={() => setLightboxUrl(p.photo_url)} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* WA Notification */}
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
