import { SystemNotice } from "./SystemNotice";
import { useState } from "react";
import { ShieldCheck, Backpack, Smartphone } from "lucide-react";
const items = [
  "Prepare drinking water and ready-to-eat food for your household.",
  "Pack essential medicines, first aid supplies and copies of important documents.",
  "Keep a flashlight, radio, power bank and spare batteries ready.",
  "Agree on a family meeting point and an accessible evacuation route.",
  "Check the needs of children, older people, persons with disabilities and pets.",
  "Secure farm equipment and fishing gear; follow PCG and official sea-travel instructions.",
];
export function Preparedness() {
  const [checked, setChecked] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("pulso-preparedness") || "[]");
    } catch {
      return [];
    }
  });
  const [installHelp, setInstallHelp] = useState(false);
  return (
    <div className="page-shell max-w-4xl">
      <p className="eyebrow">Before the next emergency</p>
      <SystemNotice name="preparedness_notice" />
      <h1 className="page-title">Small steps. Stronger communities.</h1>
      <p className="page-description">
        A household checklist for Marinduque. Adapt it to your needs and follow
        local government instructions.
      </p>
      <section className="mt-7 rounded-xl border border-sand-200 bg-white p-6">
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl text-marine-900">
          <Backpack className="h-5 w-5" />
          Your readiness checklist
        </h2>
        <div className="divide-y divide-sand-200">
          {items.map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-start gap-3 py-4 text-sm leading-6"
            >
              <input
                className="mt-1 h-4 w-4 accent-forest-700"
                type="checkbox"
                checked={checked.includes(item)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...checked, item]
                    : checked.filter((x) => x !== item);
                  setChecked(next);
                  try {
                    localStorage.setItem(
                      "pulso-preparedness",
                      JSON.stringify(next),
                    );
                  } catch {}
                }}
              />
              {item}
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-charcoal-500">
          Saved on this device · {checked.length} of {items.length} complete
        </p>
      </section>
      <section className="mt-5 rounded-xl border border-marine-100 bg-marine-50 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-marine-900">
          <Smartphone className="h-5 w-5" />
          Keep PULSO on your home screen
        </h2>
        <p className="mt-2 text-sm leading-6">
          Open PULSO online once to cache the application. Offline reports stay
          on your device and sync after you sign in and reconnect. Map tiles and
          live agency updates require internet access.
        </p>
        <button
          className="mt-4 text-sm font-bold underline"
          aria-expanded={installHelp}
          onClick={() => setInstallHelp(!installHelp)}
        >
          Installation instructions
        </button>
        {installHelp && (
          <p className="mt-3 text-sm leading-6">
            Android: use your browser menu → Install app or Add to Home screen.
            iPhone/iPad: open in Safari → Share → Add to Home Screen.
            Installable production deployments require HTTPS.
          </p>
        )}
      </section>
      <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-charcoal-600">
        <ShieldCheck className="mt-1 h-4 w-4 shrink-0" />
        Check official sources for current warnings. This checklist is general
        preparedness guidance, not an evacuation order.
      </p>
    </div>
  );
}
