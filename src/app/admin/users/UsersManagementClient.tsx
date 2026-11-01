'use client';

import React, { useState, useTransition } from "react";
import UsersTable, { UserItem } from "./UsersTable";
import PropertiesTable, { PropertyGridItem } from "./PropertiesTable";
import { adminCreateUser } from "./actions";
import {
  UserPlus,
  X,
  Shield,
  Plus,
  Check,
  Info,
  Users,
  Building2,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function UsersManagementClient({
  users,
  properties = [],
  localities = [],
  canEdit = true,
  initialView = 'user',
  appBaseUrl = '',
  messageTemplate = '',
}: {
  users: UserItem[];
  properties?: PropertyGridItem[];
  localities?: { _id: string; name: string }[];
  canEdit?: boolean;
  initialView?: 'user' | 'property';
  appBaseUrl?: string;
  messageTemplate?: string;
}) {
  const [activeView, setActiveView] = useState<'user' | 'property'>(initialView);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pendingApprovalsCount = properties.filter(
    (p) => p.status === 'pending_owner_approval'
  ).length;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const formElement = e.currentTarget;

    startTransition(async () => {
      const res = await adminCreateUser(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("User onboarded successfully!");
        formElement.reset();
        setTimeout(() => {
          setIsOnboardOpen(false);
          setSuccessMessage(null);
        }, 1200);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Module Title & View Switcher Toggle/Dropdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Backoffice Ops
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-500">
              {users.length} Users · {properties.length} Properties
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Users & Prop Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Switch between user account records and the centralized properties repository. Inspect portfolios, manage verification, and review listing statuses.
          </p>
        </div>

        {/* View Switcher: Segmented Pill Toggle (Desktop) & Select Dropdown (Mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Segmented Toggle Control */}
          <div className="hidden sm:inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveView('user')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'user'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className={`h-4 w-4 ${activeView === 'user' ? 'text-brand-primary' : 'text-slate-400'}`} />
              <span>Users</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeView === 'user' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-200 text-slate-600'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('property')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'property'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className={`h-4 w-4 ${activeView === 'property' ? 'text-brand-primary' : 'text-slate-400'}`} />
              <span>Properties</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeView === 'property' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-200 text-slate-600'
              }`}>
                {properties.length}
              </span>
            </button>
          </div>

          {/* Mobile Dropdown View Switcher */}
          <div className="sm:hidden">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Select Active View
            </label>
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as 'user' | 'property')}
              className="w-full text-xs font-bold border rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="user">User View ({users.length} Users)</option>
              <option value="property">Property View ({properties.length} Properties)</option>
            </select>
          </div>

          {/* Primary View Action Button */}
          {activeView === 'user' ? (
            canEdit && (
              <button
                onClick={() => {
                  setIsOnboardOpen(!isOnboardOpen);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                <UserPlus className="h-4 w-4" />
                <span>Onboard User</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-2">
              {pendingApprovalsCount > 0 && (
                <Link
                  href="/admin/pending-approvals"
                  className="bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl px-3.5 py-2 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                >
                  <Clock className="h-3.5 w-3.5 text-violet-600" />
                  <span>Approvals ({pendingApprovalsCount})</span>
                </Link>
              )}
              <Link
                href="/list-property"
                target="_blank"
                className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Property</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Onboard User Modal (Only used in User view) */}
      {isOnboardOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Onboard User (On-Behalf)</h3>
                  <p className="text-[11px] text-slate-500">Create a verified account on behalf of a landlord or tenant.</p>
                </div>
              </div>
              <button
                onClick={() => setIsOnboardOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center space-x-1.5 font-semibold">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. rajesh@example.com"
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Account Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  required
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary focus:bg-white"
                >
                  <option value="owner">Owner / Landlord</option>
                  <option value="user">User / Roommate Seeker</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOnboardOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-5 py-2 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isPending ? (
                    <span>Onboarding...</span>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Onboard Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area based on Active View (User or Property) */}
      <div className="w-full">
        {activeView === 'user' ? (
          <UsersTable users={users} canEdit={canEdit} />
        ) : (
          <PropertiesTable
            properties={properties}
            localities={localities}
            appBaseUrl={appBaseUrl}
            messageTemplate={messageTemplate}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
}
