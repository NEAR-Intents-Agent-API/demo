export type LoginProvider = "near" | "evm" | "passkey";

/** Every action the login panel can start, including passkey-first registration. */
export type AuthAction = LoginProvider | "passkey-register";

export type DemoIdentity = {
  name: string;
  email: string;
  ownerType: string | null;
  ownerLabel: string | null;
};
