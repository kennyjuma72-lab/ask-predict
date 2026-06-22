import Link from "next/link";
import { navLinks, brand } from "@/lib/content";

const utilityLinks = [
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "Security", href: "/security" },
  { label: "Status", href: "/status" },
];

function SocialIcon({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-gray-700 transition-all hover:border-black/20 hover:text-gray-900 hover:-translate-y-0.5 hover:shadow-sm"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-black/5 bg-[#f5f2ec]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient p-[2px]">
              <div className="bg-white rounded-[14px] w-full h-full flex items-center justify-center">
                <img src="/femvents.png" alt="" className="h-7 w-7 rounded-md" />
              </div>
            </div>
            <p className="text-lg font-bold tracking-tight text-gray-900">{brand.name}</p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{brand.description}</p>
          <div className="mt-6 flex gap-2">
            <SocialIcon label="Instagram" href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </SocialIcon>
            <SocialIcon label="LinkedIn" href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
            </SocialIcon>
            <SocialIcon label="X" href="#">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </SocialIcon>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Explore</p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-gray-700">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gray-900 transition-colors w-fit">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Company</p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-gray-700">
            {utilityLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gray-900 transition-colors w-fit">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Get started</p>
          <Link
            href={brand.primaryCta.href}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-black hover:shadow-md active:scale-[0.98]"
          >
            {brand.primaryCta.label}
          </Link>
          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            Built for organizers and communities of women.
          </p>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-5 text-xs text-gray-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-800">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-800">Terms</Link>
            <Link href="/cookies" className="hover:text-gray-800">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
