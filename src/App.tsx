import './App.css';
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/Sidebar/AppSidebar"
import FinancialDashboard from './screens/FinancialDashboard';

function App() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F1F5F9]">
        <AppSidebar />

        <main className="flex-1">
          <FinancialDashboard />
        </main>
      </div>
    </SidebarProvider>
  )
}

export default App

