export function DepositStep({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs leading-5 font-medium">
        {index} · {label}
      </span>
      {children}
    </div>
  );
}
