import Link from "next/link";
import { LogoMark } from "@kembali/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-alt">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-14 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <LogoMark size={30} />
          <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
            The stamp card that lives on your customers&apos; phones. Loyalty
            your customers will love.
          </p>
        </div>

        <nav className="flex flex-col gap-2.5 text-sm">
          <p className="font-medium text-text-muted">Explore</p>
          <Link href="/#showcase" className="text-text-secondary hover:text-text">
            See the product
          </Link>
          <Link href="/#how-it-works" className="text-text-secondary hover:text-text">
            How it works
          </Link>
          <Link href="/pricing" className="text-text-secondary hover:text-text">
            Pricing
          </Link>
          <Link href="/roadmap" className="text-text-secondary hover:text-text">
            What&apos;s coming next
          </Link>
        </nav>

        <div className="flex flex-col gap-2.5 text-sm">
          <p className="font-medium text-text-muted">Talk to us</p>
          <Link href="/#reach-out" className="text-text-secondary hover:text-text">
            See how Kembali fits your shop
          </Link>
          <a
            href="mailto:hello@kembali.app"
            className="text-text-secondary hover:text-text"
          >
            hello@kembali.app
          </a>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-5">
        <p className="font-mono text-xs text-text-muted">
          © 2026 Kembali — Malaysia &amp; SEA
        </p>
        <p className="font-mono text-xs text-text-muted">
          PDPA: marketing is opt-in · export or delete your data anytime
        </p>
      </div>
    </footer>
  );
}
