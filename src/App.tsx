import './App.css';
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/Sidebar/AppSidebar"
import FinancialDashboard from './screens/FinancialDashboard';
import AddExpense from './screens/AddExpense';
import AuthModal from './components/login/AuthModal';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './screens/admin/UserManagement';
import SiteManagement from './screens/admin/SiteManagement';
import ClientsList from './screens/clients/ClientsList';
import InvoicesList from './screens/invoices/InvoicesList';
import ImageConverter from './screens/ImageConverter';

function MainArea() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><FinancialDashboard /></ProtectedRoute>} />
      <Route path="/add-fixed-cost" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AddExpense type="fixed" /></ProtectedRoute>} />
      <Route path="/add-operational-cost" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AddExpense type="operational" /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/sites" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SiteManagement /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><ClientsList /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><InvoicesList /></ProtectedRoute>} />
      <Route path="/image-converter" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><ImageConverter /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { showModal, user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center text-gray-500 font-medium tracking-wide bg-[#F1F5F9] animate-pulse">Loading Dashboard...</div>;
  }

  return (
    <>
      {showModal && <AuthModal />}

      {/* If the dashboard should be completely hidden until authenticated: */}
      {user ? (
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-[#f8fafc]">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto flex">
              <MainArea />
            </main>
          </div>
        </SidebarProvider>
      ) : (
        <div className="flex min-h-screen w-full justify-center items-center">
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App

