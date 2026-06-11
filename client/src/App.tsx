import { useState } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { PasswordProvider, usePassword } from './contexts/PasswordContext';
import { Topbar } from './components/Topbar';
import { TabNavigation } from './components/TabNavigation';
import { PasswordModal } from './components/PasswordModal';
import { Tracking } from './pages/Tracking';
import { UpdateProses } from './pages/UpdateProses';
import { Admin } from './pages/Admin';
import { Invoice } from './pages/Invoice';

function AppContent() {
  const [activeTab, setActiveTab] = useState('tracking');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const { isAuthenticated, authenticate } = usePassword();

  const protectedTabs = ['update', 'admin', 'invoice'];

  const handleTabChange = (tabId: string) => {
    if (protectedTabs.includes(tabId) && !isAuthenticated) {
      setPendingTab(tabId);
      setShowPasswordModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const handlePasswordSubmit = (password: string): boolean => {
    const success = authenticate(password);
    if (success) {
      setShowPasswordModal(false);
      if (pendingTab) { setActiveTab(pendingTab); setPendingTab(null); }
    }
    return success;
  };

  const handleBackToTracking = () => setActiveTab('tracking');

  const renderPage = () => {
    switch (activeTab) {
      case 'tracking': return <Tracking language={language} />;
      case 'update': return <UpdateProses language={language} onBackToTracking={handleBackToTracking} />;
      case 'admin': return <Admin language={language} onBackToTracking={handleBackToTracking} />;
      case 'invoice': return <Invoice language={language} onBackToTracking={handleBackToTracking} />;
      default: return <Tracking language={language} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Topbar language={language} onLanguageChange={setLanguage} />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} language={language} />
      <main>{renderPage()}</main>
      <PasswordModal
        isOpen={showPasswordModal}
        onSubmit={handlePasswordSubmit}
        onBackToTracking={() => { setShowPasswordModal(false); setActiveTab('tracking'); setPendingTab(null); }}
        title={language === 'id' ? 'Area Terlindungi' : 'Protected Area'}
        description={language === 'id' ? 'Masukkan password untuk mengakses halaman ini' : 'Enter password to access this page'}
      />
      <Toaster richColors position="top-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <PasswordProvider>
        <AppContent />
      </PasswordProvider>
    </ThemeProvider>
  );
}

export default App;
