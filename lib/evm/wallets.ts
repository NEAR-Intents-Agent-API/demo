/**
 * The EVM wallets the connect modal offers, in display order.
 *
 * Every row is always shown. A wallet connects when it is present: modern extensions announce
 * themselves with EIP-6963 and are matched by `rdns`; older ones are matched by their
 * `window.ethereum` flag; Coinbase and Safe have their own wagmi connectors. Wallets that are
 * not installed offer their download page instead. No row ever depends on WalletConnect.
 */

export type EvmProviderLike = Record<string, unknown> & {
  providers?: EvmProviderLike[];
};

export type EvmWalletBrand = {
  id: string;
  name: string;
  icon: string;
  installUrl: string;
  installLabel: string;
  /** EIP-6963 identifiers this wallet announces. */
  rdns?: readonly string[];
  /** `useConnectors()` id for wallets with a dedicated connector. */
  connectorId?: string;
  /** Legacy `window.ethereum` detection for wallets that predate EIP-6963. */
  detect?: (ethereum: EvmProviderLike | undefined, window: Window) => boolean;
};

export const EVM_WALLETS: readonly EvmWalletBrand[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "/assets/wallets/metamask.svg",
    installUrl: "https://metamask.io/download/",
    installLabel: "Install MetaMask",
    rdns: ["io.metamask"],
    detect: (ethereum) =>
      Boolean(
        ethereum?.isMetaMask &&
          // Brave pretends to be MetaMask; it announces itself separately.
          !(ethereum.isBraveWallet && !ethereum._events && !ethereum._state),
      ),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "/assets/wallets/coinbase.svg",
    installUrl: "https://www.coinbase.com/wallet/downloads",
    installLabel: "Get Coinbase Wallet",
    rdns: ["com.coinbase.wallet"],
    connectorId: "coinbaseWalletSDK",
    detect: (ethereum, window) =>
      Boolean(
        ethereum?.isCoinbaseWallet ||
          (window as { coinbaseWalletExtension?: unknown }).coinbaseWalletExtension,
      ),
  },
  {
    id: "safe",
    name: "Safe",
    icon: "/assets/wallets/safe.svg",
    installUrl: "https://app.safe.global",
    installLabel: "Open in Safe",
    connectorId: "safe",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: "/assets/wallets/rainbow.svg",
    installUrl: "https://rainbow.me/download",
    installLabel: "Install Rainbow",
    rdns: ["me.rainbow"],
    detect: (ethereum) => Boolean(ethereum?.isRainbow),
  },
  {
    id: "rabby",
    name: "Rabby",
    icon: "/assets/wallets/rabby.svg",
    installUrl: "https://rabby.io",
    installLabel: "Install Rabby",
    rdns: ["io.rabby"],
    detect: (ethereum) => Boolean(ethereum?.isRabby),
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: "/assets/wallets/phantom.svg",
    installUrl: "https://phantom.app/download",
    installLabel: "Install Phantom",
    rdns: ["app.phantom"],
    detect: (ethereum, window) =>
      Boolean(
        (window as { phantom?: { ethereum?: unknown } }).phantom?.ethereum || ethereum?.isPhantom,
      ),
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "/assets/wallets/okx.svg",
    installUrl: "https://www.okx.com/web3",
    installLabel: "Get OKX Wallet",
    rdns: ["com.okex.wallet"],
    detect: (ethereum, window) =>
      Boolean(
        (window as { okxwallet?: unknown }).okxwallet ||
          ethereum?.isOkxWallet ||
          ethereum?.isOKExWallet,
      ),
  },
  {
    id: "brave",
    name: "Brave Wallet",
    icon: "/assets/wallets/brave.svg",
    installUrl: "https://brave.com/wallet/",
    installLabel: "Get Brave Wallet",
    rdns: ["com.brave.wallet"],
    detect: (ethereum) => Boolean(ethereum?.isBraveWallet),
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "/assets/wallets/trust.svg",
    installUrl: "https://trustwallet.com/download",
    installLabel: "Get Trust Wallet",
    rdns: ["com.trustwallet.app"],
    detect: (ethereum) => Boolean(ethereum?.isTrust || ethereum?.isTrustWallet),
  },
  {
    id: "ledger",
    name: "Ledger",
    icon: "/assets/wallets/ledger.svg",
    installUrl: "https://www.ledger.com/ledger-live",
    installLabel: "Get Ledger Live",
    rdns: ["com.ledger.wallet", "com.ledger.live", "com.ledger"],
    detect: (ethereum) => Boolean(ethereum?.isLedger),
  },
] as const;

/** Every provider the page exposes: the nested list when present, otherwise the single one. */
function providersOf(window: Window): EvmProviderLike[] {
  const ethereum = (window as { ethereum?: EvmProviderLike }).ethereum;
  if (!ethereum) return [];
  return ethereum.providers?.length ? ethereum.providers : [ethereum];
}

/** Whether the brand is present in this browser, for choosing Connect versus Install. */
export function isBrandInstalled(brandId: string, window: Window): boolean {
  const brand = EVM_WALLETS.find((candidate) => candidate.id === brandId);
  if (!brand) return false;
  // Safe is a web app, not an extension: it is always offered, and connecting opens its app.
  if (brand.connectorId === "safe") return true;
  return providersOf(window).some((provider) => brand.detect?.(provider, window));
}
