"use client";

import { useState } from "react";

import {
  MODULES,
  CORE_PRICE,
  GROWTH_PRICE,
  buildMailto,
  computeEstimate,
} from "./plan-builder";

/* TEMPORARY: design-structure options for the build-your-own section,
 * shown on /design-variants for the founder to pick from. The chosen one
 * replaces the live builder; this file and the page are then deleted.
 * All variants share the same data and math (plan-builder exports). */

function useBuilderState() {
  const [outlets, setOutlets] = useState(3);
  const [picked, setPicked] = useState<Set<string>>(new Set(["points"]));
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return { outlets, setOutlets, picked, toggle };
}

function Stepper({ outlets, setOutlets }: { outlets: number; setOutlets: (fn: (n: number) => number) => void }) {
  return (
    <div className="bo-stepper">
      <button type="button" className="bo-btn" aria-label="One outlet fewer" onClick={() => setOutlets((n) => Math.max(1, n - 1))}>
        &minus;
      </button>
      <span className="bo-count mono">{outlets}</span>
      <button type="button" className="bo-btn" aria-label="One outlet more" onClick={() => setOutlets((n) => Math.min(15, n + 1))}>
        +
      </button>
    </div>
  );
}

/** Option A2: toggle chips on the left, a live receipt on the right.
 * Leans on the product's ledger DNA: every choice becomes a printed line. */
export function VariantReceipt() {
  const { outlets, setOutlets, picked, toggle } = useBuilderState();
  const est = computeEstimate(outlets, picked);

  return (
    <div className="bvr">
      <div className="bvr-left">
        <p className="col-label mono">How many outlets?</p>
        <Stepper outlets={outlets} setOutlets={setOutlets} />
        <p className="col-label mono bvr-chips-label">Tap what you need</p>
        <div className="bvr-chips">
          <span className="bvr-chip bvr-chip-core">
            Core stamp cards <b className="mono">RM{CORE_PRICE}</b>
          </span>
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`bvr-chip${picked.has(m.id) ? " on" : ""}`}
              aria-pressed={picked.has(m.id)}
              onClick={() => toggle(m.id)}
            >
              {m.label} <b className="mono">+RM{m.price}</b>
              {!m.live && <i className="mono">soon</i>}
            </button>
          ))}
        </div>
      </div>

      <div className="bvr-receipt" aria-live="polite">
        <p className="bvr-rhead mono">Kembali &middot; monthly estimate</p>
        <div className="bvr-lines mono">
          <div className="bvr-line">
            <span>Core stamp cards</span>
            <span>{CORE_PRICE}</span>
          </div>
          {est.pickedModules.map((m) => (
            <div key={m.id} className="bvr-line">
              <span>{m.label}</span>
              <span>{m.price}</span>
            </div>
          ))}
          <div className="bvr-line bvr-line-sub">
            <span>Per outlet</span>
            <span>{est.perOutletFull}</span>
          </div>
          {est.discounted && (
            <div className="bvr-line bvr-line-sub">
              <span>Chain discount 20% off</span>
              <span>&minus;{est.perOutletFull - est.perOutlet}</span>
            </div>
          )}
          <div className="bvr-line bvr-line-sub">
            <span>Outlets</span>
            <span>&times; {outlets}</span>
          </div>
          <div className="bvr-line bvr-total">
            <span>Total a month</span>
            <span>RM {est.monthly}</span>
          </div>
        </div>
        {est.perOutlet >= GROWTH_PRICE && (
          <p className="bvr-hint">Growth bundles all of this for RM{GROWTH_PRICE}.</p>
        )}
        <a className="btn btn-solid" href={buildMailto(outlets, est.pickedModules, false, est.monthly)}>
          Send this plan to us
        </a>
        <p className="bvr-note mono">An estimate, not a quote</p>
      </div>
    </div>
  );
}

/** Option A3: the reach-out quiz shape, three small steps.
 * Familiar from the landing page; slowest but most guided. */
export function VariantSteps() {
  const { outlets, setOutlets, picked, toggle } = useBuilderState();
  const [step, setStep] = useState(0);
  const est = computeEstimate(outlets, picked);

  return (
    <div className="ro-card bvs" key={step}>
      <div className="ro-head">
        <p className="ro-eyebrow mono">
          {step === 0 && "Step 1 of 3"}
          {step === 1 && "Step 2 of 3"}
          {step === 2 && "Your estimate"}
        </p>
        <div className="ro-dots" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`ro-dot${i < step ? " on" : ""}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <>
          <h3 className="ro-prompt">How many outlets do you run?</h3>
          <Stepper outlets={outlets} setOutlets={setOutlets} />
          <div className="bvs-nav">
            <button type="button" className="btn btn-solid bvs-btn" onClick={() => setStep(1)}>
              Next
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h3 className="ro-prompt">What should the card do?</h3>
          <div className="bvs-list">
            {MODULES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`bm-row${picked.has(m.id) ? " on" : ""}`}
                aria-pressed={picked.has(m.id)}
                onClick={() => toggle(m.id)}
              >
                <span className={`bm-check${picked.has(m.id) ? " on" : ""}`} aria-hidden />
                <span className="bm-text">
                  <b>
                    {m.label}
                    {!m.live && <span className="soon-chip mono">Coming soon</span>}
                  </b>
                </span>
                <span className="bm-price mono">+RM{m.price}</span>
              </button>
            ))}
          </div>
          <div className="bvs-nav">
            <button type="button" className="ro-back mono" onClick={() => setStep(0)}>
              Go back
            </button>
            <button type="button" className="btn btn-solid bvs-btn" onClick={() => setStep(2)}>
              See the estimate
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="bt-per bvs-per">
            <span className="price">RM{est.perOutlet}</span>
            <span className="plan-per mono">/outlet/month</span>
          </p>
          {est.discounted && <p className="bvs-line mono">20% chain discount applied</p>}
          <p className="bvs-monthly">
            RM{est.monthly} a month for {outlets} {outlets === 1 ? "outlet" : "outlets"}, core included
          </p>
          {est.perOutlet >= GROWTH_PRICE && (
            <p className="bt-hint bvs-hint">Growth bundles all of this for RM{GROWTH_PRICE}. Ask us which fits.</p>
          )}
          <div className="bvs-nav">
            <button type="button" className="ro-back mono" onClick={() => setStep(1)}>
              Go back
            </button>
            <a className="btn btn-solid bvs-btn" href={buildMailto(outlets, est.pickedModules, false, est.monthly)}>
              Send this plan to us
            </a>
          </div>
          <p className="bvr-note mono">An estimate, not a quote</p>
        </>
      )}
    </div>
  );
}
