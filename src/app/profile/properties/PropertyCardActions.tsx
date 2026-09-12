'use client';

import { useTransition } from "react";
import Link from "next/link";
import { togglePropertyStatus, deleteProperty } from "./actions";
import { Pause, Play, Trash2, Edit3, ExternalLink } from "lucide-react";

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
    <div className="flex items-center space-x-2 mt-4 pt-4 border-t flex-wrap gap-2">
      {/* View Dedicated Flat Page */}
      <Link
        href={`/flat/${propertyId}`}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
      >
        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
        <span>View Listing</span>
      </Link>

      {/* Edit Property Details */}
      <Link
        href={`/list-property?edit=${propertyId}`}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-brand-primary/30 bg-brand-primary/10 hover:bg-brand-primary/15 text-brand-primary font-medium"
      >
        <Edit3 className="h-3.5 w-3.5" />
        <span>Edit</span>
      </Link>

      {/* Pause / Resume status toggle */}
      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
          status === 'active' 
            ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700" 
            : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
        } disabled:opacity-50`}
      >
        {status === 'active' ? (
          <>
            <Pause className="h-3.5 w-3.5" />
            <span>Pause Listing</span>
          </>
        ) : status === 'pending_owner_approval' ? (
          <>
            <Play className="h-3.5 w-3.5" />
            <span>Approve & Activate</span>
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            <span>Resume Listing</span>
          </>
        )}
      </button>

      {/* Remove Listing */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-700" />
        <span className="text-red-700 font-semibold">Remove</span>
      </button>
    </div>
  );
}
