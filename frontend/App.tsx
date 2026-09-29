import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import Copilot from './pages/Copilot'
import QueryHistory from './pages/QueryHistory'
import Analytics from './pages/Analytics'
import DataExplorer from './pages/DataExplorer'
import DashboardBuilder from './pages/DashboardBuilder'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/history" element={<QueryHistory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/explorer" element={<DataExplorer />} />
        <Route path="/builder" element={<DashboardBuilder />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppLayout>
  )
}
