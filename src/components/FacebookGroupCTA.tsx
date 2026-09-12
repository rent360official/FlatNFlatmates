'use client';

import React, { useState } from 'react';
import { Share2, ExternalLink, X, Search, MapPin } from 'lucide-react';

export interface FacebookGroupData {
  _id: string;
  localityId: string;
  localityName: string;
  groupName: string;
  groupUrl: string;
  description?: string;
  memberCount?: string;
}

interface FacebookGroupCTAProps {
  groups: FacebookGroupData[];
  category?: 'flats' | 'flatmates';
  isBlank?: boolean;
  isEmpty?: boolean;
  className?: string;
}

const COPY_CONFIG = {
  flatmates: {
    blank: {
      title: "Your Next Flatmate Is Already Posting on Facebook",
      description: "Skip the empty search. Join Pune's most active flatmate community and get matched today.",
      buttonText: "Join the Community",
    },
    nonBlank: {
      title: "Not Convinced Yet? There's More.",
      description: "Widen your search — our Pune Facebook community adds new flatmates every day.",
      buttonText: "Explore More Options",
    },
  },
  flats: {
    blank: {
      title: "Empty Here Doesn't Mean Empty Everywhere",
      description: "Active flat listings are posted daily in our Facebook community.",
      buttonText: "Find a Flat Now",
    },
    nonBlank: {
      title: "Still Looking? Widen the Net.",
      description: "More flats get posted in our Pune Facebook community every day.",
      buttonText: "Check Facebook Listings",
    },
  },
};

// Facebook Brand SVG Icon
function FacebookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function FacebookGroupCTA({
  groups,
  category = 'flats',
  isBlank = false,
  isEmpty = false,
  className = '',
}: FacebookGroupCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // If no groups are configured/active, do not render anything
  if (!groups || groups.length === 0) {
    return null;
  }

  const isBlankState = isBlank || isEmpty;
  const currentCategory = category === 'flatmates' ? 'flatmates' : 'flats';
  const copy = COPY_CONFIG[currentCategory][isBlankState ? 'blank' : 'nonBlank'];

  const filteredGroups = groups.filter(g =>
    g.localityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Landscape CTA Banner */}
      <div
        className={`col-span-full w-full rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white shadow-sm border border-blue-500/20 relative overflow-hidden transition-all my-2 ${className}`}
      >
        {/* Subtle ambient light */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#1877F2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Title & Description (No micro-pills, no top tags) */}
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white leading-snug">
              {copy.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {copy.description}
            </p>
          </div>

          {/* Right Action Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm group cursor-pointer"
            >
              <FacebookIcon className="h-4 w-4" />
              <span>{copy.buttonText}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Locality Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 font-sans overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b flex items-start justify-between bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[#1877F2]">
                  <FacebookIcon className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-slate-900">Choose Your Pune Locality</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Select a neighborhood to open its dedicated Facebook community group.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            {groups.length > 4 && (
              <div className="p-4 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search locality..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-slate-50 outline-[#1877F2] font-medium"
                  />
                </div>
              </div>
            )}

            {/* Localities List */}
            <div className="p-4 overflow-y-auto divide-y space-y-1 flex-1">
              {filteredGroups.map((grp) => (
                <div
                  key={grp._id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group hover:bg-slate-50/80 -mx-2 px-3 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {grp.localityName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">
                      {grp.groupName}
                    </p>
                    {grp.memberCount && (
                      <span className="inline-block text-[10px] text-slate-400 font-medium">
                        {grp.memberCount}
                      </span>
                    )}
                  </div>

                  <a
                    href={grp.groupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-[#1877F2] text-[#1877F2] hover:text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs flex-shrink-0"
                  >
                    <span>Join</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}

              {filteredGroups.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No Facebook group found matching &ldquo;{searchTerm}&rdquo;.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t flex items-center justify-between text-[11px] text-slate-500">
              <span>Opens directly in a new tab on Facebook</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-semibold text-slate-700 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
