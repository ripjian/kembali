import { redirect } from "next/navigation";
import { LogoWordmark } from "@kembali/ui";

import { adminLogin } from "@/lib/admin-actions";
import { getAdminContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminContext()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <LogoWordmark size={28} className="dark:hidden" />
        <LogoWordmark size={28} mono="sand" className="hidden dark:block" />
        <div>
          <h1 className="text-xl font-semibold text-text">Merchant sign in</h1>
          <p className="mt-1 text-sm text-text-secondary">
            For store owners, staff and Kembali admins.
          </p>
        </div>
      </header>

      <form action={adminLogin} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-text" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@yourstore.com"
          className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
        />
        <label className="text-sm font-medium text-text" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="mt-1 inline-flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          Sign in
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          Email or password didn&apos;t match. Check them and try again.
        </p>
      )}
    </main>
  );
}
