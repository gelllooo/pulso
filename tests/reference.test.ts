import { expect, test } from "vitest";
import {
  BARANGAYS,
  MUNICIPALITIES,
  INITIAL_FACILITIES,
} from "../src/data/marinduqueData";
import { inMarinduque } from "../src/lib/geo";
import { officialSourceValid } from "../src/components/AdvisoryBoard";
import { canManageReports } from "../src/lib/permissions";
test("complete PSGC hierarchy has unique codes and municipality counts", () => {
  expect(MUNICIPALITIES).toHaveLength(6);
  expect(BARANGAYS).toHaveLength(218);
  expect(new Set(BARANGAYS.map((b) => b.psgcCode)).size).toBe(218);
  expect(
    MUNICIPALITIES.map(
      (m) => BARANGAYS.filter((b) => b.municipality === m).length,
    ),
  ).toEqual([61, 15, 25, 37, 55, 25]);
  expect(BARANGAYS.every((b) => /^17040\d{5}$/.test(b.psgcCode))).toBe(true);
  expect(new Set(INITIAL_FACILITIES.map((f) => f.municipality)).size).toBe(6);
});
test("bounds reject off-island coordinates and invalid numbers", () => {
  expect(inMarinduque(13.4, 121.9)).toBe(true);
  expect(inMarinduque(14.6, 121)).toBe(false);
  expect(inMarinduque(NaN, 121.9)).toBe(false);
});
test("official source links reject lookalike, userinfo, non-HTTPS and wrong-agency domains", () => {
  expect(
    officialSourceValid(
      "PAGASA",
      "https://www.pagasa.dost.gov.ph/tropical-cyclone",
    ),
  ).toBe(true);
  for (const url of [
    "https://pagasa.dost.gov.ph.evil.example/",
    "https://www.pagasa.dost.gov.ph@evil.example/",
    "javascript:alert(1)",
    "http://www.pagasa.dost.gov.ph/",
    "https://www.phivolcs.dost.gov.ph/",
  ])
    expect(officialSourceValid("PAGASA", url)).toBe(false);
});
test("guest and administrator cannot perform officer actions; municipality scope is mandatory", () => {
  expect(
    canManageReports(
      {
        id: "guest",
        name: "Guest",
        role: "resident_guest",
        scopeMunicipality: "",
      },
      "Boac",
    ),
  ).toBe(false);
  expect(
    canManageReports(
      {
        id: "admin",
        name: "Admin",
        role: "administrator",
        scopeMunicipality: "",
      },
      "Boac",
    ),
  ).toBe(false);
  expect(
    canManageReports(
      {
        id: "officer",
        name: "Officer",
        role: "municipal_officer",
        scopeMunicipality: "Boac",
      },
      "Gasan",
    ),
  ).toBe(false);
  expect(
    canManageReports(
      {
        id: "officer",
        name: "Officer",
        role: "municipal_officer",
        scopeMunicipality: "Boac",
      },
      "Boac",
    ),
  ).toBe(true);
});

test("CSV exports escape spreadsheet formulas and private server keys are rejected before bundling", async () => {
  const { csvCell } = await import("../src/lib/csv");
  expect(csvCell('=HYPERLINK("https://example.com")')).toBe(
    '"\'=HYPERLINK(""https://example.com"")"',
  );
  const { assertPublicSupabaseKey } =
    await import("../scripts/public-config.mjs");
  expect(() => assertPublicSupabaseKey("sb_publishable_test")).not.toThrow();
  expect(() => assertPublicSupabaseKey("sb_secret_test")).toThrow(
    /Refusing to bundle/,
  );
  const forged =
    "header." +
    Buffer.from(JSON.stringify({ role: "service_role" })).toString(
      "base64url",
    ) +
    ".signature";
  expect(() => assertPublicSupabaseKey(forged)).toThrow(/Refusing to bundle/);
});
