'use client';

import React, { useTransition } from "react";
import Link from "next/link";
import { adminUpdateUserVerification, adminUpdateUserRole } from "./actions";
import { Shield, CheckCircle, AlertTriangle, ShieldAlert, FlaskConical, User, Home, ExternalLink } from "lucide-react";

export default function UserRow({ user, canEdit = true }: { user: any; canEdit?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleVerificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!canEdit) return;
    const status = e.target.value as 'pending' | 'verified' | 'rejected';
    let rejectionReason: string | undefined = undefined;

    if (status === 'rejected') {
      const reason = window.prompt("Please specify a reason message for rejecting this user (required):");
      if (!reason || !reason.trim()) {
        alert("Action cancelled: A rejection reason is strictly required.");
        e.target.value = user.verificationStatus;
        return;
      }
      rejectionReason = reason.trim();
    }

    startTransition(async () => {
      const res = await adminUpdateUserVerification(user._id, status, rejectionReason);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!canEdit) return;
    const role = e.target.value;
    startTransition(async () => {
      const res = await adminUpdateUserRole(user._id, role);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
            <CheckCircle className="h-3 w-3" />
            <span>Verified</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 bg-brand-secondary/10 text-brand-secondaryHover px-2 py-0.5 rounded text-[10px] font-bold border border-brand-secondary/15">
            <ShieldAlert className="h-3 w-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
            <AlertTriangle className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(role);
    if (isAdmin) {
      return (
        <span className="inline-flex items-center space-x-1 bg-brand-primary/10 text-brand-primaryHover px-2 py-0.5 rounded text-[10px] font-bold border border-brand-primary/15">
          <Shield className="h-3 w-3" />
          <span>{role.replace('_', ' ')}</span>
        </span>
      );
    }
    if (role === 'owner') {
      return (
        <span className="inline-flex items-center bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-[10px] font-bold border border-sky-100">
          Owner
        </span>
      );
    }
    if (role === 'tester') {
      return (
        <span className="inline-flex items-center space-x-1 bg-violet-50 text-violet-700 px-2 py-0.5 rounded text-[10px] font-bold border border-violet-100">
          <FlaskConical className="h-3 w-3" />
          <span>Tester</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center bg-slate-50 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-100">
        User/Tenant
      </span>
    );
  };

  return (
    <tr className={`border-b text-xs text-slate-700 hover:bg-slate-50/50 transition-colors ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Name */}
      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
        {user.name || "N/A"}
      </td>

      {/* Phone */}
      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
        {user.phone}
      </td>

      {/* Email */}
      <td className="py-3 px-4">
        {user.email || <span className="text-slate-400">N/A</span>}
      </td>

      {/* Role */}
      <td className="py-3 px-4 whitespace-nowrap">
        {getRoleBadge(user.role)}
      </td>

      {/* Verification */}
      <td className="py-3 px-4 whitespace-nowrap">
        {getVerificationBadge(user.verificationStatus)}
      </td>

      {/* Quick Controls */}
      <td className="py-3 px-4">
        {canEdit ? (
          <div className="flex items-center space-x-1.5">
            <select 
              value={user.role} 
              onChange={handleRoleChange}
              className="border rounded text-[11px] px-2 py-1 bg-white outline-none cursor-pointer hover:border-slate-300"
              title="Change Account Role"
            >
              <option value="user">User</option>
              <option value="owner">Owner</option>
              <option value="tester">Tester</option>
              <option value="ops_admin">Ops Admin</option>
              <option value="support_agent">Support Agent</option>
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select 
              value={user.verificationStatus} 
              onChange={handleVerificationChange}
              className="border rounded text-[11px] px-2 py-1 bg-white outline-none cursor-pointer hover:border-slate-300"
              title="Change Verification Status"
            >
              <option value="pending">Pending</option>
              <option value="verified">Verify</option>
              <option value="rejected">Reject</option>
            </select>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Read-only</span>
        )}
      </td>

      {/* Navigation Buttons */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center space-x-1.5">
          {/* User Details Link */}
          <Link
            href={`/admin/users/${user._id}`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border rounded-lg hover:bg-slate-50 hover:text-brand-primary transition-colors shadow-xs"
            title="Inspect & Edit User Details"
          >
            <User className="h-3 w-3 text-slate-400" />
            <span>Details</span>
          </Link>

          {/* User Property Details Link */}
          <Link
            href={`/admin/users/${user._id}/properties`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-lg hover:bg-brand-primary/15 transition-colors shadow-xs"
            title="View User Properties & Analytics"
          >
            <Home className="h-3 w-3 text-brand-primary" />
            <span>Properties</span>
          </Link>
        </div>
      </td>
    </tr>
  );
}
