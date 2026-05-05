import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children: ReactNode;
  className?: string;
}

/**
 * MagicUI ShimmerButton — button with animated shimmer sweep effect.
 */
export function ShimmerButton({
  shimmerColor = "rgba(255,255,255,0.4)",
  shimmerSize = "0.08em",
  shimmerDuration = "2s",
  borderRadius = "10px",
  background = "linear-gradient(135deg, #6366f1, #7c3aed)",
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--speed": shimmerDuration,
          "--cut": "0.1em",
          "--bg": background,
          borderRadius,
        } as React.CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap",
        "border border-white/10 px-4 py-2 text-white",
        "text-[13px] font-medium",
        // shimmer
        "[background:var(--bg)]",
        "transition-all duration-300",
        "hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]",
        "active:scale-[0.96]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {/* shimmer sweep */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{ maskImage: "linear-gradient(rgb(0,0,0), rgb(0,0,0))" }}
      >
        <div
          className="animate-shimmer-slide absolute inset-[-100%] rotate-[-45deg]"
          style={{
            background: `linear-gradient(90deg, transparent 40%, var(--shimmer-color) 50%, transparent 60%)`,
          }}
        />
      </div>
      {/* shadow */}
      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
