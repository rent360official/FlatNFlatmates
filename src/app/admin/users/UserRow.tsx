'use client';

import { useTransition } from "react";
import { adminUpdateUserVerification, adminUpdateUserRole } from "./actions";
import { Shield, CheckCircle, AlertTriangle, ShieldAlert, FlaskConical } from "lucide-react";

export default function UserRow({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();

  const handleVerificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as 'pending' | 'verified' | 'rejected';
    startTransition(async () => {
      const res = await adminUpdateUserVerification(user._id, status);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
          <span className="inline-flex items-center space-x-1 bg-bg-status-successBg/15 text-brand-primary px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
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
      <td className="py-3 px-4 font-bold text-slate-800">
        {user.name || "N/A"}
      </td>
      <td className="py-3 px-4">
        {user.phone}
      </td>
      <td className="py-3 px-4">
        {user.email || <span className="text-slate-400">N/A</span>}
      </td>
      <td className="py-3 px-4">
        {getRoleBadge(user.role)}
      </td>
      <td className="py-3 px-4">
        {getVerificationBadge(user.verificationStatus)}
      </td>
      <td className="py-3 px-4 flex items-center space-x-2">
        <select 
          value={user.role} 
          onChange={handleRoleChange}
          className="border rounded text-[11px] px-2 py-1 bg-white outline-none cursor-pointer"
        >
          <option value="user">User</option>
          <option value="owner">Owner</option>
          <option value="tester">Tester</option>
          <option value="ops_admin">Ops Admin</option>
          <option value="support_agent">Support Agent</option>
          <option value="moderator">Moderator</option>
        </select>
        <select 
          value={user.verificationStatus} 
          onChange={handleVerificationChange}
          className="border rounded text-[11px] px-2 py-1 bg-white outline-none cursor-pointer"
        >
          <option value="pending">Pending</option>
          <option value="verified">Verify</option>
          <option value="rejected">Reject</option>
        </select>
      </td>
    </tr>
  );
}
