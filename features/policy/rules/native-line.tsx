import type { NativePolicy } from "@/lib/agent-api/schemas";
import { describeNative, NATIVE_WARNING } from "./native";

/** What the native block switches on, with the warning whenever anything is on. */
export function NativeLine({ native }: { native: NativePolicy }) {
  const on = describeNative(native);
  if (!on.length) return <span>Off</span>;
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="break-words">{on.join("; ")}</span>
      <span className="text-xs leading-5 font-normal text-warning">{NATIVE_WARNING}</span>
    </span>
  );
}
