import { WifiOff, CloudUpload, Check, X } from "lucide-react";
import { useApp } from "../context/AppContext";
export function OfflineStatusBar() {
  const app = useApp();
  return (
    <>
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-200 bg-white px-4 py-2 text-xs text-charcoal-600 md:px-8"
      >
        <span className="flex items-center gap-2">
          {app.isOffline ? (
            <WifiOff className="h-3.5 w-3.5 text-amber-700" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          )}
          {app.isOffline
            ? "Offline · cached information may be outdated"
            : app.backendConfigured
              ? "Online · cloud connection configured"
              : "Local mode · cloud connection not configured"}
        </span>
        {app.outboxCount > 0 ? (
          <button
            onClick={() => void app.syncNow()}
            disabled={app.isOffline || app.isSyncing}
            className="flex items-center gap-1.5 font-semibold text-marine-900 disabled:opacity-60"
          >
            <CloudUpload className="h-4 w-4" />
            {app.outboxCount} saved on device —{" "}
            {app.isSyncing ? "syncing…" : "waiting to sync"}
          </button>
        ) : (
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Outbox empty
          </span>
        )}
      </div>
      {app.syncError && (
        <p
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 md:px-8"
        >
          {app.syncError}
        </p>
      )}
      {app.activeToast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-[90] mx-4 flex max-w-md items-start gap-3 rounded-xl border border-sand-300 bg-marine-900 p-4 text-sm text-white shadow-xl"
        >
          <span>{app.activeToast}</span>
          <button
            onClick={app.clearToast}
            aria-label="Dismiss notification"
            className="rounded p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
