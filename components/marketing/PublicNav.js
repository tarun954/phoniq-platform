"use client";
import Link from "next/link";

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-blue-600 font-extrabold text-white shadow-lg">
            P
          </div>
          <div className="text-lg font-extrabold tracking-[-0.035em] text-slate-950">
            PHONIQ
          </div>
        </Link>

        <nav className="mx-auto hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
          <a href="#services" className="hover:text-blue-600">Services</a>
          <a href="#pricing" className="hover:text-blue-600">Plans</a>
          <a href="#about" className="hover:text-blue-600">About</a>
          <a href="#how-it-works" className="hover:text-blue-600">How it works</a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-md hover:bg-blue-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
