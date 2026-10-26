import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "./ui/button";

export function PwaUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-50 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-300 bg-white p-4 shadow-xl md:left-72"
    >
      <p className="text-sm text-marine-900">
        A PULSO update is available. Save your current report before updating.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => void updateServiceWorker(true)}>
          Update app
        </Button>
        <Button variant="outline" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
      </div>
    </div>
  );
}
