import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => boolean;
  onBackToTracking: () => void;
  title: string;
  description: string;
}

export function PasswordModal({ isOpen, onSubmit, onBackToTracking, title, description }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const success = onSubmit(password);
    if (!success) {
      setError('Password salah. Coba lagi.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FB5F02]/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#FB5F02]" />
          </div>
          <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="••••••••"
          className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FB5F02] mb-2"
        />

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onBackToTracking}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors text-sm font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg bg-[#FB5F02] text-white hover:bg-[#E85500] transition-colors text-sm font-medium"
          >
            Masuk
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default PasswordModal;
