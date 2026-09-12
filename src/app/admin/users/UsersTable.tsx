'use client';

import React, { useState, useMemo } from "react";
import UserRow from "./UserRow";
import { Search, Filter, Users } from "lucide-react";

export interface UserItem {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
  role: string;
  verificationStatus: string;
  createdAt?: string;
}

export default function UsersTable({
  users,
  canEdit = true,
}: {
  users: UserItem[];
  canEdit?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesVerification =
        verificationFilter === "all" || u.verificationStatus === verificationFilter;

      return matchesSearch && matchesRole && matchesVerification;
    });
  }, [users, searchQuery, roleFilter, verificationFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
          <Users className="mr-2 h-4 w-4 text-brand-primary" />
          Registered Accounts ({users.length} Total)
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">
          Showing {filteredUsers.length} matching {filteredUsers.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center space-x-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Roles</option>
              <option value="user">User / Tenant</option>
              <option value="owner">Owner / Landlord</option>
              <option value="tester">Tester</option>
              <option value="ops_admin">Ops Admin</option>
              <option value="support_agent">Support Agent</option>
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Verifications</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== "all" || verificationFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setVerificationFilter("all");
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-brand-primary hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 border-b">
            <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Name</th>
              <th className="py-2.5 px-4">Phone</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Role</th>
              <th className="py-2.5 px-4">Verification</th>
              <th className="py-2.5 px-4">Role & Status</th>
              <th className="py-2.5 px-4 text-right">Inspect & Manage</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedUsers.map((u) => (
              <UserRow key={u._id} user={u} canEdit={canEdit} />
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                  {users.length === 0
                    ? "No users onboarded yet."
                    : "No users match the search and filter criteria."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
            >
              Previous
            </button>
            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
