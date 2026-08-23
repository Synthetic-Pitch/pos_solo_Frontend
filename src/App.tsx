import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './page/LandingPage'
import ReconciliationPage from './page/ReconciliationPage'
import Order from './page/Order';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/reconciliation" element={<ReconciliationPage />} />
        <Route path="/order" element={<Order />} />
        <Route path="/roder" element={<Navigate to="/order" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
