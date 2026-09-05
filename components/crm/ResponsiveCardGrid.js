"use client";

export default function ResponsiveCardGrid({
  children,
  className = "",
}) {
  return (
    <div
      className={`grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 ${className}`}
    >
      {children}
    </div>
  );
}
