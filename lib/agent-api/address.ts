import { sha256 } from "@noble/hashes/sha2.js";
import { base32nopad, base58, base58xrp, base64, bech32, bech32m } from "@scure/base";

/**
 * Format checks for addresses an owner types into a rule. They catch typos and wrong-network
 * pastes before anything is signed; the API stays the final judge. Networks without a checker
 * here pass untouched.
 */

type Decode = (text: string) => Uint8Array;

const attempt = <T>(read: () => T): T | null => {
  try {
    return read();
  } catch {
    return null;
  }
};

/** Payload (version bytes included) of a base58check string, or null when the checksum is wrong. */
function base58checkPayload(text: string, decode: Decode): Uint8Array | null {
  const bytes = attempt(() => decode(text));
  if (!bytes || bytes.length < 5) return null;
  const payload = bytes.subarray(0, -4);
  const checksum = sha256(sha256(payload)).subarray(0, 4);
  return checksum.every((byte, index) => byte === bytes[bytes.length - 4 + index]) ? payload : null;
}

/** CRC-16/XMODEM, the checksum of Stellar and TON addresses. */
function crc16(bytes: Uint8Array): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

const evmAddress = (text: string) => /^0x[0-9a-f]{40}$/.test(text);

const solanaAddress = (text: string) =>
  text.length >= 32 && text.length <= 44 && attempt(() => base58.decode(text))?.length === 32;

function bitcoinSegwit(text: string): boolean {
  if (text !== text.toLowerCase() && text !== text.toUpperCase()) return false;
  const v0 = attempt(() => bech32.decode(text as `${string}1${string}`));
  const decoded = v0 ?? attempt(() => bech32m.decode(text as `${string}1${string}`));
  if (!decoded) return false;
  if (decoded.prefix.toLowerCase() !== "bc" || decoded.words.length < 1) return false;
  const version = decoded.words[0] as number;
  const program = attempt(() => bech32.fromWords(decoded.words.slice(1)));
  if (!program || version > 16) return false;
  // Version 0 is bech32 with a 20 or 32 byte program; later versions are bech32m (BIP 350).
  if (version === 0) return v0 !== null && (program.length === 20 || program.length === 32);
  return v0 === null && program.length >= 2 && program.length <= 40;
}

function bitcoinAddress(text: string): boolean {
  if (/^bc1/i.test(text)) return bitcoinSegwit(text);
  if (!/^[13]/.test(text)) return false;
  const payload = base58checkPayload(text, base58.decode);
  return payload?.length === 21 && (payload[0] === 0x00 || payload[0] === 0x05);
}

/** A classic `r…` account, or a mainnet `X…` address (account and destination tag in one string). */
const xrpAddress = (text: string) => {
  const payload = base58checkPayload(text, base58xrp.decode);
  if (/^r/.test(text)) return payload?.length === 21 && payload[0] === 0x00;
  return /^X/.test(text) && payload?.length === 31 && payload[0] === 0x05 && payload[1] === 0x44;
};

/** A base58 `T…` address, or the same account in hex (`41` and 20 bytes). */
const tronAddress = (text: string) => {
  if (/^41[0-9a-fA-F]{40}$/.test(text)) return true;
  const payload = base58checkPayload(text, base58.decode);
  return /^T/.test(text) && payload?.length === 21 && payload[0] === 0x41;
};

/**
 * Stellar `G…` public key (version byte 0x30, 32 key bytes) or `M…` muxed account (0x60, 32 key
 * bytes and an 8 byte id), followed by a little-endian CRC, all base32.
 */
function stellarAddress(text: string): boolean {
  const muxed = /^M[A-Z2-7]{68}$/.test(text);
  if (!muxed && !/^G[A-Z2-7]{55}$/.test(text)) return false;
  const bytes = attempt(() => base32nopad.decode(text));
  const length = muxed ? 43 : 35;
  if (bytes?.length !== length || bytes[0] !== (muxed ? 0x60 : 0x30)) return false;
  return (
    crc16(bytes.subarray(0, length - 2)) ===
    (bytes[length - 2] as number) + ((bytes[length - 1] as number) << 8)
  );
}

/** TON in raw `workchain:hex` form, or the 48 character user-friendly form with a CRC. */
function tonAddress(text: string): boolean {
  if (/^-?\d+:[0-9a-fA-F]{64}$/.test(text)) {
    const workchain = Number(text.split(":")[0]);
    return workchain === 0 || workchain === -1;
  }
  if (!/^[A-Za-z0-9_+/-]{48}$/.test(text)) return false;
  const bytes = attempt(() => base64.decode(text.replace(/-/g, "+").replace(/_/g, "/")));
  if (bytes?.length !== 36) return false;
  const flag = (bytes[0] as number) & 0x7f;
  if (flag !== 0x11 && flag !== 0x51) return false;
  if (bytes[1] !== 0x00 && bytes[1] !== 0xff) return false;
  return crc16(bytes.subarray(0, 34)) === ((bytes[34] as number) << 8) + (bytes[35] as number);
}

