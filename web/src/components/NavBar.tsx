"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { navLinks, brand } from "@/lib/content";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-black/5 bg-[#f9f7f4]/85 backdrop-blur-lg shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(0,0,0,0.08)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient p-[2px] shadow-sm transition-transform group-hover:scale-[1.04]">
            <div className="bg-white rounded-[14px] w-full h-full flex items-center justify-center">
              <img
                src="/femvents.png"
                alt=""
                className="h-7 w-7 rounded-md"
              />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 md:text-xl">
            {brand.name}
          </span>
        </Link>

        <nav className="hidden gap-1 text-sm font-medium text-gray-700 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-2 rounded-full transition-colors hover:text-gray-900 hover:bg-black/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 md:inline-flex px-3 py-2"
          >
            Log in
          </Link>
          <Link
            href={brand.primaryCta.href}
            className="hidden md:inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-black hover:shadow-md active:scale-[0.98]"
          >
            {brand.primaryCta.label}
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((p) => !p)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-gray-800 shadow-sm hover:bg-gray-50 md:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="relative h-3 w-4">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-4 rounded-full bg-gray-800 transition-transform ${
                  open ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-gray-800 transition-opacity ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-3 block h-0.5 w-4 rounded-full bg-gray-800 transition-transform ${
                  open ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-black/5 bg-[#f9f7f4]/95 backdrop-blur-lg">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-sm font-medium text-gray-800">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-black/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-black/5 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-center text-sm font-semibold text-gray-800 hover:bg-black/5"
              >
                Log in
              </Link>
              <Link
                href={brand.primaryCta.href}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-black"
              >
                {brand.primaryCta.label}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
