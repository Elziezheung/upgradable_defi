import { NavLink } from 'react-router-dom';
import { shortAddress } from '../utils';

type Props = {
  account: string | null;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

const TABS: { path: string; label: string }[] = [
  { path: '/lending/markets', label: 'Markets' },
  { path: '/lending/positions', label: 'Positions' },
];

export function Header({ account, isConnected, onConnect, onDisconnect }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-700/80 bg-zinc-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/lending/markets" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 font-semibold">
            ◈
          </div>
          <span className="text-lg font-semibold text-white">Lending</span>
        </NavLink>

        <nav className="flex gap-0.5">
          {TABS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div>
          {isConnected && account ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-xs text-zinc-500">Connected</span>
                <span className="font-mono text-sm text-zinc-200">{shortAddress(account)}</span>
              </span>
              <button
                type="button"
                onClick={onDisconnect}
                className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
