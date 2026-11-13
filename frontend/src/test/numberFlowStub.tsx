// Test double for @number-flow/react: jsdom cannot tween its digits (el.willUpdate is missing), so
// tests mock the package with this module and assert on the static text it would show.
interface NumberFlowStubProps {
  value: number;
  locales?: string;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  className?: string;
  "aria-label"?: string;
}

export default function NumberFlowStub({
  value,
  locales,
  format,
  prefix = "",
  suffix = "",
  className,
  "aria-label": ariaLabel,
}: NumberFlowStubProps) {
  const text = `${prefix}${new Intl.NumberFormat(locales, format).format(value)}${suffix}`;
  return (
    <span
      data-testid="number-flow"
      aria-label={ariaLabel}
      className={className}
    >
      {text}
    </span>
  );
}
