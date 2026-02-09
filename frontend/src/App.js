import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [currentApp, setCurrentApp] = useState('lending');
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx("div", { style: {
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
                }, children: _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: () => setCurrentApp('lending'), style: {
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
                            }, onMouseEnter: (e) => {
                                e.currentTarget.style.background = currentApp === 'lending' ? '#1d4ed8' : '#334155';
                                e.currentTarget.style.color = 'white';
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.background = currentApp === 'lending' ? '#2563eb' : '#1e293b';
                                e.currentTarget.style.color = currentApp === 'lending' ? 'white' : '#94a3b8';
                            }, children: "\uD83D\uDCB0 \u501F\u8D37" }), _jsx("button", { onClick: () => setCurrentApp('mining'), style: {
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
                            }, onMouseEnter: (e) => {
                                e.currentTarget.style.background = currentApp === 'mining' ? '#7c3aed' : '#334155';
                                e.currentTarget.style.color = 'white';
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.background = currentApp === 'mining' ? '#9333ea' : '#1e293b';
                                e.currentTarget.style.color = currentApp === 'mining' ? 'white' : '#94a3b8';
                            }, children: "\u26CF\uFE0F \u6316\u77FF" })] }) }), _jsx("div", { children: currentApp === 'lending' ? _jsx(LendingApp, {}) : _jsx(MiningApp, {}) })] }));
}
export default App;
