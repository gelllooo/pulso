import { beforeAll, afterAll, describe, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const ids = {
  resident: "10000000-0000-4000-8000-000000000001",
  other: "10000000-0000-4000-8000-000000000002",
  boac: "10000000-0000-4000-8000-000000000003",
  gasan: "10000000-0000-4000-8000-000000000004",
  province: "10000000-0000-4000-8000-000000000005",
  admin: "10000000-0000-4000-8000-000000000006",
};
const reportBoac = "20000001-0000-4000-8000-000000000001",
  reportGasan = "20000002-0000-4000-8000-000000000002";
async function asUser(id: string, role = "authenticated") {
  await db.exec(
    `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
async function root() {
  await db.exec("reset role;");
}
async function submit(
  id: string,
  municipality = "Boac",
  barangayCode = "1704001001",
) {
  return db.query<any>("select public.submit_report($1::jsonb) as report", [
    JSON.stringify({
      clientReportId: id,
      category: "flooding",
      description: "PRIVATE_DESCRIPTION: water observed near a building.",
      municipality,
      barangayCode,
      lat: 13.4,
      lng: 121.9,
      locationSource: "manual",
      urgency: "elevated",
      observationTime: new Date().toISOString(),
      reporterName: "PRIVATE_NAME",
      reporterContact: "PRIVATE_CONTACT",
      status: "verified",
      owner_id: ids.admin,
      verification: { internalNotes: "forged" },
    }),
  ]);
}
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
  );
  await db.exec(
    readFileSync("supabase/migrations/202610270001_pulso.sql", "utf8"),
  );
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  for (const id of Object.values(ids))
    await db.query(
      "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
      [
        id,
        JSON.stringify({
          full_name: "Test user",
          role: "administrator",
          municipality: "Boac",
        }),
      ],
    );
  await db.query(
    "update public.profiles set role='municipal_officer',municipality='Boac' where id=$1",
    [ids.boac],
  );
  await db.query(
    "update public.profiles set role='municipal_officer',municipality='Gasan' where id=$1",
    [ids.gasan],
  );
  await db.query(
    "update public.profiles set role='provincial_officer' where id=$1",
    [ids.province],
  );
  await db.query(
    "update public.profiles set role='administrator' where id=$1",
    [ids.admin],
  );
});
afterAll(() => db.close());
describe("Actual PostgreSQL migration, RPCs and RLS", () => {
  test("contains exactly four roles and all 218 barangays; repeat seed is safe", async () => {
    await root();
    expect(
      (
        await db.query<{ enumlabel: string }>(
          "select enumlabel from pg_enum where enumtypid='public.app_role'::regtype",
        )
      ).rows.map((r) => r.enumlabel),
    ).toEqual([
      "resident_guest",
      "municipal_officer",
      "provincial_officer",
      "administrator",
    ]);
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    expect(
      (
        await db.query<{ n: number }>(
          "select count(*)::integer n from public.barangays",
        )
      ).rows[0].n,
    ).toBe(218);
    expect(
      (
        await db.query<{ n: number }>(
          "select count(*)::integer n from public.facilities",
        )
      ).rows[0].n,
    ).toBe(18);
  });
  test("OAuth metadata cannot self-assign a role and direct profile writes fail", async () => {
    await asUser(ids.resident);
    expect(
      (await db.query<{ role: string }>("select role from public.profiles"))
        .rows,
    ).toEqual([{ role: "resident_guest" }]);
    await expect(
      db.exec("update public.profiles set role='administrator'"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query("select public.admin_set_role($1,$2,$3)", [
        ids.resident,
        "administrator",
        null,
      ]),
    ).rejects.toThrow(/Administrator/);
  });
  test("server derives owner/status, rejects privileged payload fields and acknowledges retries once", async () => {
    await asUser(ids.resident);
    const first = (await submit(reportBoac)).rows[0].report;
    expect(first.owner_id).toBe(ids.resident);
    expect(first.status).toBe("received");
    expect((await submit(reportBoac)).rows[0].report.id).toBe(first.id);
    await root();
    expect(
      (
        await db.query<{ n: number }>(
          "select count(*)::integer n from public.report_audit where report_id=$1",
          [reportBoac],
        )
      ).rows[0].n,
    ).toBe(1);
    await asUser(ids.other);
    await submit(reportGasan, "Gasan", "1704003001");
    await expect(submit(reportBoac)).rejects.toThrow(/another account/);
  });
  test("residents cannot read another report/contact, verify, or mutate raw report data", async () => {
    await asUser(ids.resident);
    expect((await db.query("select * from public.reports")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("select * from public.report_private")).rows,
    ).toHaveLength(1);
    await expect(
      db.query("select public.manage_report($1,'verify',$2)", [
        reportBoac,
        JSON.stringify({
          basis: "field_check",
          confidence: "high",
          severityAssessment: "moderate",
        }),
      ]),
    ).rejects.toThrow(/authorized municipality/);
    await expect(
      db.exec("update public.reports set status='verified'"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.exec("insert into public.reports(id) values(gen_random_uuid())"),
    ).rejects.toThrow(/permission denied/);
  });
  test("municipal officers see and manage only their municipality; provincial officers see all", async () => {
    await asUser(ids.boac);
    expect((await db.query("select * from public.reports")).rows).toHaveLength(
      1,
    );
    await expect(
      db.query("select public.manage_report($1,'verify',$2)", [
        reportGasan,
        JSON.stringify({
          basis: "field_check",
          confidence: "high",
          severityAssessment: "moderate",
        }),
      ]),
    ).rejects.toThrow(/authorized municipality/);
    await db.query("select public.manage_report($1,'verify',$2)", [
      reportBoac,
      JSON.stringify({
        basis: "field_check",
        confidence: "high",
        severityAssessment: "moderate",
        internalNotes: "SECRET_INTERNAL_NOTES",
        publicUpdate: "Public-safe verified water report.",
      }),
    ]);
    await asUser(ids.province);
    expect((await db.query("select * from public.reports")).rows).toHaveLength(
      2,
    );
  });
  test("verified public projection never exposes contacts, raw descriptions, identity or internal notes", async () => {
    await asUser("", "anon");
    const result = await db.query<any>("select * from public.public_incidents");
    expect(result.rows).toHaveLength(1);
    const text = JSON.stringify(result.rows);
    expect(text).toContain("Public-safe");
    expect(text).not.toMatch(
      /PRIVATE_|SECRET_|owner_id|reporter_contact|verification/,
    );
    await expect(db.exec("select * from public.reports")).rejects.toThrow(
      /permission denied/,
    );
    await asUser(ids.resident);
    expect(
      (await db.query("select * from public.report_reviews")).rows,
    ).toHaveLength(0);
    await expect(
      db.exec("update public.report_audit set notes='changed'"),
    ).rejects.toThrow(/permission denied/);
  });
  test("invalid geography, invalid source URLs and unauthorized advisory posting are rejected", async () => {
    await asUser(ids.resident);
    await expect(
      submit("20000003-0000-4000-8000-000000000003", "Gasan", "1704001001"),
    ).rejects.toThrow(/Invalid municipality/);
    await expect(
      db.query(
        "insert into public.official_advisories(issuer,source_url,title,content,category,severity,issued_at) values('PAGASA','https://www.pagasa.dost.gov.ph/','Test advisory','Test advisory content','weather','info',now())",
      ),
    ).rejects.toThrow(/row-level security/);
    await asUser(ids.boac);
    await expect(
      db.exec(
        "insert into public.official_advisories(issuer,source_url,title,content,category,severity,municipality,issued_at) values('PAGASA','https://pagasa.dost.gov.ph.attacker.example/','Test advisory','Test advisory content','weather','info','Boac',now())",
      ),
    ).rejects.toThrow(/check constraint/);
    await expect(
      db.exec(
        "insert into public.official_advisories(issuer,source_url,title,content,category,severity,municipality,issued_at) values('PAGASA','https://www.pagasa.dost.gov.ph/','Test advisory','Test advisory content','weather','info','Gasan',now())",
      ),
    ).rejects.toThrow(/row-level security/);
    await db.exec(
      "insert into public.official_advisories(issuer,source_url,title,content,category,severity,municipality,issued_at) values('PAGASA','https://www.pagasa.dost.gov.ph/','Test advisory','Test advisory content','weather','info','Boac',now())",
    );
  });
  test("advisory retraction is a scoped human action and retains the source record", async () => {
    await asUser(ids.gasan);
    const id = (
      await db.query<{ id: string }>(
        "select id from public.official_advisories limit 1",
      )
    ).rows[0].id;
    await expect(
      db.query("select public.retract_advisory($1)", [id]),
    ).rejects.toThrow(/authorized scope/);
    await asUser(ids.boac);
    await db.query("select public.retract_advisory($1)", [id]);
    expect(
      (
        await db.query<{ status: string }>(
          "select status from public.official_advisories where id=$1",
          [id],
        )
      ).rows[0].status,
    ).toBe("cancelled");
  });
  test("administrators manage profiles/configuration without implicit officer data access", async () => {
    await asUser(ids.admin);
    expect((await db.query("select * from public.profiles")).rows).toHaveLength(
      6,
    );
    expect((await db.query("select * from public.reports")).rows).toHaveLength(
      0,
    );
    await db.query("select public.admin_set_role($1,$2,$3)", [
      ids.other,
      "municipal_officer",
      "Torrijos",
    ]);
    await expect(
      db.query("select public.admin_set_role($1,$2,$3)", [
        ids.admin,
        "resident_guest",
        null,
      ]),
    ).rejects.toThrow(/last administrator/);
    await db.query("select public.set_system_config($1,$2)", [
      "facility_notice",
      "Test public notice",
    ]);
    await asUser(ids.resident);
    expect(
      (await db.query("select * from public.public_system_notices")).rows,
    ).toHaveLength(1);
    await expect(
      db.query("select public.set_system_config($1,$2)", [
        "facility_notice",
        "Forged",
      ]),
    ).rejects.toThrow(/Administrator/);
  });
  test("a scoped official can publish validated facilities and re-seeding preserves the record", async () => {
    const facility = JSON.parse(
      readFileSync("src/data/facilities.json", "utf8"),
    )[0];
    await asUser(ids.boac);
    await expect(
      db.query("select public.publish_facility($1)", [
        JSON.stringify(facility),
      ]),
    ).rejects.toThrow(/coordinates/);
    const validated = {
      ...facility,
      name: "TEST FIXTURE ONLY",
      lat: 13.45,
      lng: 121.84,
      capacity: 100,
      currentOccupancy: 10,
      contactNumber: "TEST-CONTACT",
      verificationStatus: "verified",
      coordinateAccuracy: "surveyed",
      sourceUrl: "https://example.gov.ph/test/",
    };
    await db.query("select public.publish_facility($1)", [
      JSON.stringify(validated),
    ]);
    await asUser(ids.gasan);
    await expect(
      db.query("select public.publish_facility($1)", [
        JSON.stringify(validated),
      ]),
    ).rejects.toThrow(/scope/);
    await root();
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    expect(
      (
        await db.query<any>(
          "select payload from public.facilities where id=$1",
          [facility.id],
        )
      ).rows[0].payload.name,
    ).toBe("TEST FIXTURE ONLY");
  });
});
