/**
 * Topbar - Sticky header with FALGHE branding and language toggle
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

interface TopbarProps {
  language: 'id' | 'en';
  onLanguageChange: (lang: 'id' | 'en') => void;
}

export function Topbar({ language, onLanguageChange }: TopbarProps) {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const t = {
    id: { brand: 'Falghe Production Tracker', tracker: 'Sistem Tracking Produksi' },
    en: { brand: 'Falghe Production Tracker', tracker: 'Production Tracking System' },
  };

  return (
    <header className="sticky top-0 z-40 bg-card text-card-foreground border-b border-border shadow-sm">
      <div className="container max-w-full px-4 py-3 flex items-center justify-between">
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-3 flex-1">
          <img
            src="/falghe-logo.png"
            alt="Falghe Logo"
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">{t[language].brand}</p>
            <p className="text-xs text-muted-foreground">{t[language].tracker}</p>
          </div>
          <div className="sm:hidden">
            <p className="text-sm font-bold text-foreground">FALGHE</p>
            <p className="text-xs text-muted-foreground">Tracker</p>
          </div>
        </div>

        {/* Right: Language Toggle */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="touch-target flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
          </motion.button>

          {isLangMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-max"
            >
              {(['id', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { onLanguageChange(lang); setIsLangMenuOpen(false); }}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    language === lang
                      ? 'bg-[#FB5F02] text-white font-medium'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {lang === 'id' ? 'Bahasa Indonesia' : 'English'}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
