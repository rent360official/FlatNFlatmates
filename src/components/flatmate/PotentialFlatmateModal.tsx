'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Sparkles,
  X,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  Sliders,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import {
  getPotentialFlatmateStatusAction,
  saveQuickPotentialFlatmateAction,
} from '@/app/actions/potentialFlatmate';

const TOP_PUNE_LOCALITIES_FALLBACK = [
  { _id: 'hinjewadi', name: 'Hinjewadi' },
  { _id: 'wakad', name: 'Wakad' },
  { _id: 'baner', name: 'Baner' },
  { _id: 'kharadi', name: 'Kharadi' },
  { _id: 'viman_nagar', name: 'Viman Nagar' },
  { _id: 'koregaon_park', name: 'Koregaon Park' },
  { _id: 'aundh', name: 'Aundh' },
  { _id: 'magarpatta', name: 'Magarpatta' },
  { _id: 'kothrud', name: 'Kothrud' },
  { _id: 'balewadi', name: 'Balewadi' },
];

export default function PotentialFlatmateModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  hasSeenProperties = true,
  sourcePage = 'flats',
}: {
  isOpen?: boolean;
  onClose?: () => void;
  hasSeenProperties?: boolean;
  sourcePage?: 'flats' | 'flatmates';
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Form State
  const [isSearchable, setIsSearchable] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [budgetMax, setBudgetMax] = useState<number>(15000);
  const [userType, setUserType] = useState<'Professional' | 'Student' | 'Retired' | ''>('Professional');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [localitiesList, setLocalitiesList] = useState<{ _id: string; name: string }[]>(TOP_PUNE_LOCALITIES_FALLBACK);

  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-trigger logic with production-level frequency capping
  useEffect(() => {
    // If controlled from parent (e.g. top toggle clicked), skip auto-trigger checks
    if (controlledIsOpen !== undefined) return;

    // 1. Check if user already marked as searchable in localStorage
    if (typeof window !== 'undefined') {
      const alreadySearchable = localStorage.getItem('flatmate_is_searchable') === 'true';
      if (alreadySearchable) return;

      // 2. Check session storage (only once per session)
      const dismissedThisSession = sessionStorage.getItem('dismissed_flatmate_prompt_session') === 'true';
      if (dismissedThisSession) return;

      // 3. Persistent cooldown: Check if dismissed recently (cooldown: 3 days)
      const lastDismissedAt = localStorage.getItem('flatmate_prompt_dismissed_time');
      if (lastDismissedAt) {
        const timeSince = Date.now() - parseInt(lastDismissedAt, 10);
        if (timeSince < 3 * 24 * 60 * 60 * 1000) return; // 3 days
      }

      // 4. Maximum dismissal count check (max 3 times ever)
      const dismissCount = parseInt(localStorage.getItem('flatmate_prompt_dismiss_count') || '0', 10);
      if (dismissCount >= 3) return;
    }

    // Auto-trigger delay: 4.5 seconds after page load & seeing properties
    const timer = setTimeout(() => {
      // Check server status before displaying
      getPotentialFlatmateStatusAction().then((res) => {
        if (res.isSearchable) {
          // Already marked as searchable in DB! Do not disturb.
          if (typeof window !== 'undefined') {
            localStorage.setItem('flatmate_is_searchable', 'true');
          }
          return;
        }

        if (res.localities && res.localities.length > 0) {
          setLocalitiesList(res.localities);
        }

        if (res.user) {
          if (res.user.targetLocations && res.user.targetLocations.length > 0) {
            setSelectedLocations(res.user.targetLocations);
          }
          if (res.user.budgetMax) {
            setBudgetMax(res.user.budgetMax);
          }
          if (res.user.userType) {
            setUserType(res.user.userType as any);
          }
          if (res.user.gender) {
            setGender(res.user.gender as any);
          }
        }

        setInternalIsOpen(true);
      });
    }, 4500);

    return () => clearTimeout(timer);
  }, [controlledIsOpen, hasSeenProperties]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dismissed_flatmate_prompt_session', 'true');
      localStorage.setItem('flatmate_prompt_dismissed_time', Date.now().toString());
      const count = parseInt(localStorage.getItem('flatmate_prompt_dismiss_count') || '0', 10);
      localStorage.setItem('flatmate_prompt_dismiss_count', (count + 1).toString());
    }

    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleLocationToggle = (locId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'authenticated') {
      // Redirect to login with callback
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await saveQuickPotentialFlatmateAction({
        isSearchable,
        targetLocations: selectedLocations,
        budgetMax,
        userType,
        gender: gender || undefined,
      });

      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setIsSuccess(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('flatmate_is_searchable', isSearchable ? 'true' : 'false');
        }
        setTimeout(() => {
          handleClose();
          setIsSuccess(false);
        }, 1800);
      }
    });
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-primary p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shrink-0 shadow-inner">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-100 bg-white/15 px-2.5 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>Pune Flatmate Connect</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1 leading-tight">
                Mark Yourself as a Potential Flatmate
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Success Banner */}
          {isSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">
                You are now discoverable in Pune!
              </h4>
              <p className="text-xs text-emerald-700 max-w-xs mx-auto">
                Verified flat-seekers and room providers can now see your preferences and reach out directly with 0 brokerage.
              </p>
            </div>
          ) : status !== 'authenticated' ? (
            /* Unauthenticated View: Explains perks and directs to Login */
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-xs">
                You&apos;ve been browsing flats in Pune! Make your profile visible as a <strong>Potential Flatmate</strong> so verified flatmates and room providers can approach you directly with matching rooms.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Zero Middleman Brokerage</span>
                    <p className="text-[11px] text-slate-500">Connect directly with roommates and flat owners with shared lease options.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Locality-Specific Matches</span>
                    <p className="text-[11px] text-slate-500">Get discovered by people targeting your exact IT corridors and hubs.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Privacy Protected</span>
                    <p className="text-[11px] text-slate-500">Only verified users can see your listing and connect.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl text-center shadow-lg shadow-emerald-600/25 transition active:scale-[0.99] text-xs flex items-center justify-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Login to Mark Yourself as Searchable</span>
                </Link>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold py-1.5 transition text-center"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated View: Essential Minimal Fields + Submit */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {errorMessage}
                </div>
              )}

              {/* 1. Discoverability Switch */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <span>Flatmate Discoverability</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80">
                    Show your profile to other flat-seekers searching in Pune
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSearchable}
                    onChange={(e) => setIsSearchable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* 2. Target Localities Chips (Essential) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                  <span>Where in Pune are you looking to stay?</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                  {localitiesList.slice(0, 14).map((loc) => {
                    const isSelected = selectedLocations.includes(loc._id);
                    return (
                      <button
                        key={loc._id}
                        type="button"
                        onClick={() => handleLocationToggle(loc._id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {loc.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400">Select 1 or more preferred neighborhoods</p>
              </div>

              {/* 3. Max Monthly Budget (Essential) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Maximum Monthly Budget
                  </label>
                  <span className="font-extrabold text-sm text-emerald-700">
                    ₹{budgetMax.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10000, 15000, 20000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBudgetMax(amt)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        budgetMax === amt
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ₹{(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Profession / User Type & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    I am a
                  </label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as any)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:bg-white outline-brand-primary"
                  >
                    <option value="Professional">Working Professional</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:bg-white outline-brand-primary"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition active:scale-[0.99] disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Preferences...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{isSearchable ? 'Confirm & Mark Me Searchable' : 'Save Preferences'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-slate-400 hover:text-slate-600 text-[11px] font-semibold py-1 transition text-center"
                >
                  Dismiss for now
                </button>
              </div>
            </form>
          )}

          {/* Bottom Button (Requested: Link to Roommate Settings / /profile/roommate page) */}
          <div className="pt-3 border-t border-slate-200">
            <Link
              href="/profile/roommate"
              onClick={handleClose}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition group text-xs"
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-primary group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="font-bold text-slate-800 block">Roommate Settings (/profile/roommate)</span>
                  <span className="text-[10px] text-slate-400">Configure deep lifestyle habits, sleep, food & clean vibes</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
