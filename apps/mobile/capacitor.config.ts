import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { CapacitorConfig } from "@capacitor/cli";

/* The shell is brand-agnostic: everything brand-specific lives in
 * brands/<id>.json, picked by the BRAND env var. The app loads the
 * customer PWA remotely (server.url), so every card improvement ships
 * to web and app together; APP_URL overrides for device testing against
 * a LAN address (a simulator can reach localhost, a real phone cannot). */

interface BrandConfig {
  appId: string;
  appName: string;
  tenant: string;
  devUrl: string;
  prodUrl: string;
}

const brandId = process.env.BRAND ?? "corner-coffee";
const brand: BrandConfig = JSON.parse(
  readFileSync(join(process.cwd(), "brands", `${brandId}.json`), "utf8")
);

const url = process.env.APP_URL ?? (process.env.NODE_ENV === "production" ? brand.prodUrl : brand.devUrl);

const config: CapacitorConfig = {
  appId: brand.appId,
  appName: brand.appName,
  webDir: "web-stub",
  server: {
    url,
    // dev only: simulators talk to the Next server over plain http
    cleartext: url.startsWith("http://"),
  },
};

export default config;
