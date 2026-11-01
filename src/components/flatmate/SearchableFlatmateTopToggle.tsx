'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  getPotentialFlatmateStatusAction,
  toggleFlatmateSearchableAction,
} from '@/app/actions/potentialFlatmate';
import PotentialFlatmateModal from './PotentialFlatmateModal';

export default function SearchableFlatmateTopToggle({
  sourcePage = 'flats',
}: {
  sourcePage?: 'flats' | 'flatmates';
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchable, setIsSearchable] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    getPotentialFlatmateStatusAction().then((res) => {
      if (isMounted) {
        setIsSearchable(res.isSearchable);
        setIsLoadingStatus(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('flatmate_is_searchable', res.isSearchable ? 'true' : 'false');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [status]);

  const handleToggle = () => {
    if (status !== 'authenticated') {
      // Open the modal for explanation and login CTA
      setIsModalOpen(true);
      return;
    }

    const nextState = !isSearchable;
    setIsSearchable(nextState);

    startTransition(async () => {
      const res = await toggleFlatmateSearchableAction(nextState);
      if (res?.error) {
        // Revert on error
        setIsSearchable(!nextState);
        showToast(`Error: ${res.error}`);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('flatmate_is_searchable', nextState ? 'true' : 'false');
        }
        showToast(
          nextState
            ? 'Your profile is now visible to other flat-seekers!'
            : 'Your profile is now hidden from flatmate search.'
        );
      }
    });
  };

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl ring-1 ring-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Minimal Top Toggle Container */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-200/80 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-4">
        {/* Left: Headline & Description */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 leading-tight">
                Want flatmates to find you?
              </span>
              {isSearchable ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Visible</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                  Hidden
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Mark your profile searchable so verified flat-seekers can connect directly.
            </p>
          </div>
        </div>

        {/* Right: Toggle Switch & Quick Links */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {/* Quick Setup Preferences trigger */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-emerald-100/50"
            title="Setup Target Locality & Budget"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-400 hover:text-emerald-600" />
            <span className="hidden md:inline">Quick Setup</span>
          </button>

          <Link
            href="/profile/roommate"
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hidden lg:inline-flex items-center gap-1"
            title="Roommate Settings"
          >
            <span>Settings</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          {/* Toggle Switch */}
          <div className="flex items-center gap-2 pl-1 border-l border-emerald-200">
            <span className="text-[11px] font-bold text-slate-700">
              {isSearchable ? 'Searchable' : 'Off'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSearchable}
                onChange={handleToggle}
                disabled={isPending || isLoadingStatus}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Highlighted Popup Modal */}
      <PotentialFlatmateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sourcePage={sourcePage}
      />
    </>
  );
}
