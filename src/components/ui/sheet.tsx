import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export function SheetContent({ children }: { children: ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[60] bg-marine-900/60 backdrop-blur-sm md:hidden" />
      <Dialog.Content className="fixed inset-y-0 left-0 z-[65] w-[min(85vw,19rem)] overflow-y-auto bg-marine-900 p-5 text-white shadow-2xl md:hidden">
        <Dialog.Title className="font-display text-xl font-bold">
          PULSO navigation
        </Dialog.Title>
        <Dialog.Description className="mt-1 text-xs text-sand-300">
          Community preparedness for Marinduque.
        </Dialog.Description>
        <Dialog.Close
          aria-label="Close navigation"
          className="absolute right-3 top-3 rounded p-2 focus-visible:ring-2 focus-visible:ring-coral-500"
        >
          <X className="h-5 w-5" />
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
