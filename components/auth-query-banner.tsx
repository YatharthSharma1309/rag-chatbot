"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

function BannerInner() {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const authErr = params.get("auth_error");
    const expired = params.get("expired_reset");
    if (authErr) {
      setText("Sign-in could not be completed. The link may have expired — try again.");
      setOpen(true);
    } else if (expired) {
      setText("Your reset session is invalid or expired. Request a new reset link.");
      setOpen(true);
    }
  }, [params]);

  if (!open || !text) return null;

  return (
    <div className="border-b border-amber-500/35 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-950 dark:text-amber-100">
      <div className="container relative flex items-center justify-center gap-3">
        <p>{text}</p>
        <button
          type="button"
          className="rounded p-1 text-amber-900/70 hover:bg-amber-500/20 dark:text-amber-50/80"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AuthQueryBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  );
}
