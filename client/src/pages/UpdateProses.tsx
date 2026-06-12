import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, AlertCircle, CheckCircle2, Loader, ArrowLeft, Trash2, Clock } from 'lucide-react';
import { getOrderByCode, getProductionSteps, createProductionStep, getPhotos, deletePhoto } from '@/lib/api';
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

interface UpdateProsesProps {
  language: 'id' | 'en';
  onBackToTracking?: () => void;
}

const DIVISIONS = [
  { id: 'cutting', name: 'Cutting' },
  { id: 'sablon', name: 'Sablon' },
  { id: 'jahit', name: 'Jahit' },
  { id: 'finishing', name: 'Finishing' },
  { id: 'qc', name: 'QC' },
  { id: 'packing', name: 'Packing' },
  { id: 'delivery', name: 'Delivery' },
];

const STATUS_OPTIONS = [
  { id: 'pending', name: 'Pending' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Falghe2024';

export function UpdateProses({ language, onBackToTracking }: UpdateProsesProps) {
  const [orderCode, setOrderCode] = useState('');
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const [existingSteps, setExistingSteps] = useState<any[]>([]);
  const [stepPhotos, setStepPhotos] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'password' | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const t = {
    id: {
      title: 'Update Proses Produksi',
      subtitle: 'Perbarui status produksi pesanan',
      step1: 'Langkah 1: Cari Pesanan',
      step2: 'Langkah 2: Pilih Divisi',
      step3: 'Langkah 3: Perbarui Status',
      inputPlaceholder: 'Masukkan kode pesanan',
      searchButton: 'Cari',
      selectDivision: 'Pilih divisi...',
      selectStatus: 'Pilih status...',
      notes: 'Catatan (Opsional)',
      notesPlaceholder: 'Tambahkan catatan tentang progress...',
      images: 'Upload Foto ke Cloudinary (Opsional)',
      dragDrop: 'Drag & drop foto atau klik untuk memilih',
      submit: 'Kirim Update',
      noOrder: 'Pesanan tidak ditemukan',
      successMessage: 'Update berhasil! Entry lama otomatis diganti.',
      errorMessage: 'Terjadi kesalahan. Silakan coba lagi.',
      backToTracking: 'Kembali ke Tracking',
      loading: 'Memproses...',
      searching: 'Mencari...',
      cancel: 'Batal',
      clear: 'Hapus Pencarian',
      historyTitle: 'Riwayat Update',
      noHistory: 'Belum ada update',
      deleteConfirm: 'Yakin ingin menghapus update ini?',
      deletePassword: 'Masukkan password admin',
      deleteBtn: 'Hapus',
      wrongPassword: 'Password salah',
    },
    en: {
      title: 'Update Production Process',
      subtitle: 'Update order production status',
      step1: 'Step 1: Search Order',
      step2: 'Step 2: Select Division',
      step3: 'Step 3: Update Status',
      inputPlaceholder: 'Enter order code',
      searchButton: 'Search',
      selectDivision: 'Select division...',
      selectStatus: 'Select status...',
      notes: 'Notes (Optional)',
      notesPlaceholder: 'Add notes about progress...',
      images: 'Upload Photos to Cloudinary (Optional)',
      dragDrop: 'Drag & drop photos or click to select',
      submit: 'Submit Update',
      noOrder: 'Order not found',
      successMessage: 'Update submitted! Previous entry auto-replaced.',
      errorMessage: 'An error occurred. Please try again.',
      backToTracking: 'Back to Tracking',
      loading: 'Processing...',
      searching: 'Searching...',
      cancel: 'Cancel',
      clear: 'Clear Search',
      historyTitle: 'Update History',
      noHistory: 'No updates yet',
      deleteConfirm: 'Are you sure you want to delete this update?',
      deletePassword: 'Enter admin password',
      deleteBtn: 'Delete',
      wrongPassword: 'Wrong password',
    },
  };

  const fetchSteps = async (orderId: number) => {
    try {
      const [steps, pics] = await Promise.all([
        getProductionSteps(orderId),
        getPhotos(orderId),
      ]);
      setExistingSteps(sortSteps(steps || []));
      setStepPhotos(Array.isArray(pics) ? pics : []);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async () => {
    setError('');
    setFoundOrder(null);
    setExistingSteps([]);
    if (!orderCode.trim()) { setError(language === 'id' ? 'Masukkan kode pesanan' : 'Enter order code'); return; }
    setIsSearching(true);
    try {
      const order = await getOrderByCode(orderCode.toUpperCase());
      if (order) { setFoundOrder(order); await fetchSteps(order.id); }
      else setError(t[language].noOrder);
    } catch { setError(t[language].noOrder); }
    finally { setIsSearching(false); }
  };

  const compressImage = (file: File, maxKB = 1024): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
            else { width = Math.round(width * maxDim / height); height = maxDim; }
          }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          let quality = 0.9;
          let result = canvas.toDataURL('image/jpeg', quality);
          while (result.length * 0.75 > maxKB * 1024 && quality > 0.1) { quality -= 0.05; result = canvas.toDataURL('image/jpeg', quality); }
          resolve(result);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!foundOrder || !selectedDivision || !status) {
      setError(language === 'id' ? 'Lengkapi semua field yang diperlukan' : 'Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const stepName = DIVISIONS.find(d => d.id === selectedDivision)?.name || selectedDivision;

      // Backend auto-delete entry lama divisi yang sama sebelum insert baru
      await createProductionStep({
        orderId: foundOrder.id, stepName, status, notes,
        startedAt: new Date().toISOString(),
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      });

      if (images.length > 0) {
        for (const image of images) {
          const base64 = await compressImage(image);
          await fetch('/api/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: foundOrder.id, stepName, notes,
              fileName: image.name.replace(/\.[^.]+$/, '.jpg'),
              fileBase64: base64,
              mimeType: 'image/jpeg',
            }),
          });
        }
      }

      setSuccess(t[language].successMessage);
      setSelectedDivision(''); setStatus(''); setNotes(''); setImages([]);
      await fetchSteps(foundOrder.id);
    } catch (err: any) {
      setError(err.message || t[language].errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (stepId: number) => {
    setDeleteTargetId(stepId); setDeleteStep('confirm');
    setDeletePassword(''); setDeleteError('');
  };

  const handleDeleteWithPassword = async () => {
    if (deletePassword !== ADMIN_PASSWORD) { setDeleteError(t[language].wrongPassword); return; }
    setIsDeleting(true);
    try {
      await fetch(`/api/production-steps?id=${deleteTargetId}`, { method: 'DELETE' });
      setDeleteStep(null); setDeleteTargetId(null); setDeletePassword('');
      if (foundOrder) await fetchSteps(foundOrder.id);
    } catch { setDeleteError(t[language].errorMessage); }
    finally { setIsDeleting(false); }
  };

  const handleDeletePhoto = async (photo: any) => {
    if (!window.confirm('Hapus foto ini?')) return;
    try {
      await deletePhoto(photo.id, photo.cloudinary_public_id);
      setStepPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch { alert('Gagal menghapus foto'); }
  };

  const handleClearSearch = () => {
    setOrderCode(''); setFoundOrder(null); setExistingSteps([]);
    setSelectedDivision(''); setStatus(''); setNotes(''); setImages([]);
    setError(''); setSuccess('');
  };

  const getStatusColor = (s: string) => s === 'completed' ? 'text-[#FB5F02] bg-[#FB5F02]/10' : s === 'in_progress' ? 'text-orange-600 bg-orange-50' : 'text-gray-500 bg-gray-50';
  const getStatusLabel = (s: string) => s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Pending';

  const inputClass = "w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02]";
  const selectClass = "w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02] appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-br from-[#FFF3EC] to-[#FFF8F4] py-8 px-4">
        <div className="container max-w-4xl flex items-center justify-between">
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

      <div className="container max-w-4xl py-8 px-4 space-y-6">

        {/* Step 1 Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t[language].step1}</h2>
          <div className="flex gap-2">
            <input placeholder={t[language].inputPlaceholder} value={orderCode}
              onChange={e => setOrderCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !foundOrder && handleSearch()}
              disabled={!!foundOrder} className={inputClass} />
            {!foundOrder ? (
              <button onClick={handleSearch} disabled={isSearching}
                className="px-4 py-2 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] disabled:opacity-60 font-medium flex items-center gap-2 transition-colors whitespace-nowrap">
                {isSearching ? <><Loader className="w-4 h-4 animate-spin" />{t[language].searching}</> : <><Search className="w-4 h-4" />{t[language].searchButton}</>}
              </button>
            ) : (
              <button onClick={handleClearSearch}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors whitespace-nowrap text-sm font-medium">
                {t[language].clear}
              </button>
            )}
          </div>
          {error && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {foundOrder && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-700">
                {language === 'id' ? 'Pesanan ditemukan:' : 'Order found:'}{' '}
                <span className="font-bold">{foundOrder.client_name}</span>
              </p>
            </div>
          )}
        </motion.div>

        {/* History */}
        {foundOrder && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sbc-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FB5F02]" />
              {t[language].historyTitle}
            </h2>
            {existingSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t[language].noHistory}</p>
            ) : (
              <div className="space-y-3">
                {existingSteps.map(step => (
                  <div key={step.id}>
                    <div className="flex items-start justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{step.step_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(step.status)}`}>
                            {getStatusLabel(step.status)}
                          </span>
                        </div>
                        {step.notes && <p className="text-xs text-muted-foreground mb-1">{step.notes}</p>}
                        <p className="text-xs text-muted-foreground">
                          {step.created_at && new Date(step.created_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteClick(step.id)}
                        className="ml-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {stepPhotos.filter(p => p.step_name === step.step_name).map(p => (
                      <div key={p.id} className="relative mt-2">
                        <img src={p.photo_url} alt={p.step_name}
                          className="rounded-lg w-full h-36 object-cover border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxUrl(p.photo_url)} />
                        <button onClick={() => handleDeletePhoto(p)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Update Form */}
        {foundOrder && (
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit} className="sbc-card p-6 space-y-6">
            {success && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-700">{success}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">{t[language].step2}</h3>
              <select value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)} className={selectClass}>
                <option value="">{t[language].selectDivision}</option>
                {DIVISIONS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">{t[language].step3}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
                    <option value="">{t[language].selectStatus}</option>
                    {STATUS_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t[language].notes}</label>
                  <textarea placeholder={t[language].notesPlaceholder} value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-[#FB5F02]"
                    rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t[language].images}</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-[#FB5F02] transition-colors">
                    <input type="file" multiple accept="image/*"
                      onChange={e => setImages([...images, ...Array.from(e.target.files || [])])}
                      className="hidden" id="image-input" />
                    <label htmlFor="image-input" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t[language].dragDrop}</p>
                    </label>
                  </div>
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden bg-secondary">
                          <img src={URL.createObjectURL(image)} alt={`Preview ${index}`} className="w-full h-32 object-cover" />
                          <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full h-11 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] disabled:opacity-60 font-medium flex items-center justify-center gap-2 transition-colors">
              {isLoading ? <><Loader className="w-4 h-4 animate-spin" />{t[language].loading}</> : t[language].submit}
            </button>
          </motion.form>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteStep && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
              {deleteStep === 'confirm' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-semibold">{language === 'id' ? 'Hapus Update?' : 'Delete Update?'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{t[language].deleteConfirm}</p>
                  <div className="flex gap-3">
                    <button onClick={() => { setDeleteStep(null); setDeleteTargetId(null); }}
                      className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary font-medium">{t[language].cancel}</button>
                    <button onClick={() => setDeleteStep('password')}
                      className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium">{t[language].deleteBtn}</button>
                  </div>
                </>
              )}
              {deleteStep === 'password' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold">{language === 'id' ? 'Konfirmasi Password' : 'Confirm Password'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{t[language].deletePassword}</p>
                  <input type="password" value={deletePassword}
                    onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02] mb-2"
                    placeholder="••••••••" />
                  {deleteError && <p className="text-xs text-red-600 mb-4">{deleteError}</p>}
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { setDeleteStep(null); setDeleteTargetId(null); setDeletePassword(''); setDeleteError(''); }}
                      className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary font-medium">{t[language].cancel}</button>
                    <button onClick={handleDeleteWithPassword} disabled={isDeleting}
                      className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 font-medium flex items-center justify-center">
                      {isDeleting ? <Loader className="w-4 h-4 animate-spin" /> : t[language].deleteBtn}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}

export default UpdateProses;
