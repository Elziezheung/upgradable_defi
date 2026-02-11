/** Shared helpers for lending UI. Backend returns human-readable numbers (price, supplyUnderlying, etc.). */

export function formatPct(value: number | undefined | null): string {
  const n = value != null ? Number(value) : 0;
  if (!Number.isFinite(n)) return '0.00';
  return (n < 1 ? n * 100 : n).toFixed(2);
}

export function getPrice(p: { price?: number; priceUsd?: number }): number {
  return p.price ?? p.priceUsd ?? 0;
}

/**
 * Supply (or borrow) value in USD for a market. Prefers backend totalSupplyUsd (plain USD);
 * falls back to totalSupply (human token amount) * price only when totalSupplyUsd is missing.
 * Handles both camelCase and snake_case from API.
 */
export function getMarketSupplyUsd(m: {
  totalSupplyUsd?: number;
  total_supply_usd?: number;
  totalSupply?: number;
  totalSupplyUnderlying?: number;
  price?: number;
  priceUsd?: number;
}): number {
  const usd =
    (m as { totalSupplyUsd?: number }).totalSupplyUsd ??
    (m as { total_supply_usd?: number }).total_supply_usd;
  if (usd != null && Number.isFinite(usd)) return usd;
  const supply = (m.totalSupply ?? (m as { totalSupplyUnderlying?: number }).totalSupplyUnderlying) ?? 0;
  const price = getPrice(m);
  return supply * price;
}

/**
 * Format TVL in millions (M). Value is expected in plain USD (e.g. 200000000 for $200M).
 */
export function formatTvl(usd: number): string {
  if (!Number.isFinite(usd) || usd < 0) return '$0.00M';
  return `$${(usd / 1e6).toFixed(2)}M`;
}

export function formatUsd(n: number): string {
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function shortAddress(addr: string): string {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—';
}

/** Read position balance (supply or borrow); handles both camelCase and snake_case from API. */
export function getPositionBalance(
  p: Record<string, unknown>,
  key: 'supplyUnderlying' | 'borrowBalance'
): number {
  const camel = p[key];
  const snake = p[key === 'supplyUnderlying' ? 'supply_underlying' : 'borrow_balance'];
  const n = camel ?? snake;
  if (n != null && Number.isFinite(Number(n))) return Number(n);
  return 0;
}
