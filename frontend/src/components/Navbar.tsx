"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-base-300/80 bg-base-100/80 backdrop-blur-md transition-all">
      <nav className="navbar mx-auto max-w-6xl px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <div className="flex-1">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition hover:opacity-90 active:scale-95"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-base-content">
              DevDocAI
            </span>
            <span className="badge badge-outline badge-sm hidden font-mono text-[10px] text-base-content/60 sm:inline-flex">
              beta
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-5">
            <Link
              href="/#pipeline"
              className="text-xs font-medium text-base-content/70 transition hover:text-base-content"
            >
              Pipeline
            </Link>
            <Link
              href="/#how"
              className="text-xs font-medium text-base-content/70 transition hover:text-base-content"
            >
              How it works
            </Link>
            <Link href="/blogs" className="btn btn-primary btn-xs rounded-xl px-3.5 shadow-sm">
              Blogs
            </Link>
            <Link href="/theme" className="btn btn-outline btn-xs rounded-xl px-3.5">
              Theme
            </Link>
          </div>

          <div className="divider divider-horizontal m-0 h-4" />

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn btn-ghost btn-xs rounded-lg px-3 text-xs font-medium text-base-content/70 hover:text-base-content"
            >
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary btn-xs rounded-xl px-3.5 shadow-sm">
              Get started
            </Link>
          </div>
        </div>

        {/* Mobile Animated Hamburger Button */}
        <button
          className="btn btn-square btn-sm border-base-300 bg-base-200 text-base-content hover:border-base-content/30 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <div className="relative h-3.5 w-4">
            <span
              className={`absolute left-0 block h-0.5 w-4 bg-base-content transition-all duration-200 ${
                open ? "top-1.5 rotate-45" : "top-0.5"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-4 bg-base-content transition-all duration-200 ${
                open ? "top-1.5 -rotate-45" : "top-2.5"
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 border-t border-base-300/80 bg-base-100/95 px-5 py-4 backdrop-blur-xl duration-150 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/#pipeline"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
            >
              Pipeline
            </Link>
            <Link
              href="/#how"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
            >
              How it works
            </Link>
            <Link
              href="/blogs"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
            >
              Blogs
            </Link>
            <Link
              href="/theme"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
            >
              Theme
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
            >
              Log in
            </Link>

            <div className="pt-2">
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="btn btn-primary flex w-full items-center justify-center rounded-xl py-2 text-xs font-semibold"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}