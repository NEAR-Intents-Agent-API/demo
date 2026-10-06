import type { AuthAction } from "./types";

export type ProviderCard = {
  id: AuthAction;
  label: string;
  detail: string;
  asset: string;
  iconWidth: number;
  iconHeight: number;
  iconPosition: string;
};

export const walletProviders: ProviderCard[] = [
  {
    id: "near",
    label: "NEAR",
    detail: "Connect a NEAR wallet",
    asset: "login-reference/login-auth-near",
    iconWidth: 23.3333,
    iconHeight: 23.3333,
    iconPosition: "top-[2.8667px] left-[2.3333px]",
  },
  {
    id: "evm",
    label: "EVM wallet",
    detail: "MetaMask, Coinbase, Safe, and more",
    asset: "login-reference/login-auth-evm",
    iconWidth: 20.7667,
    iconHeight: 25.4333,
    iconPosition: "top-[1.2833px] left-[3.6167px]",
  },
];

export const passkeyProviders: ProviderCard[] = [
  {
    id: "passkey",
    label: "Sign in with a passkey",
    detail: "Use a saved passkey",
    asset: "login-reference/login-auth-passkey",
    iconWidth: 18.4333,
    iconHeight: 21.9333,
    iconPosition: "top-[4.7833px] left-[4.7833px]",
  },
  {
    id: "passkey-register",
    label: "Register a passkey",
    detail: "Create an account without a wallet",
    asset: "login-reference/login-auth-register",
    iconWidth: 18.4333,
    iconHeight: 18.4333,
    iconPosition: "top-[4.7833px] left-[4.7833px]",
  },
];
