import {
  ArrowUpRight,
  Send,
  Building2,
  MapPin,
  ShieldCheck,
  Radio,
  CloudUpload,
  Sprout,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Button } from "./ui/button";
export function Overview() {
  const app = useApp();
  const verified = app.reports.filter((r) =>
    [
      "verified",
      "assigned",
      "action_in_progress",
      "resolved",
      "closed",
    ].includes(r.status),
  );
  const sites = app.facilities.filter(
    (f) => f.verificationStatus === "verified",
  );
  return (
    <div className="page-shell">
      <div className="mb-6 flex items-center gap-2 text-xs text-charcoal-500">
        <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
        Island-wide preparedness <span className="mx-1">/</span>
        <span>6 municipalities, one community</span>
      </div>
      <section className="hero-panel relative overflow-hidden rounded-2xl bg-marine-900 p-7 text-white sm:p-10">
        <div className="relative z-10 max-w-xl">
          <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.23em] text-sand-300">
            <span className="h-px w-7 bg-coral-500" />
            The pulse of our community
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
            A prepared island.
            <br />
            <span className="text-sand-300">A resilient tomorrow.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-sand-200">
            Report what you see. Find local resources. Stay informed with
            official sources. Preparedness starts with all of us.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button variant="coral" onClick={() => app.setActiveTab("report")}>
              <Send className="h-4 w-4" />
              Report an incident
            </Button>
            <Button
              className="border border-white/25 bg-transparent hover:bg-white/10"
              onClick={() => app.setActiveTab("map")}
            >
              Explore community map
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div aria-hidden="true" className="hero-island hidden lg:block">
          <svg viewBox="0 0 230 300" className="h-full w-full">
            <path
              d="M80 25L108 40 143 27 164 64 183 87 175 115 200 141 181 175 185 203 150 227 132 266 101 252 73 269 55 237 39 216 48 178 25 155 43 127 32 98 66 72Z"
              fill="#2b5c8f"
              stroke="#6384a0"
              strokeWidth="1.5"
            />
            <path
              d="M80 25L73 269M32 98L185 203M39 216L164 64M43 127L181 175"
              stroke="#6384a0"
              strokeWidth="0.8"
              strokeDasharray="4 5"
            />
            {[
              [91, 96],
              [68, 144],
              [69, 204],
              [111, 224],
              [155, 174],
              [148, 105],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="10" fill="#e05338" fillOpacity="0.2" />
                <circle cx={x} cy={y} r="3" fill="#e7d7bb" />
              </g>
            ))}
          </svg>
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-sand-300">
            Marinduque · Philippines
          </p>
        </div>
      </section>
      <section
        aria-label="Community overview"
        className="my-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {[
          {
            label: "Visible reports",
            value: app.reports.length,
            caption: "Public incidents + your reports",
            icon: MapPin,
          },
          {
            label: "Human-verified",
            value: verified.length,
            caption: "Reviewed by authorized officers",
            icon: ShieldCheck,
          },
          {
            label: "Validated facilities",
            value: sites.length,
            caption: "Confirm availability before travel",
            icon: Building2,
          },
          {
            label: "On-device outbox",
            value: app.outboxCount,
            caption: "Awaiting server acknowledgment",
            icon: CloudUpload,
          },
        ].map(({ label, value, caption, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-sand-200 bg-white p-4 sm:p-5"
          >
            <div className="flex justify-between text-charcoal-500">
              <p className="text-[11px] font-semibold uppercase tracking-wider">
                {label}
              </p>
              <Icon className="h-4 w-4" />
            </div>
            <p className="my-2 font-display text-3xl font-semibold text-marine-900">
              {value.toString().padStart(2, "0")}
            </p>
            <p className="text-[11px] leading-5 text-charcoal-500">{caption}</p>
          </div>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-sand-200 bg-white p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-marine-900">
              Start with what matters
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-charcoal-500">
              Community essentials
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Find facilities",
                text: "Explore the local directory. Candidate sites are clearly marked until LGU validation.",
                icon: Building2,
                tab: "facilities" as const,
              },
              {
                title: "Read official advisories",
                text: "Follow the original agency source. Community reports are kept separate.",
                icon: Radio,
                tab: "advisories" as const,
              },
            ].map(({ title, text, icon: Icon, tab }) => (
              <button
                onClick={() => app.setActiveTab(tab)}
                key={title}
                className="group rounded-xl border border-sand-200 bg-sand-50 p-5 text-left transition hover:border-marine-500"
              >
                <Icon className="mb-5 h-6 w-6 text-marine-700" />
                <h3 className="flex items-center justify-between font-semibold text-marine-900">
                  {title}
                  <ArrowUpRight className="h-4 w-4" />
                </h3>
                <p className="mt-2 text-xs leading-6 text-charcoal-600">
                  {text}
                </p>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-forest-100 bg-forest-50 p-6">
          <Sprout className="mb-5 h-7 w-7 text-forest-700" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest-700">
            Protecting our livelihoods
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-marine-900">
            From farm to shore.
          </h2>
          <p className="mt-3 text-xs leading-6 text-charcoal-600">
            Record crop, boat and fisheries impacts so local officers can assess
            community needs.
          </p>
          <button
            onClick={() => app.setActiveTab("livelihood")}
            className="mt-6 flex items-center gap-2 text-xs font-bold text-forest-700"
          >
            View livelihood reports
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </section>
      </div>
      <p className="mt-6 text-xs leading-6 text-charcoal-500">
        PULSO is a local coordination tool. For immediate danger, contact
        emergency services. Always follow PAGASA, PHIVOLCS, NDRRMC and your
        local government.
      </p>
    </div>
  );
}
