'use client';

import React, { useState, useMemo } from "react";
import { Landmark, Building, GraduationCap, Compass, Trash2, Search } from "lucide-react";
import { deletePOI } from "./actions";

export interface POIItem {
  _id: string;
  name: string;
  type: string;
  localityName?: string;
  cityName?: string;
  lat: number;
  lng: number;
}

export default function POIList({ pois }: { pois: POIItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const getPoiIcon = (type: string) => {
    switch (type) {
      case 'college': return <GraduationCap className="h-3.5 w-3.5 text-brand-primary" />;
      case 'office': return <Building className="h-3.5 w-3.5 text-sky-500" />;
      case 'transit': return <Compass className="h-3.5 w-3.5 text-brand-primary" />;
      default: return <Landmark className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const filteredPOIs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pois;
    return pois.filter(
      (poi) =>
        poi.name.toLowerCase().includes(q) ||
        (poi.localityName && poi.localityName.toLowerCase().includes(q)) ||
        poi.type.toLowerCase().includes(q)
    );
  }, [pois, searchQuery]);

  const totalPages = Math.ceil(filteredPOIs.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPOIs.slice(start, start + pageSize);
  }, [filteredPOIs, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
          Points of Interest ({pois.length})
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">
          {filteredPOIs.length} found
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter landmarks, colleges, offices..."
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
        {paginated.map((poi) => (
          <div key={poi._id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
            <div>
              <div className="flex items-center space-x-1.5">
                {getPoiIcon(poi.type)}
                <p className="text-xs font-bold text-slate-800 leading-tight">{poi.name}</p>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                Locality: {poi.localityName || "Generic"} | Cat: {poi.type} | [{poi.lat}, {poi.lng}]
              </span>
            </div>
            <form action={deletePOI.bind(null, poi._id) as any}>
              <button
                type="submit"
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 flex-shrink-0"
                title="Delete POI"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}

        {paginated.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            {pois.length === 0 ? "No POIs created yet." : "No matching POIs found."}
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