/**
 * A NEAR account id: a 64 hex implicit account, a `0x` EVM implicit account, or a named account
 * of 2 to 64 characters made of lowercase parts joined by `.`, with `-` or `_` between
 * alphanumerics (so `alice.near` and `bob.tg` pass; `Alice.near` and `.near` do not).
 */
export function isNearAccountId(text: string): boolean {
  if (/^[0-9a-f]{64}$/.test(text) || evmAddress(text)) return true;
  return (
    text.length >= 2 &&
    text.length <= 64 &&
    /^(?:[a-z\d]+[-_])*[a-z\d]+(?:\.(?:[a-z\d]+[-_])*[a-z\d]+)*$/.test(text)
  );
}

const checkers: Record<string, { label: string; valid: (text: string) => boolean }> = {
  sol: { label: "Solana", valid: solanaAddress },
  fogo: { label: "Fogo", valid: solanaAddress },
  btc: { label: "Bitcoin", valid: bitcoinAddress },
  xrp: { label: "XRP", valid: xrpAddress },
  stellar: { label: "Stellar", valid: stellarAddress },
  ton: { label: "TON", valid: tonAddress },
  tron: { label: "Tron", valid: tronAddress },
  near: { label: "NEAR", valid: isNearAccountId },
};

/** Chains whose accounts are `0x` EVM addresses, in canonical ids. */
export const evmChains: ReadonlySet<string> = new Set([
  "eth",
  "base",
  "arb",
  "bsc",
  "pol",
  "op",
  "avax",
  "gnosis",
  "bera",
  "plasma",
  "hood",
  "hypercore",
  "monad",
  "xlayer",
  "scroll",
  "abs",
  "adi",
  "hyperevm",
]);

/**
 * Bech32, bech32m and CashAddr are case-insensitive, so one spelling is canonical. Base58 never
 * is: Byron, transparent Zcash and legacy BCH addresses keep their case.
 */
const caseInsensitivePrefixes: Record<string, RegExp> = {
  btc: /^bc1/i,
  ltc: /^ltc1/i,
  cardano: /^addr1/i,
  zec: /^(zs1|u1)/i,
  aleo: /^aleo1/i,
  bch: /^(bitcoincash:)?[qp]/i,
};
/** Starknet, Sui, Aptos and Movement addresses are 32-byte hex values, written with or without leading zeros. */
const paddedHexChains = new Set(["starknet", "sui", "aptos", "movement"]);

/**
 * The spelling of an address the API compares in `except` and `only` rules: lowercase EVM hex,
 * lowercase bech32 and CashAddr (without `bitcoincash:`), lowercase 0x hex padded to 64 digits on
 * Starknet, Sui, Aptos and Movement. Mirrors the API's `canonicalAddressOn`; never alters base58.
 */
export function canonicalAddressOn(chain: string, address: string): string {
  if (evmChains.has(chain)) return address.toLowerCase();
  if (caseInsensitivePrefixes[chain]?.test(address))
    return address.replace(/^bitcoincash:/i, "").toLowerCase();
  if (paddedHexChains.has(chain) && /^0x[0-9a-f]{1,64}$/i.test(address))
    return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
  return address;
}

/** Why `address` cannot be a withdrawal target on `chain` (canonical id), or null when it can. */
export function withdrawalAddressProblem(chain: string, address: string): string | null {
  if (evmChains.has(chain)) {
    return evmAddress(address)
      ? null
      : "Not a valid EVM address: use 0x followed by 40 hex characters";
  }
  const checker = checkers[chain];
  return !checker || checker.valid(address) ? null : `Not a valid ${checker.label} address`;
}

const NEARCOM_PREFIX = "nearcom:";

/** near.com shows an Intents account as `nearcom:<account>`; Intents itself takes the bare account. */
export function isNearcomAddress(text: string): boolean {
  return text.toLowerCase().startsWith(NEARCOM_PREFIX);
}

/** The NEAR Intents account a transfer recipient names, with any near.com prefix stripped. */
export function intentsAccount(text: string): string {
  return isNearcomAddress(text) ? text.slice(NEARCOM_PREFIX.length).toLowerCase() : text;
}

/** Why `address` cannot be a NEAR Intents account to transfer to, or null when it can. */
export function transferRecipientProblem(address: string): string | null {
  return isNearAccountId(address) ? null : "Not a valid NEAR account";
}
