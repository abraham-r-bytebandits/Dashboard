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
import RoleManagement from './screens/admin/RoleManagement'
import UserAccess from './screens/admin/UserAccess'
import SiteManagement from './screens/admin/SiteManagement'
import ClientsList from './screens/clients/ClientsList'
import InvoicesList from './screens/invoices/InvoicesList'
import ImageConverter from './screens/ImageConverter'
import ContactMessagesList from './screens/admin/ContactMessagesList'
import StatusBoard from './screens/work/StatusBoard'
import ImpactBoard from './screens/work/ImpactBoard'
import CreateAssessment from './screens/work/CreateAssessment'
import WorkDetails from './screens/work/WorkDetails'
import Settings from './screens/settings/Settings'

import { TopNavbar } from './components/Navbar/TopNavbar'

function MainArea() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute pageKey="dashboard"><FinancialDashboard /></ProtectedRoute>} />
      <Route path="/add-fixed-cost" element={<ProtectedRoute pageKey="fixed-costs"><AddExpense type="fixed" /></ProtectedRoute>} />
      <Route path="/add-operational-cost" element={<ProtectedRoute pageKey="operational-costs"><AddExpense type="operational" /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute pageKey="user-management"><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute pageKey="user-management"><RoleManagement /></ProtectedRoute>} />
      <Route path="/admin/permissions" element={<ProtectedRoute pageKey="user-management"><UserAccess /></ProtectedRoute>} />
      <Route path="/admin/permissions/:publicId" element={<ProtectedRoute pageKey="user-management"><UserAccess /></ProtectedRoute>} />
      <Route path="/admin/sites" element={<ProtectedRoute pageKey="site-management"><SiteManagement /></ProtectedRoute>} />
      <Route path="/admin/contacts" element={<ProtectedRoute pageKey="contact-messages"><ContactMessagesList /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute pageKey="clients"><ClientsList /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute pageKey="invoices"><InvoicesList /></ProtectedRoute>} />
      <Route path="/image-converter" element={<ProtectedRoute pageKey="image-converter"><ImageConverter /></ProtectedRoute>} />
      <Route path="/work/status-board" element={<ProtectedRoute pageKey="status-board"><StatusBoard /></ProtectedRoute>} />
      <Route path="/work/impact-board" element={<ProtectedRoute pageKey="impact-board"><ImpactBoard /></ProtectedRoute>} />
      <Route path="/work/create" element={<ProtectedRoute pageKey="create-assessment"><CreateAssessment /></ProtectedRoute>} />
      <Route path="/work/edit/:id" element={<ProtectedRoute pageKey="create-assessment"><CreateAssessment /></ProtectedRoute>} />
      <Route path="/work/details/:id" element={<ProtectedRoute pageKey="status-board"><WorkDetails /></ProtectedRoute>} />
      <Route path="/work/assessment/:id" element={<ProtectedRoute pageKey="status-board"><WorkDetails /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/settings/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/work-assignment" element={<Navigate to="/work/status-board" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { showModal, user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center text-muted-foreground font-medium tracking-wide bg-muted animate-pulse">Loading Dashboard...</div>;
  }

  return (
    <>
      {showModal && <AuthModal />}

      {user ? (
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-muted">
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

