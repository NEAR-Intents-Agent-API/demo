"use client";
import { EvmWalletPicker } from "./evm-wallet-picker";
import { passkeyProviders, walletProviders } from "./login-options";
import { ProviderRow } from "./provider-row";
import { useLogin } from "./use-login";

export function LoginPanel({ resuming, returnTo }: { resuming: boolean; returnTo: string }) {
  const {
    busy,
    error,
    walletPickerOpen,
    setWalletPickerOpen,
    busyConnectorId,
    selectProvider,
    selectEvmConnector,
  } = useLogin(returnTo);
  return (
    <div className="order-2 flex min-w-0 flex-col gap-6 rounded-[16px] border bg-background p-6 xl:px-9 xl:pt-9 xl:pb-7">
      <header>
        <h2 className="text-[28px] leading-10 font-bold xl:text-[32px]">
          {resuming ? "Finish authorizing your client" : "Owner Sign In"}
        </h2>
        <p className="mt-2 text-base leading-[27px] text-muted-foreground xl:text-[17px]">
          {resuming
            ? "An MCP client sent you here mid-authorization. Sign in with the same identity that owns the agent account, and it will continue where it left off."
            : "Choose a wallet or passkey to own your agent accounts. Each account has one owner. A different identity signs in as a different owner."}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-[18px] tracking-[0.7px] text-muted-foreground uppercase">
            Wallet
          </p>
          {walletProviders.map((card) => (
            <ProviderRow
              key={card.id}
              card={card}
              busy={busy === card.id}
              disabled={busy !== null}
              onClick={() => selectProvider(card.id)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-[18px] tracking-[0.7px] text-muted-foreground uppercase">
            Passkey
          </p>
          {passkeyProviders.map((card) => (
            <ProviderRow
              key={card.id}
              card={card}
              busy={busy === card.id}
              disabled={busy !== null}
              onClick={() => selectProvider(card.id)}
            />
          ))}
        </div>

        <p className="text-[15px] leading-[22px] text-muted-foreground">
          The dashboard stores only your passkey’s public key.
        </p>

        {error ? (
          <p
            className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
      <EvmWalletPicker
        open={walletPickerOpen}
        onOpenChange={setWalletPickerOpen}
        onSelect={selectEvmConnector}
        busyConnectorId={busyConnectorId}
      />
    </div>
  );
}
