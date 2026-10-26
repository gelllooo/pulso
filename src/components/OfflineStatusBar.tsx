import React from 'react';
import { useApp } from '../context/AppContext';
import { WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';

export const OfflineStatusBar: React.FC = () => {
  const { isOffline, isSimulatedOffline, outboxCount, isSyncing, syncNow, activeToast, clearToast } = useApp();

  return (
    <>
      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-marine-900 border border-coral-500/80 text-white px-4 py-3 rounded-lg shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{activeToast}</span>
          </div>
          <button onClick={clearToast} className="ml-3 text-sand-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isOffline && (
        <div className="bg-amber-600/90 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 shrink-0 text-white" />
            <span>
              <strong>You are offline.</strong>{isSimulatedOffline ? ' Demo mode.' : ''} Reports will be saved on this device.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {outboxCount > 0 ? (
              <span className="bg-amber-800 text-amber-100 font-bold px-2 py-0.5 rounded text-[11px]">
                {outboxCount} report{outboxCount > 1 ? 's' : ''} waiting to send
              </span>
            ) : (
              <span className="text-amber-100 text-[11px]">Nothing waiting to send</span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
