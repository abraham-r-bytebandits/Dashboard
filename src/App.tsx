import './App.css'
import { SidebarProvider } from './components/ui/sidebar'
import { AppSidebar } from './components/Sidebar/AppSidebar'
import FinancialDashboard from './screens/FinancialDashboard'
import AddExpense from './screens/AddExpense'
import AuthModal from './components/login/AuthModal'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from './store'
import { queryClient } from './lib/queryClient'
import { useAuth, AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import UserManagement from './screens/admin/UserManagement'
import SiteManagement from './screens/admin/SiteManagement'
import ClientsList from './screens/clients/ClientsList'
import InvoicesList from './screens/invoices/InvoicesList'
import ImageConverter from './screens/ImageConverter'
import ContactMessagesList from './screens/admin/ContactMessagesList'
import StatusBoard from './screens/work/StatusBoard'
import ImpactBoard from './screens/work/ImpactBoard'
import CreateAssessment from './screens/work/CreateAssessment'
import WorkDetails from './screens/work/WorkDetails'

import { TopNavbar } from './components/Navbar/TopNavbar'

function MainArea() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><FinancialDashboard /></ProtectedRoute>} />
      <Route path="/add-fixed-cost" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AddExpense type="fixed" /></ProtectedRoute>} />
      <Route path="/add-operational-cost" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AddExpense type="operational" /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/sites" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SiteManagement /></ProtectedRoute>} />
      <Route path="/admin/contacts" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><ContactMessagesList /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><ClientsList /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><InvoicesList /></ProtectedRoute>} />
      <Route path="/image-converter" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><ImageConverter /></ProtectedRoute>} />
      <Route path="/work/status-board" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><StatusBoard /></ProtectedRoute>} />
      <Route path="/work/impact-board" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><ImpactBoard /></ProtectedRoute>} />
      <Route path="/work/create" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><CreateAssessment /></ProtectedRoute>} />
      <Route path="/work/details/:id" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><WorkDetails /></ProtectedRoute>} />
      <Route path="/work/assessment/:id" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><WorkDetails /></ProtectedRoute>} />
      <Route path="/work-assignment" element={<Navigate to="/work/status-board" replace />} />
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

      {user ? (
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-[#f8fafc]">
            <AppSidebar />
            <div className="flex flex-1 flex-col min-w-0">
              <TopNavbar />
              <main className="flex-1 overflow-y-auto flex flex-col">
                <MainArea />
              </main>
            </div>
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
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </Provider>
  )
}

export default App

