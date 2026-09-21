import { planAllowsReferrals, type ReferralSettings } from "@kembali/core";

import { updateReferralSettings } from "@/lib/admin-actions";

/* Referral program settings (Phase 5), on the Rewards page because the
 * rewards are what it hands out. Plan-gated: Starter and trial see the
 * lock, Founding and Growth get the form. Rewards qualify on the friend's
 * first stamp, never on sign-up (DEVSPEC §17). */

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary";
const selectClass = `${inputClass} appearance-none`;

function RewardFields({
  side,
  label,
  hint,
  value,
  items,
}: {
  side: "referrer" | "referee";
  label: string;
  hint: string;
  value: ReferralSettings["referrer"];
  items: { id: string; title: string }[];
}) {
  return (
    <fieldset className="rounded-xl border border-border p-3">
      <legend className="px-1 text-xs font-semibold text-text">{label}</legend>
      <p className="text-xs text-text-muted">{hint}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-text">
          Reward type
          <select name={`${side}Type`} defaultValue={value.type} className={`mt-1 ${selectClass}`}>
            <option value="none">Nothing</option>
            <option value="points">Points</option>
            <option value="voucher">Free reward (voucher)</option>
          </select>
        </label>
        <label className="text-xs font-medium text-text">
          Points
          <input
            name={`${side}Points`}
            type="number"
            min={1}
            max={100000}
            defaultValue={value.type === "points" ? value.points : 50}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs font-medium text-text">
          Voucher for
          <select
            name={`${side}Item`}
            defaultValue={value.type === "voucher" ? value.rewardItemId : ""}
            className={`mt-1 ${selectClass}`}
          >
            <option value="">Choose a reward…</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>{it.title}</option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}

export function ReferralSettingsSection({
  tenantId,
  plan,
  settings,
  items,
  stats,
}: {
  tenantId: string;
  plan: string;
  settings: ReferralSettings;
  items: { id: string; title: string }[];
  stats: { invites30d: number; rewarded30d: number };
}) {
  if (!planAllowsReferrals(plan)) {
    return (
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" data-referrals="locked">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
          <span aria-hidden>🔒</span> Referral program
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Members invite friends with a personal link and both get a reward
          on the friend&apos;s first visit. Available on the Founding and
          Growth plans. Talk to Kembali to switch plans.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" data-referrals="form">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text">Referral program</h2>
          <p className="mt-1 text-xs text-text-muted">
            Members share a personal link. When a friend joins and gets their
            first stamp, both sides receive the rewards below. Sign-ups
            alone earn nothing, so fake invites cost you nothing.
          </p>
        </div>
        <p className="text-xs text-text-muted" data-stat>
          Last 30 days: {stats.invites30d} invites · {stats.rewarded30d} first visits
        </p>
      </div>

      <form action={updateReferralSettings} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="size-4" />
          Referral program is on
        </label>

        <RewardFields
          side="referrer"
          label="The member who invited"
          hint="What the existing member gets when their friend makes a first visit."
          value={settings.referrer}
          items={items}
        />
        <RewardFields
          side="referee"
          label="The friend who joined"
          hint="A welcome treat for the new member, granted with their first stamp."
          value={settings.referee}
          items={items}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-text">
            Max rewarded invites per member
            <input name="maxPerReferrer" type="number" min={0} max={1000} defaultValue={settings.maxPerReferrer} className={`mt-1 ${inputClass}`} />
            <span className="mt-1 block font-normal text-text-muted">0 means no limit.</span>
          </label>
          <label className="text-xs font-medium text-text">
            …within this many days
            <input name="windowDays" type="number" min={1} max={365} defaultValue={settings.windowDays} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-xs font-medium text-text">
            Vouchers stay valid for (days)
            <input name="voucherValidDays" type="number" min={1} max={365} defaultValue={settings.voucherValidDays} className={`mt-1 ${inputClass}`} />
          </label>
        </div>

        <div>
          <button className="h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary hover:bg-primary-hover">
            Save referral settings
          </button>
        </div>
      </form>
    </section>
  );
}
