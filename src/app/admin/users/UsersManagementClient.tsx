'use client';

import React, { useState, useTransition } from "react";
import UsersTable, { UserItem } from "./UsersTable";
import { adminCreateUser } from "./actions";
import { UserPlus, X, Shield, Plus, Check, Info } from "lucide-react";

export default function UsersManagementClient({
  users,
  canEdit = true,
}: {
  users: UserItem[];
  canEdit?: boolean;
}) {
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      {/* Title & Top Right Onboard Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Profiles & Onboarding Control</h2>
          <p className="text-xs text-slate-500">
            Inspect registered users, onboard landlords/tenants on their behalf, and inspect access privileges or property portfolios.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-2">
          {!canEdit && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center space-x-1">
              <Info className="h-3.5 w-3.5" />
              <span>Read-only Mode</span>
            </span>
          )}
          {canEdit && (
            <button
              onClick={() => {
                setIsOnboardOpen(!isOnboardOpen);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>Onboard user</span>
            </button>
          )}
        </div>
      </div>

      {/* Onboard User Modal / Collapsible Drawer */}
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

      {/* Full Width Users List */}
      <div className="w-full">
        <UsersTable users={users} canEdit={canEdit} />
      </div>
    </div>
  );
}
