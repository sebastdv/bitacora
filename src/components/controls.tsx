import { useState } from "react";

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: NoInfer<T>; label: string }[];
  onChange(value: NoInfer<T>): void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-panel p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded px-3 py-1 text-sm ${o.value === value ? "bg-accent font-medium text-on-accent" : "text-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-accent" />
      {label}
    </label>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  label,
  primary,
}: {
  children: React.ReactNode;
  onClick(): void;
  disabled?: boolean;
  label?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-md border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
        primary ? "border-accent bg-accent text-on-accent hover:opacity-90" : "border-line bg-panel hover:border-accent"
      }`}
    >
      {children}
    </button>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      primary
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      <span aria-live="polite">{copied ? "Copiado" : label}</span>
    </Button>
  );
}
