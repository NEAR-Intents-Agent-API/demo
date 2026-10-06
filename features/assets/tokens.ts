import { TOKEN_LOGOS_BY_ASSET } from "./token-logos";

/**
 * Token artwork resolution.
 *
 * Exact asset ids win, because a wrapped or bridged token deserves its own art. When an id is
 * unknown (the token list changes weekly) the symbol is the next best key, so `USDC` looks like
 * USDC on every chain. If neither matches, the caller draws a monogram.
 *
 * The remote hosts are public image CDNs (CoinMarketCap, CoinGecko, Morpho, Ondo). They are
 * loaded straight from the browser with no referrer, so the demo never forwards a page URL and
 * a slow CDN can only ever cost us a monogram.
 */

const cmc = (id: number) => `https://s2.coinmarketcap.com/static/img/coins/128x128/${id}.png`;

const LOGOS_BY_SYMBOL: Readonly<Record<string, string>> = {
  BTC: cmc(1),
  WBTC: cmc(3717),
  ETH: cmc(1027),
  WETH: cmc(1027),
  USDC: cmc(3408),
  USDT: cmc(825),
  DAI: cmc(4943),
  NEAR: cmc(6535),
  WNEAR: cmc(6535),
  SOL: cmc(5426),
  ZEC: cmc(1437),
  SUI: cmc(20947),
  DOGE: cmc(74),
  XRP: cmc(52),
  LTC: cmc(2),
  BCH: cmc(1831),
  DASH: cmc(131),
  TRX: cmc(1958),
  TON: cmc(11419),
  BNB: cmc(1839),
  AVAX: cmc(5805),
  POL: cmc(3890),
  MATIC: cmc(3890),
  ARB: cmc(11841),
  OP: cmc(11840),
  APT: cmc(21794),
  ADA: cmc(2010),
  XLM: cmc(512),
  LINK: cmc(1975),
  AAVE: cmc(7278),
  UNI: cmc(7083),
  PEPE: cmc(24478),
  AURORA: cmc(14803),
  HYPE: cmc(32196),
  BERA: cmc(24647),
};

export function tokenLogoUrl(assetId: string | null | undefined, symbol?: string | null) {
  if (assetId) {
    const exact = TOKEN_LOGOS_BY_ASSET[assetId];
    if (exact) return exact;
  }
  if (symbol) {
    const key = symbol.trim().toUpperCase();
    return LOGOS_BY_SYMBOL[key] ?? LOGOS_BY_SYMBOL[key.replace(/^W/, "")] ?? null;
  }
  return null;
}
