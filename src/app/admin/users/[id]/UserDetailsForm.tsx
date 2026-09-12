'use client';

import React, { useState, useTransition } from "react";
import { adminUpdateFullUser } from "../actions";
import {
  User, Phone, Mail, Shield, CheckCircle2, AlertTriangle,
  Info, Save, Check, Sparkles, Tag, Calendar, Heart
} from "lucide-react";

export interface UserDetailData {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
  role: string;
  verificationStatus: string;
  rejectionReason?: string;
  rejectedAt?: string;
  reverificationRequestMessage?: string;
  reverificationRequestedAt?: string;
  gender?: string;
  age?: number;
  profession?: string;
  bio?: string;
  isFlatmateSearchable?: boolean;
  hobbies?: string[];
  flatPreferences?: string[];
  vibePreferences?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function UserDetailsForm({
  user,
  canEdit,
}: {
  user: UserDetailData;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(user.verificationStatus || 'pending');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await adminUpdateFullUser(user._id, formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("User details updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800 text-xs">
          <Info className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>
            <strong>Read-only mode:</strong> Support agents can inspect user profiles and properties, but cannot modify records.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center space-x-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <User className="h-4 w-4 mr-2 text-brand-primary" />
                Account Credentials & Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={user.name || ""}
                    disabled={!canEdit || isPending}
                    required
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full text-xs font-medium border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={user.phone}
                    disabled={!canEdit || isPending}
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full text-xs font-mono font-medium border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={user.email || ""}
                    disabled={!canEdit || isPending}
                    placeholder="e.g. rajesh@example.com"
                    className="w-full text-xs font-medium border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Profession */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Profession / Occupation
                  </label>
                  <input
                    type="text"
                    name="profession"
                    defaultValue={user.profession || ""}
                    disabled={!canEdit || isPending}
                    placeholder="e.g. Software Engineer, Student"
                    className="w-full text-xs font-medium border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    min="18"
                    max="100"
                    defaultValue={user.age || ""}
                    disabled={!canEdit || isPending}
                    placeholder="e.g. 26"
                    className="w-full text-xs font-medium border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    defaultValue={user.gender || ""}
                    disabled={!canEdit || isPending}
                    className="w-full text-xs font-medium border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Profile Bio & Introduction
                </label>
                <textarea
                  name="bio"
                  defaultValue={user.bio || ""}
                  disabled={!canEdit || isPending}
                  rows={3}
                  placeholder="Short description of the user..."
                  className="w-full text-xs font-medium border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 resize-none"
                />
              </div>

              {/* Flatmate Searchable toggle */}
              <div className="pt-2 border-t flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Flatmate Discoverability</p>
                  <p className="text-[11px] text-slate-500">Allow this profile to appear in tenant flatmate seekers search.</p>
                </div>
                <select
                  name="isFlatmateSearchable"
                  defaultValue={user.isFlatmateSearchable ? "true" : "false"}
                  disabled={!canEdit || isPending}
                  className="text-xs border rounded-lg px-3 py-1.5 bg-slate-50 outline-brand-primary font-semibold"
                >
                  <option value="true">Enabled (Searchable)</option>
                  <option value="false">Disabled (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Read-Only Lifestyle & Preferences Tags */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Heart className="h-4 w-4 mr-2 text-brand-primary" />
                Declared Habits & Preferences
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Hobbies & Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.hobbies && user.hobbies.length > 0 ? (
                      user.hobbies.map((h, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {h}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No hobbies selected</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Flatmate Preferences</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.flatPreferences && user.flatPreferences.length > 0 ? (
                      user.flatPreferences.map((p, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-medium border border-indigo-100">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No flat preferences declared</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Living Vibe</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.vibePreferences && user.vibePreferences.length > 0 ? (
                      user.vibePreferences.map((v, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-100">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No vibe preferences declared</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Roles, Verification & Metadata */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Shield className="h-4 w-4 mr-2 text-brand-primary" />
                Access & Security Control
              </h3>

              {/* Account Role */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Account Role
                </label>
                <select
                  name="role"
                  defaultValue={user.role}
                  disabled={!canEdit || isPending}
                  className="w-full text-xs font-semibold border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary focus:bg-white disabled:bg-slate-100"
                >
                  <option value="user">User / Tenant</option>
                  <option value="owner">Owner / Landlord</option>
                  <option value="tester">Tester</option>
                  <option value="ops_admin">Ops Admin</option>
                  <option value="support_agent">Support Agent</option>
                  <option value="moderator">Moderator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* User Reverification Request Notice */}
              {user.reverificationRequestMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-blue-800">
                    <Info className="h-3.5 w-3.5" />
                    <span>User Requested Re-verification</span>
                  </div>
                  <p className="text-[11px] text-blue-700 italic bg-white/70 p-2 rounded border border-blue-100">
                    "{user.reverificationRequestMessage}"
                  </p>
                  {user.reverificationRequestedAt && (
                    <p className="text-[10px] text-blue-500">
                      Requested: {new Date(user.reverificationRequestedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Verification Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Verification Status
                </label>
                <select
                  name="verificationStatus"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={!canEdit || isPending}
                  className="w-full text-xs font-semibold border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary focus:bg-white disabled:bg-slate-100"
                >
                  <option value="pending">Pending Review</option>
                  <option value="verified">Verified Account</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Rejection Reason (Mandatory when Rejected) */}
              {selectedStatus === 'rejected' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-[10px] font-bold text-red-600 uppercase tracking-wider">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="rejectionReason"
                    defaultValue={user.rejectionReason || ""}
                    disabled={!canEdit || isPending}
                    required
                    rows={2}
                    placeholder="Provide reason for rejecting this user (mandatory, visible to user)..."
                    className="w-full text-xs font-medium border border-red-200 rounded-lg px-3 py-2 outline-brand-primary bg-red-50/40 focus:bg-white resize-none"
                  />
                  <p className="text-[10px] text-red-500">
                    Active listings owned by this user will automatically be set to paused upon rejection.
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-3 border-t space-y-2 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <code className="font-mono text-slate-700">{user._id}</code>
                </div>
                {user.createdAt && (
                  <div className="flex justify-between">
                    <span>Registered:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(user.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                    </span>
                  </div>
                )}
                {user.updatedAt && (
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(user.updatedAt).toLocaleDateString([], { dateStyle: "medium" })}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {canEdit && (
                <div className="pt-3 border-t">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isPending ? "Saving Changes..." : "Save Profile Details"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
