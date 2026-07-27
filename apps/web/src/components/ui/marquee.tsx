"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // pixels per second
  pauseOnHover?: boolean;
  fade?: boolean;
  reverse?: boolean;
  className?: string;
}

export function Marquee({
  children,
  speed = 40,
  pauseOnHover = false,
  fade = false,
  reverse = false,
  className,
}: MarqueeProps) {
  const items = React.Children.toArray(children);
  // Duplicate items to create seamless loop
  const doubled = [...items, ...items];
  // Duration in seconds: base on speed (lower speed = longer duration)
  const duration = `${Math.max(10, Math.round(800 / speed))}s`;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={
        fade
          ? {
              maskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            }
          : undefined
      }
    >
      <div
        className={cn(
          "flex w-max gap-6",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
        style={{
          animation: `marquee-scroll ${duration} linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((child, i) => (
          <div key={i} className="flex items-center gap-6 px-3">
            {child}
            {/* separator dot */}
            <span className="h-1 w-1 rounded-full bg-current opacity-20 shrink-0" />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
