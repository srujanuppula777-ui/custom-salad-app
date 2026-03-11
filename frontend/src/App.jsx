import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/CustomerList'
import CreateCustomer from './pages/CreateCustomer'
import CustomerDetail from './pages/CustomerDetail'
import Subscribe from './pages/Subscribe'

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Desktop sidebar */}
        <div className="hide-mobile">
          <Sidebar />
        </div>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem', paddingBottom: '5rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/new" element={<CreateCustomer />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/customers/:id/subscribe/:service" element={<Subscribe />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <div className="hide-desktop">
          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
