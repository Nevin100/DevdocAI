"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for dynamic blur & elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-base-content/10 bg-base-100/75 py-2 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-base-100/40 py-3 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition active:scale-95"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/60 text-primary-content shadow-sm shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
            <span className="font-mono text-sm font-bold tracking-tighter">&lt;/&gt;</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-extrabold tracking-tight text-base-content transition-colors group-hover:text-primary">
              DevDocAI
            </span>
            <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
              Beta
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 rounded-full border border-base-content/10 bg-base-200/50 p-1.5 shadow-inner backdrop-blur-md md:flex">
          <Link
            href="/#pipeline"
            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-base-content/70 transition-all hover:bg-base-100 hover:text-base-content"
          >
            Pipeline
          </Link>
          <Link
            href="/#how"
            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-base-content/70 transition-all hover:bg-base-100 hover:text-base-content"
          >
            How it works
          </Link>
          <Link
            href="/blogs"
            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-base-content/70 transition-all hover:bg-base-100 hover:text-base-content"
          >
            Blogs
          </Link>
          <Link
            href="/theme"
            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-base-content/70 transition-all hover:bg-base-100 hover:text-base-content"
          >
            Theme
          </Link>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-3.5 py-2 text-xs font-semibold text-base-content/80 transition-colors hover:text-base-content"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-content shadow-md shadow-primary/20 transition-all duration-300 hover:brightness-110 active:scale-95"
          >
            Get started
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-base-content/10 bg-base-200/60 text-base-content backdrop-blur-md transition-colors hover:bg-base-200 active:scale-90 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <div className="relative h-4 w-4">
            <span
              className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-in-out ${
                open ? "top-1.5 rotate-45" : "top-0.5"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-in-out ${
                open ? "opacity-0" : "top-1.5 opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-in-out ${
                open ? "top-1.5 -rotate-45" : "top-2.5"
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Drawer Dropdown */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-base-content/10 bg-base-100/95 px-6 py-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-2">
            <Link
              href="/#pipeline"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-base-content/70 transition-colors hover:bg-base-200/60 hover:text-base-content"
            >
              Pipeline
            </Link>
            <Link
              href="/#how"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-base-content/70 transition-colors hover:bg-base-200/60 hover:text-base-content"
            >
              How it works
            </Link>
            <Link
              href="/blogs"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-base-content/70 transition-colors hover:bg-base-200/60 hover:text-base-content"
            >
              Blogs
            </Link>
            <Link
              href="/theme"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-base-content/70 transition-colors hover:bg-base-200/60 hover:text-base-content"
            >
              Theme
            </Link>

            <div className="my-2 border-t border-base-content/10 pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl border border-base-content/10 bg-base-200/50 py-2.5 text-xs font-semibold text-base-content transition hover:bg-base-200"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-content shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}