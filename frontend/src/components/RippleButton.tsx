/**
 * MagicUI RippleButton — primary button with expanding ripple on click.
 * Animation 6: click ripple expand+fade
 */
import { type ButtonHTMLAttributes, type ReactNode, useRef, useState } from "react";
import { cn } from "../lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  rippleColor?: string;
}

export function RippleButton({
  children,
  className,
  rippleColor = "rgba(255,255,255,0.3)",
  onClick,
  ...props
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = btnRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick?.(e);
  };

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={cn(
        "relative inline-flex cursor-pointer select-none items-center justify-center gap-2 overflow-hidden",
        "rounded-xl px-4 py-2 text-[13px] font-medium text-white transition-all duration-150",
        "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500",
        "shadow-[0_1px_3px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]",
        "hover:shadow-[0_4px_16px_rgba(99,102,241,0.5)]",
        className,
      )}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute animate-ripple rounded-full"
          style={{
            left: r.x - 10,
            top: r.y - 10,
            width: 20,
            height: 20,
            background: rippleColor,
          }}
        />
      ))}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
