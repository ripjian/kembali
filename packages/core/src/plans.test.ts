import { describe, expect, it } from "vitest";

import { planAllowsReportDownload } from "./plans";

describe("planAllowsReportDownload", () => {
  it("allows report downloads on Founding and Growth", () => {
    expect(planAllowsReportDownload("founding")).toBe(true);
    expect(planAllowsReportDownload("growth")).toBe(true);
  });

  it("locks report downloads on Starter and Trial", () => {
    expect(planAllowsReportDownload("starter")).toBe(false);
    expect(planAllowsReportDownload("trial")).toBe(false);
  });

  it("locks unknown plans by default", () => {
    expect(planAllowsReportDownload("")).toBe(false);
    expect(planAllowsReportDownload("enterprise")).toBe(false);
  });
});
