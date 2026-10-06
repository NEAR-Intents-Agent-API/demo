/** A token as the screens use it: identity, precision and the chain it is drawn on. */
export type TokenOption = {
  assetId: string;
  defuseAssetId: string | null;
  symbol: string;
  decimals: number;
  /** Chain the asset originates on, shown in the icon badge. */
  chain: string;
  chains: string[];
};
