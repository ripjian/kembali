import Link from "next/link";
import { LogoMark } from "@kembali/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-[1432px] gap-10 px-6 py-16 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <LogoMark size={32} />
          <p className="font-mono text-sm text-text-secondary">
            The stamp card that lives on your customers&apos; phones.
            <br />
            Make them <span className="text-accent-deep">kembali</span>.
          </p>
        </div>

        <nav className="flex flex-col gap-3 font-mono text-sm uppercase tracking-tight">
          <p className="text-text-muted">Explore</p>
          <Link href="/#how-it-works" className="text-text hover:text-primary">
            How it works →
          </Link>
          <Link href="/#features" className="text-text hover:text-primary">
            Features →
          </Link>
          <Link href="/roadmap" className="text-text hover:text-primary">
            Roadmap →
          </Link>
        </nav>

        <div className="flex flex-col gap-3 font-mono text-sm uppercase tracking-tight">
          <p className="text-text-muted">Reach out</p>
          <Link href="/#reach-out" className="text-text hover:text-primary">
            Tell us about your business →
          </Link>
          <a
            href="mailto:hello@kembali.app"
            className="text-text hover:text-primary"
          >
            hello@kembali.app →
          </a>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1432px] flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-6">
        <p className="font-mono text-xs uppercase tracking-tight text-text-muted">
          © 2026 Kembali — Malaysia &amp; SEA
        </p>
        <p className="font-mono text-xs uppercase tracking-tight text-text-muted">
          PDPA-first: opt-in marketing, export &amp; delete on request
        </p>
      </div>
    </footer>
  );
}
