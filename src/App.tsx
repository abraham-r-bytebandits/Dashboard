// src/App.tsx
import './App.css';
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/Sidebar/AppSidebar"
import SalesDashboard from './screens/SalesDashboard';

function App() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <AppSidebar />

        <main className="flex-1">
          <SalesDashboard />
        </main>
      </div>
    </SidebarProvider>
  )
}

export default App

