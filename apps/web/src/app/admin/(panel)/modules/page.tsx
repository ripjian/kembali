import { redirect } from "next/navigation";

import { schema, withPlatform } from "@kembali/db";
import { asc } from "drizzle-orm";

import { saveModules } from "@/lib/admin-actions";
import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseModules } from "@/lib/modules";

const MODULE_LABELS: Array<{ key: "stamps" | "scan" | "reports"; label: string; hint: string }> = [
  { key: "stamps", label: "Stamp cards", hint: "Customer cards and rewards" },
  { key: "scan", label: "Scan & stamp", hint: "The counter scanning screen" },
  { key: "reports", label: "Reports", hint: "Daily numbers and top regulars" },
];

export default async function ModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const admin = (await getAdminContext())!;
  if (admin.kind !== "platform") redirect("/admin");
  const { saved } = await searchParams;

  const db = await getDb();
  const tenants = await withPlatform(db, (tx) =>
    tx.select().from(schema.tenants).orderBy(asc(schema.tenants.name)),
  );

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Modules</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Switch features on or off per merchant. Changes apply the next time
          they load the panel.
        </p>
      </header>

      {saved && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          Modules saved.
        </p>
      )}

      {tenants.map((tenant) => {
        const modules = parseModules(tenant.modules);
        return (
          <form
            key={tenant.id}
            action={saveModules}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="tenantId" value={tenant.id} />
            <p className="font-medium text-text">{tenant.name}</p>
            <div className="mt-3 flex flex-col gap-2">
              {MODULE_LABELS.map((m) => (
                <label key={m.key} className="flex items-center gap-3 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    name={m.key}
                    defaultChecked={modules[m.key]}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="font-medium text-text">{m.label}</span>{" "}
                    <span className="text-xs text-text-muted">— {m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <button className="mt-3 rounded-lg border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface-alt">
              Save for {tenant.name}
            </button>
          </form>
        );
      })}
    </main>
  );
}
