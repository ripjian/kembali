import { redirect } from "next/navigation";

import { createCustomer } from "@/lib/admin-actions";
import { getPanelContext } from "@/lib/panel";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text outline-none focus:border-primary";

export default async function NewCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.can("manageCustomers")) redirect(ctx.base);
  const { error } = await searchParams;

  return (
    <main className="flex max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Add customer</h1>
        <p className="mt-1 text-sm text-text-secondary">
          For walk-ins who&apos;d rather you set them up. They can sign in
          later with their phone number.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {error === "exists"
            ? "A customer with that phone number already exists."
            : "Check the name and phone number, then try again."}
        </p>
      )}

      <form action={createCustomer} className="flex flex-col gap-4">
        <input type="hidden" name="tenantId" value={ctx.tenant.id} />
        <div>
          <label className="text-sm font-medium text-text" htmlFor="name">
            Full name
          </label>
          <input id="name" name="name" required maxLength={120} className={`mt-1.5 ${inputClass}`} />
        </div>
        <div>
          <label className="text-sm font-medium text-text" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="012-345 6789"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text" htmlFor="email">
            Email (optional)
          </label>
          <input id="email" name="email" type="email" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div>
          <label className="text-sm font-medium text-text" htmlFor="birthday">
            Birthday (optional, for birthday rewards later)
          </label>
          <input id="birthday" name="birthday" type="date" className={`mt-1.5 ${inputClass}`} />
        </div>

        <fieldset className="rounded-xl border border-border bg-surface p-4">
          <legend className="px-1 text-sm font-medium text-text">
            Marketing consent (PDPA, ask the customer)
          </legend>
          <label className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" name="optInWhatsapp" className="size-4 accent-[var(--primary)]" />
            OK to receive WhatsApp messages
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" name="optInEmail" className="size-4 accent-[var(--primary)]" />
            OK to receive emails
          </label>
        </fieldset>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          Create customer & card
        </button>
      </form>
    </main>
  );
}
