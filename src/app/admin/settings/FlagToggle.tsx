'use client';

import { useTransition } from "react";
import { toggleFeatureFlag } from "./actions";

export default function FlagToggle({ flag }: { flag: any }) {
  const [isPending, startTransition] = useTransition();

  // Support both legacy value field and new status field
  const isEnabled = flag.status === 'enabled' || (flag.status === undefined && flag.value === true);

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleFeatureFlag(flag._id, isEnabled);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        isEnabled ? "bg-brand-primary" : "bg-slate-200"
      } ${isPending ? "opacity-50 pointer-events-none" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isEnabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
