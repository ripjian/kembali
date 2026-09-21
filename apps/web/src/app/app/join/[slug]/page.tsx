import { notFound } from "next/navigation";

import { isReferralCode, normalizeReferralCode } from "@kembali/core";
import { withTenant } from "@kembali/db";
import { LogoMark } from "@kembali/ui";

import { getDb } from "@/lib/db";
import { getPublicTenantBySlug } from "@/lib/join";
import {
  describeReward,
  findReferrerByCode,
  readReferralProgram,
  rewardTitlesFor,
} from "@/lib/referrals";
import { getTenantColors } from "@/lib/tenant-theme";

import { LoginForm } from "../../login-form";
import { TenantTheme } from "../../tenant-theme";

export const dynamic = "force-dynamic";

/* Tenant-scoped join: a merchant's printed QR points here. The slug alone
 * decides which merchant a new customer joins, so a logged-in customer of
 * one shop scanning another shop's code lands on that shop's join page (not
 * their own card). Themed in the merchant's brand colours. */

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicTenantBySlug(slug);
  if (!tenant) notFound();

  const colors = await getTenantColors(tenant.id);

  // A friend's invite link: show who invited and what the friend gets, and
  // carry the code into OTP verify (it only counts for a new member).
  const { ref } = await searchParams;
  const code = ref ? normalizeReferralCode(ref) : "";
  const invite = isReferralCode(code)
    ? await withTenant(await getDb(), tenant.id, async (tx) => {
        const program = await readReferralProgram(tx);
        if (!program.live) return null;
        const referrer = await findReferrerByCode(tx, code);
        if (!referrer) return null;
        const titles = await rewardTitlesFor(tx, program.settings);
        return {
          name: referrer.name?.split(" ")[0] ?? "A friend",
          reward: describeReward(program.settings.referee, titles),
        };
      })
    : null;

  return (
    <TenantTheme tenantId={tenant.id} colors={colors}>
      <LoginForm
        tenantId={tenant.id}
        referralCode={invite ? code : undefined}
        notice={
          invite ? (
            <p
              role="status"
              className="rounded-xl border border-tenant-accent/40 bg-surface px-4 py-3 text-sm text-text"
              data-invite-banner
            >
              <span className="font-semibold">{invite.name} invited you.</span>{" "}
              {invite.reward === "nothing"
                ? "Join and start collecting stamps."
                : `You get ${invite.reward} after your first stamp.`}
            </p>
          ) : null
        }
        title={`Join ${tenant.name}`}
        phoneSubtitle="Enter your phone number to start your loyalty card."
        logo={
          tenant.logoUrl ? (
            // merchant-uploaded square logo (data URL, no optimizer)
            <img
              src={tenant.logoUrl}
              alt=""
              className="size-14 rounded-2xl border border-border object-cover"
            />
          ) : (
            <>
              <LogoMark size={40} className="dark:hidden" />
              <LogoMark size={40} mono="sand" className="hidden dark:block" />
            </>
          )
        }
      />
    </TenantTheme>
  );
}
