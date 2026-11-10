"use client";

import { useId, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { chainInfo, useCatalog } from "@/features/assets";
import {
  canonicalDestination,
  intentsContracts,
  type SignIntentRules,
  type SignIntentWithdrawal,
  signIntentDefaultSlippageBps,
  signIntentSchema,
  signIntentSlippageCapBps,
} from "@/lib/agent-api/schemas";
import { withdrawalLabel, without } from "./native";
import { NativeAccountList, NativeEntries } from "./native-list";

/** Why an account cannot become a receiver, in the editor's words; null when it can. */
function receiverProblem(list: readonly string[], account: string): string | null {
  if (intentsContracts.includes(account))
    return "intents.near and intents.far can never be listed.";
  if (list.includes(account)) return "Already listed.";
  return signIntentSchema.shape.receivers.safeParse([account]).success
    ? null
    : "Enter a NEAR Intents account, such as agent.near.";
}

/**
 * The most value a signed deposit may lose, in basis points: from the amount sent to the
 * quote's guaranteed minimum, by 1Click's signed USD amounts. A typed value is kept only while it
 * is valid; leaving the field puts the saved value back.
 */
function SlippageField({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const saved = String(value ?? signIntentDefaultSlippageBps);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const change = (text: string) => {
    setDraft(text);
    const bps = text.trim();
    if (!/^[0-9]{1,3}$/.test(bps) || Number(bps) > signIntentSlippageCapBps) {
      setError(`Enter whole basis points from 0 to ${signIntentSlippageCapBps}.`);
      return;
    }
    setError(null);
    onChange(Number(bps));
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Most value lost (basis points)</Label>
      <p className="text-xs leading-5 text-muted-foreground">
        A deposit may lose at most this much between the amount sent and the least the quote
        guarantees, by 1Click&rsquo;s signed USD amounts, with every fee and the slippage included
        (100 is 1%). Leaving it alone means {signIntentDefaultSlippageBps}; the most you can set is{" "}
        {signIntentSlippageCapBps}. This bounds what a deposit can lose, since no amount limit
        applies.
      </p>
      <Input
        id={id}
        className="max-w-32"
        value={draft ?? saved}
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        onChange={(event) => change(event.target.value)}
        onBlur={() => {
          setDraft(null);
          setError(null);
        }}
      />
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Addresses on other chains a signed 1Click deposit may pay out to, spelled as destinations are. */
function NativeWithdrawals({
  value,
  onChange,
}: {
  value: readonly SignIntentWithdrawal[];
  onChange: (value: SignIntentWithdrawal[]) => void;
}) {
  const id = useId();
  const catalog = useCatalog();
  const [chain, setChain] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const networks = [...new Set([...catalog.chains, ...value.map((entry) => entry.chain)])];
  const add = () => {
    if (!chain) return setError("Choose a network.");
    try {
      const destination = canonicalDestination({
        action: "withdraw",
        chain,
        address: address.trim(),
        memo: null,
      });
      if (destination.action !== "withdraw") return;
      const entry = { chain: destination.chain, address: destination.address };
      if (value.some((listed) => withdrawalLabel(listed) === withdrawalLabel(entry)))
        return setError("Already listed.");
      onChange([...value, entry]);
      setAddress("");
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof z.ZodError && cause.issues[0]
          ? `${cause.issues[0].message}.`
          : "Check the network and address.",
      );
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Fund withdrawals to these addresses</p>
      <p className="text-xs leading-5 text-muted-foreground">
        A signed 1Click deposit may pay out to a listed address on another chain, such as your own
        wallet or a venue like Hyperliquid, and must refund the agent. List only addresses you own.
        This works without the deposit switch above.
      </p>
      <div className="grid gap-2 @md/rules:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
        <NativeSelect
          aria-label="Network"
          id={`${id}-network`}
          value={chain}
          className="w-full"
          disabled={networks.length === 0}
          onChange={(event) => {
            setChain(event.target.value);
            setError(null);
          }}
        >
          <NativeSelectOption value="">
            {catalog.query.isPending ? "Loading networks…" : "Choose a network"}
          </NativeSelectOption>
          {networks.map((network) => (
            <NativeSelectOption key={network} value={network}>
              {chainInfo(network).name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          aria-label="Address"
          value={address}
          placeholder="Address on that network"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          maxLength={256}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setAddress(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!address.trim()}>
          Add
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <NativeEntries
        entries={value.map((entry) => `${chainInfo(entry.chain).name}: ${entry.address}`)}
        empty="No addresses: withdrawals are off."
        onRemove={(index) => onChange(value.filter((_, position) => position !== index))}
      />
    </div>
  );
}

/**
 * One key's `sign_intent` rules: the NEAR Intents transfers it may sign. Off is an omitted block;
 * on, the owner names whom it may pay and which 1Click deposits it may fund. These rules are the
 * key's own, so destinations, tokens, limits and budget do not apply.
 */
export function NativeSignIntent({
  chain,
  value,
  onChange,
}: {
  chain: "EVM" | "Solana";
  value: SignIntentRules | undefined;
  onChange: (value: SignIntentRules | undefined) => void;
}) {
  const set = (next: SignIntentRules) => onChange(next);
  return (
    <div className="space-y-4">
      <Switch
        className="py-0"
        checked={value !== undefined}
        onChange={(on) => onChange(on ? { receivers: [], one_click_deposits: false } : undefined)}
        label="Sign NEAR Intents payloads"
        description={`Transfers from the agent's own ${chain} account in NEAR Intents, to the receivers and deposits listed here. These rules are this key's own: destinations, tokens, limits and budget don't apply, and there is no amount limit. Anyone who holds a signed payload can publish it until it expires, even after a freeze: 5 minutes, or up to 96 hours for a 1Click deposit.`}
      />
      {value ? (
        <div className="flex flex-col gap-4 border-l pl-4">
          <NativeAccountList
            label="Receivers"
            description="NEAR Intents accounts a transfer may pay, whatever its amount. A receiver can also be one of your own accounts, such as the agent's NEAR account."
            placeholder="receiver.near"
            empty="No receivers: no plain transfer is signed."
            value={value.receivers}
            problem={(account) => receiverProblem(value.receivers, account)}
            onChange={(receivers) => set({ ...value, receivers })}
          />
          <Switch
            className="py-0"
            checked={value.one_click_deposits}
            onChange={(one_click_deposits) => set({ ...value, one_click_deposits })}
            label="Fund 1Click deposits"
            description="A transfer may also fund a 1Click deposit address whose signed 1Click quote, sent with the request, pays the agent or a listed receiver inside NEAR Intents and refunds the agent, for exactly the quoted amount."
          />
          <NativeWithdrawals
            value={value.withdrawals ?? []}
            onChange={(withdrawals) =>
              set(withdrawals.length ? { ...value, withdrawals } : without(value, "withdrawals"))
            }
          />
          <SlippageField
            value={value.max_slippage_bps}
            onChange={(max_slippage_bps) => set({ ...value, max_slippage_bps })}
          />
        </div>
      ) : null}
    </div>
  );
}
