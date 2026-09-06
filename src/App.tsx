import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './page/LandingPage'
import ReconciliationPage from './page/ReconciliationPage'
import Order from './page/Order';
import Overview from './page/Overview';
import VerifySummarize from './page/VerifySummarize';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/reconciliation" element={<ReconciliationPage />} />
        <Route path="/order" element={<Order />} />
        <Route path="/roder" element={<Navigate to="/order" replace />} />
        <Route path="/overall" element={<Overview/>}/>
        <Route path="/verify-summarize" element={<VerifySummarize/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
