'use client';

import { useTransition } from "react";
import { togglePropertyStatus, deleteProperty } from "./actions";
import { Pause, Play, Trash2 } from "lucide-react";

export default function PropertyCardActions({ propertyId, status }: { propertyId: string, status: string }) {
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = () => {
    startTransition(async () => {
      const res = await togglePropertyStatus(propertyId, status);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to remove this listing?")) return;
    startTransition(async () => {
      const res = await deleteProperty(propertyId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="flex items-center space-x-2 mt-4 pt-4 border-t flex-wrap gap-y-2">
      <button
        onClick={handleToggleStatus}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
          status === 'active' 
            ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700" 
            : "border-emerald-200 bg-status-successBg/15 hover:bg-emerald-100 text-brand-primary"
        } disabled:opacity-50`}
      >
        {status === 'active' ? (
          <>
            <Pause className="h-3.5 w-3.5" />
            <span>Pause Listing</span>
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            <span>Resume Listing</span>
          </>
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/15 text-brand-secondaryHover disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Remove</span>
      </button>
    </div>
  );
}
