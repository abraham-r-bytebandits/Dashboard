import './App.css';
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/Sidebar/AppSidebar"
import FinancialDashboard from './screens/FinancialDashboard';
import AddExpense from './screens/AddExpense';
import AuthModal from './components/login/AuthModal';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';

function MainArea() {
  return (
    <Routes>
      <Route path="/" element={<FinancialDashboard />} />
      <Route path="/add-fixed-cost" element={<AddExpense type="fixed" />} />
      <Route path="/add-operational-cost" element={<AddExpense type="operational" />} />
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

