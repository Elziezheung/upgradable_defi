import { useState } from 'react';
import MiningApp from './mining/App';
import LendingApp from './lending/App';

/**
 * Main App Component
 * Container for different application pages
 *
 * Available pages:
 * - Lending: DeFi lending and borrowing interface
 * - Mining: Liquidity mining and rewards interface
 */
function App() {
  const [currentApp, setCurrentApp] = useState<'lending' | 'mining'>('lending');

  return (
    <div className="min-h-screen">
      {/* App Switcher - Top right, below header to avoid overlap with Connect button */}
      <div style={{
        position: 'fixed',
        top: '90px',
        right: '20px',
        zIndex: 10000,
        background: '#0f172a',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        border: '2px solid #334155',
        padding: '8px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCurrentApp('lending')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              background: currentApp === 'lending' ? '#2563eb' : '#1e293b',
              color: currentApp === 'lending' ? 'white' : '#94a3b8',
              transform: currentApp === 'lending' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: currentApp === 'lending' ? '0 10px 15px -3px rgba(37, 99, 235, 0.4)' : 'none',
              border: currentApp === 'lending' ? '2px solid #3b82f6' : '2px solid #334155'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentApp === 'lending' ? '#1d4ed8' : '#334155';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentApp === 'lending' ? '#2563eb' : '#1e293b';
              e.currentTarget.style.color = currentApp === 'lending' ? 'white' : '#94a3b8';
            }}
          >
            💰 借贷
          </button>
          <button
            onClick={() => setCurrentApp('mining')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              background: currentApp === 'mining' ? '#9333ea' : '#1e293b',
              color: currentApp === 'mining' ? 'white' : '#94a3b8',
              transform: currentApp === 'mining' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: currentApp === 'mining' ? '0 10px 15px -3px rgba(147, 51, 234, 0.4)' : 'none',
              border: currentApp === 'mining' ? '2px solid #a855f7' : '2px solid #334155'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentApp === 'mining' ? '#7c3aed' : '#334155';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentApp === 'mining' ? '#9333ea' : '#1e293b';
              e.currentTarget.style.color = currentApp === 'mining' ? 'white' : '#94a3b8';
            }}
          >
            ⛏️ 挖矿
          </button>
        </div>
      </div>

      {/* Render current app without padding */}
      <div>
        {currentApp === 'lending' ? <LendingApp /> : <MiningApp />}
      </div>
    </div>
  );
}

export default App;
