import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Kembali protects your shop's data and your customers' privacy: isolated tenants, append-only ledgers, expiring codes.",
};

export default function SecurityPage() {
  return (
    <>
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">Security</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">Nothing</span> <span className="w">quietly</span></span>{" "}
              <span className="line"><span className="w accent-w">changes.</span></span>
            </h1>
            <p className="hero-sub">Loyalty runs on trust. Here is how Kembali protects
            your shop's data and your customers' privacy, in plain words.</p>
          </div>
        </section>

        <section className="roadlist paper" data-theme="light">
          <div className="wrap">
            <div className="rl-group">
              <p className="rl-head mono reveal">In the product today <span className="rl-chip rl-chip-live">enforced</span></p>
              <ol className="rl-rows">
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Every shop is isolated</b><p>Separation between shops is enforced inside the database itself, on every table, and tested on every change.</p></div>
                  <span className="rl-status mono">Enforced</span>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Ledgers cannot be edited</b><p>Stamps and points are append-only records. Balances are computed from history, never typed over.</p></div>
                  <span className="rl-status mono">Enforced</span>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Codes that expire</b><p>Customer QR codes are signed and rotate every 90 seconds. Reward coupons are single use and expire in 15 minutes.</p></div>
                  <span className="rl-status mono">Enforced</span>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Sign-in built for phones</b><p>One-time codes are stored hashed, expire in 5 minutes, and lock after 5 wrong attempts.</p></div>
                  <span className="rl-status mono">Enforced</span>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Stamping has speed limits</b><p>A card accepts one stamp a minute and ten a day, checked on the server, so nobody farms rewards.</p></div>
                  <span className="rl-status mono">Enforced</span>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Privileged actions leave a trail</b><p>Password resets, permission changes, and point adjustments are written to an audit log with who and when.</p></div>
                  <span className="rl-status mono">Enforced</span>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>No card numbers, ever</b><p>Kembali takes no payments inside the product. Subscriptions are invoiced, so card data never touches our systems.</p></div>
                  <span className="rl-status mono">By design</span>
                </li>
              </ol>
            </div>

            <div className="rl-group">
              <p className="rl-head mono reveal">The standards we build against</p>
              <ol className="rl-rows">
                <li className="rl-row" data-state="next">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="10 12" strokeLinecap="round"/></svg></span>
                  <div className="rl-body"><b>OWASP application security standard</b><p>Every change is reviewed against the verification standard at Level 2, the bar for apps that hold personal data.</p></div>
                  <span className="rl-status mono">Every change</span>
                </li>
                <li className="rl-row" data-state="next">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="10 12" strokeLinecap="round"/></svg></span>
                  <div className="rl-body"><b>Malaysia PDPA, 2024 amendments</b><p>Consent, export, deletion, and the 72 hour breach notification clock shape the design from the schema up.</p></div>
                  <span className="rl-status mono">Mandatory</span>
                </li>
                <li className="rl-row" data-state="next">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="10 12" strokeLinecap="round"/></svg></span>
                  <div className="rl-body"><b>ISO 27001 alignment</b><p>Controls are mapped now so certification later is paperwork, not re-engineering. We say aligned, not certified.</p></div>
                  <span className="rl-status mono">Aligning</span>
                </li>
              </ol>
            </div>

            <div className="rl-cta reveal">
              <p>Found something that worries you? Tell us directly and we will reply fast.</p>
              <a className="btn btn-solid" href="mailto:hello@kembali.app?subject=Security">Report a concern</a>
            </div>
          </div>
        </section>
    </>
  );
}
