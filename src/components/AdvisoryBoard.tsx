import { useEffect, useState } from "react";
import { ExternalLink, Radio, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { canManageReports } from "../lib/permissions";
import { supabase } from "../lib/supabase";
import { MUNICIPALITIES } from "../data/marinduqueData";
import { Button } from "./ui/button";
const sources = [
  { name: "PAGASA", url: "https://www.pagasa.dost.gov.ph/" },
  { name: "PHIVOLCS", url: "https://www.phivolcs.dost.gov.ph/" },
  { name: "NDRRMC", url: "https://ndrrmc.gov.ph/" },
];
export function officialSourceValid(issuer: string, value: string) {
  try {
    const url = new URL(value);
    const domain =
      issuer === "PAGASA"
        ? "pagasa.dost.gov.ph"
        : issuer === "PHIVOLCS"
          ? "phivolcs.dost.gov.ph"
          : issuer === "NDRRMC"
            ? "ndrrmc.gov.ph"
            : "";
    return (
      !!domain &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    );
  } catch {
    return false;
  }
}
type News = { title: string; url: string; publishedAt: string };
export function AdvisoryBoard() {
  const app = useApp();
  const [news, setNews] = useState<News[]>([]),
    [newsStatus, setNewsStatus] = useState("Loading agency news…"),
    [retrieved, setRetrieved] = useState(""),
    [stale, setStale] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let stopped = false,
      controller: AbortController | null = null;
    async function refresh() {
      if (controller) return;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 30000);
      try {
        const response = await fetch("/api/official/phivolcs/news", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error(
            "PHIVOLCS agency news is currently unavailable. Check the original agency website.",
          );
        const xml = new DOMParser().parseFromString(
          await response.text(),
          "application/xml",
        );
        if (xml.querySelector("parsererror"))
          throw new Error("Agency feed could not be parsed.");
        const items = [...xml.querySelectorAll("item")]
          .flatMap((item) => {
            const url = item.querySelector("link")?.textContent?.trim() || "";
            if (!officialSourceValid("PHIVOLCS", url)) return [];
            return [
              {
                title:
                  item.querySelector("title")?.textContent || "Agency post",
                url,
                publishedAt: item.querySelector("pubDate")?.textContent || "",
              },
            ];
          })
          .sort(
            (a, b) =>
              (Date.parse(b.publishedAt) || 0) -
              (Date.parse(a.publishedAt) || 0),
          )
          .slice(0, 10);
        if (!stopped) {
          setNews(items);
          setRetrieved(response.headers.get("X-Feed-Fetched-At") || "");
          setStale(response.headers.get("X-Feed-Stale") === "true");
          setNewsStatus(items.length ? "" : "No agency posts returned.");
        }
      } catch (error) {
        if (!stopped)
          setNewsStatus(
            error instanceof Error
              ? error.message
              : "Agency news is unavailable.",
          );
      } finally {
        clearTimeout(timeout);
        controller = null;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 300000);
    return () => {
      stopped = true;
      clearInterval(timer);
      controller?.abort();
    };
  }, []);
  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    const form = e.currentTarget,
      data = new FormData(form),
      issuer = String(data.get("issuer")),
      url = String(data.get("source"));
    setMessage("");
    if (!officialSourceValid(issuer, url)) {
      setMessage(
        "Use an HTTPS original-source URL on the selected agency’s official domain.",
      );
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("official_advisories").insert({
        issuer,
        source_url: url,
        title: String(data.get("title")),
        content: String(data.get("content")),
        category: String(data.get("category")),
        severity: String(data.get("severity")),
        municipality:
          app.currentUser.role === "municipal_officer"
            ? app.currentUser.scopeMunicipality
            : String(data.get("municipality")) || null,
        issued_at: new Date(String(data.get("issued"))).toISOString(),
        expires_at: data.get("expires")
          ? new Date(String(data.get("expires"))).toISOString()
          : null,
      });
      if (error) throw error;
      await app.refreshData();
      form.reset();
      setMessage("Source-attributed advisory published.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publishing failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-shell">
      <p className="eyebrow">Original sources. Clear attribution.</p>
      <h1 className="page-title">Official advisories</h1>
      <p className="page-description">
        Agency advisories republished by authorized officers, with a direct link
        to the original. Community reports appear in their own workspace.
      </p>
      <div className="my-6 grid gap-3 sm:grid-cols-3">
        {sources.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-sand-200 bg-white p-5 text-sm font-semibold text-marine-900"
          >
            <span className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              {s.name}
            </span>
            <ExternalLink className="h-4 w-4" />
          </a>
        ))}
      </div>
      <section className="rounded-xl border border-marine-100 bg-marine-50 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-marine-900">
          <ShieldCheck className="h-5 w-5" />
          Source-attributed official advisories
        </h2>
        <p className="mt-2 text-xs leading-6 text-charcoal-600">
          No supported PAGASA or NDRRMC RSS endpoint is configured. Authorized
          municipal and provincial officers can post an original agency advisory
          below. AI does not create or modify advisories.
        </p>
        {app.advisories.length === 0 ? (
          <p className="mt-5 rounded-lg bg-white p-4 text-sm text-charcoal-600">
            No official advisories have been published to PULSO. Check the
            agency links above for current information.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {[...app.advisories]
              .sort(
                (a, b) =>
                  Date.parse(b.issuanceTime) - Date.parse(a.issuanceTime),
              )
              .map((a) => (
                <article
                  key={a.id}
                  className={`rounded-xl border bg-white p-5 ${a.verificationStatus === "expired" ? "border-sand-200 opacity-75" : "border-marine-100"}`}
                >
                  <div className="flex flex-wrap justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span>
                      {a.issuer} · {a.scope}
                    </span>
                    <span
                      className={
                        a.verificationStatus === "expired"
                          ? "text-charcoal-500"
                          : a.severity === "info"
                            ? "text-marine-700"
                            : "text-coral-700"
                      }
                    >
                      {a.verificationStatus === "expired"
                        ? "Expired"
                        : a.severity}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-marine-900">
                    {a.title}
                  </h3>
                  <p className="my-3 whitespace-pre-wrap text-sm leading-6 text-charcoal-600">
                    {a.content}
                  </p>
                  <p className="text-xs text-charcoal-500">
                    Issued {new Date(a.issuanceTime).toLocaleString("en-PH")}
                    {a.validityPeriod
                      ? ` · Valid until ${new Date(a.validityPeriod).toLocaleString("en-PH")}`
                      : ""}
                  </p>
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-marine-700 underline"
                  >
                    Read original {a.issuer} advisory
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {(a.municipality
                    ? canManageReports(app.currentUser, a.municipality)
                    : app.currentUser.role === "provincial_officer") && (
                    <Button
                      className="mt-3 block"
                      variant="outline"
                      disabled={busy || app.isOffline}
                      onClick={async () => {
                        if (!supabase) return;
                        setBusy(true);
                        const { error } = await supabase.rpc(
                          "retract_advisory",
                          { p_advisory_id: a.id },
                        );
                        setMessage(
                          error?.message ||
                            "Republication retracted. The source record is retained.",
                        );
                        if (!error) await app.refreshData();
                        setBusy(false);
                      }}
                    >
                      Retract this republication
                    </Button>
                  )}
                </article>
              ))}
          </div>
        )}
      </section>
      {canManageReports(app.currentUser) && (
        <details className="my-6 rounded-xl border border-sand-200 bg-white p-5">
          <summary className="cursor-pointer font-semibold text-marine-900">
            Republish an original official advisory
          </summary>
          <form onSubmit={publish} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label">
                Issuing agency
                <select name="issuer" className="input">
                  {sources.map((s) => (
                    <option key={s.name}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Original advisory URL
                <input
                  name="source"
                  className="input"
                  required
                  type="url"
                  maxLength={2000}
                />
              </label>
            </div>
            <label className="field-label">
              Original title
              <input
                name="title"
                className="input"
                required
                minLength={5}
                maxLength={200}
              />
            </label>
            <label className="field-label">
              Source-attributed advisory content
              <textarea
                name="content"
                className="input"
                required
                rows={4}
                minLength={10}
                maxLength={10000}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field-label">
                Category
                <select name="category" className="input">
                  {["weather", "evacuation", "hazard"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Severity stated by the agency
                <select name="severity" className="input">
                  {["info", "warning", "severe", "emergency"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Agency issuance time
                <input
                  name="issued"
                  required
                  type="datetime-local"
                  className="input"
                />
              </label>
              <label className="field-label">
                Agency expiry time (optional)
                <input name="expires" type="datetime-local" className="input" />
              </label>
              {app.currentUser.role === "provincial_officer" && (
                <label className="field-label">
                  Area covered
                  <select name="municipality" className="input">
                    <option value="">All of Marinduque</option>
                    {MUNICIPALITIES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <label className="flex items-start gap-2 text-xs leading-6">
              <input type="checkbox" required className="mt-1.5" />I checked the
              original source, its coverage, severity and validity. This is a
              faithful republication.
            </label>
            <Button type="submit" disabled={busy || app.isOffline}>
              {busy ? "Publishing…" : "Publish attributed advisory"}
            </Button>
          </form>
        </details>
      )}
      {message && (
        <p role="status" className="my-4 rounded-lg bg-sand-100 p-4 text-sm">
          {message}
        </p>
      )}
      <section className="mt-7 rounded-xl border border-sand-200 bg-white p-5">
        <h2 className="font-display text-xl font-semibold text-marine-900">
          PHIVOLCS agency news
        </h2>
        <p className="mt-2 text-xs leading-6 text-charcoal-500">
          General agency posts, displayed separately from official warnings and
          local reports. Refreshes every five minutes.
          {retrieved
            ? ` Retrieved ${new Date(retrieved).toLocaleString("en-PH")}.`
            : ""}
          {stale ? " Showing a previously retrieved copy." : ""}
        </p>
        {newsStatus && (
          <p role="status" className="mt-3 text-sm text-charcoal-600">
            {newsStatus}
          </p>
        )}
        <ul className="mt-4 divide-y divide-sand-200">
          {news.map((n) => (
            <li key={n.url} className="py-4">
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-marine-700 underline"
              >
                {n.title}
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
              {Number.isFinite(Date.parse(n.publishedAt)) && (
                <p className="mt-1 text-xs text-charcoal-500">
                  {new Date(n.publishedAt).toLocaleString("en-PH")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
