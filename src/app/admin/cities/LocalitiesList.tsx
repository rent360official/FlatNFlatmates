'use client';

import React, { useState, useMemo } from "react";
import { MapPin, Trash2, Search } from "lucide-react";
import { deleteLocality } from "./actions";

export interface LocalityItem {
  _id: string;
  name: string;
  cityName?: string;
  lat: number;
  lng: number;
}

export default function LocalitiesList({ localities }: { localities: LocalityItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredLocalities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return localities;
    return localities.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        (loc.cityName && loc.cityName.toLowerCase().includes(q))
    );
  }, [localities, searchQuery]);

  const totalPages = Math.ceil(filteredLocalities.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLocalities.slice(start, start + pageSize);
  }, [filteredLocalities, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
          Localities ({localities.length})
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">
          {filteredLocalities.length} found
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter localities or cities..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 overflow-y-auto max-h-[320px] pr-1">
        {paginated.map((loc) => (
          <div key={loc._id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
            <div>
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                <p className="text-xs font-bold text-slate-800">{loc.name}</p>
              </div>
              <span className="text-[10px] text-slate-400">
                City: {loc.cityName || "N/A"} | [{loc.lat}, {loc.lng}]
              </span>
            </div>
            <form action={deleteLocality.bind(null, loc._id) as any}>
              <button
                type="submit"
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5"
                title="Delete Locality"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}

        {paginated.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            {localities.length === 0 ? "No localities created yet." : "No matching localities found."}
          </div>
        )}
      </div>

      {/* Mini Pagination */}
      {totalPages > 1 && (
        <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border rounded bg-white disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
