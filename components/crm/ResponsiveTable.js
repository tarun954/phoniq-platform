"use client";

export default function ResponsiveTable({
  children,
  minWidth = 820,
  className = "",
}) {
  return (
    <div
      className={`w-full max-w-full overflow-x-auto overscroll-x-contain ${className}`}
    >
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}
