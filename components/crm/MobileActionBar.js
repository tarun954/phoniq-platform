"use client";

export default function MobileActionBar({ children }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      {children}
    </div>
  );
}
