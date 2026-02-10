import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import MiningApp from './mining/App';
import LendingApp from './lending/App';

const appSwitcherBase = {
  position: 'fixed' as const,
  top: '90px',
  right: '20px',
  zIndex: 10000,
  background: '#0f172a',
  borderRadius: '12px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
  border: '2px solid #334155',
  padding: '8px',
  backdropFilter: 'blur(10px)',
};

function AppSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isLending = path.startsWith('/lending');
  const isMining = path.startsWith('/mining');

  const btn = (to: string, active: boolean, label: string, activeColor: string) => (
    <button
      type="button"
      onClick={() => navigate(to)}
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        background: active ? activeColor : '#1e293b',
        color: active ? 'white' : '#94a3b8',
        border: active ? `2px solid ${activeColor}` : '2px solid #334155',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={appSwitcherBase}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {btn('/lending/markets', isLending, '💰 Lending', '#2563eb')}
        {btn('/mining', isMining, '⛏️ Mining', '#9333ea')}
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <AppSwitcher />
      <Routes>
        <Route path="/" element={<Navigate to="/lending/markets" replace />} />
        <Route path="/lending" element={<Navigate to="/lending/markets" replace />} />
        <Route path="/lending/*" element={<LendingApp />} />
        <Route path="/mining" element={<MiningApp />} />
      </Routes>
    </div>
  );
}

export default App;
