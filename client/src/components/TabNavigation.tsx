import { motion } from 'framer-motion';
import { Search, RefreshCw, LayoutDashboard, FileText } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  protected?: boolean;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  language: 'id' | 'en';
}

export function TabNavigation({ activeTab, onTabChange, language }: TabNavigationProps) {
  const tabs: Tab[] = [
    { id: 'tracking', label: language === 'id' ? 'Tracking' : 'Tracking', icon: <Search className="w-4 h-4" /> },
    { id: 'update', label: language === 'id' ? 'Update' : 'Update', icon: <RefreshCw className="w-4 h-4" />, protected: true },
    { id: 'admin', label: language === 'id' ? 'Admin' : 'Admin', icon: <LayoutDashboard className="w-4 h-4" />, protected: true },
    { id: 'invoice', label: language === 'id' ? 'Invoice' : 'Invoice', icon: <FileText className="w-4 h-4" />, protected: true },
  ];

  return (
    <nav className="sticky top-[73px] z-30 bg-card border-b border-border shadow-sm">
      <div className="container max-w-full px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-[#FB5F02]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.protected && (
                <span className="text-[10px] text-muted-foreground">🔒</span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FB5F02]"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default TabNavigation;
