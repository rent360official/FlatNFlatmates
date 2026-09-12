import dbConnect from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
import VibeUpgradeRequest from "@/models/VibeUpgradeRequest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import UserDetailsForm from "./UserDetailsForm";
import Link from "next/link";
import { ArrowLeft, Home, Sparkles, User as UserIcon, Building2 } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const adminRole = (session?.user as any)?.role || "";
  const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(adminRole);

  if (!session || !isAdmin) {
    redirect("/admin");
  }

  const canEdit = ['super_admin', 'ops_admin', 'moderator'].includes(adminRole);

  await dbConnect();

  let user: any = null;
  let totalProperties = 0;
  let activeProperties = 0;
  let vibeRequestsCount = 0;

  try {
    user = await User.findById(params.id).lean();
    if (!user) {
      notFound();
    }

    totalProperties = await Property.countDocuments({ ownerId: params.id });
    activeProperties = await Property.countDocuments({ ownerId: params.id, status: 'active' });
    vibeRequestsCount = await VibeUpgradeRequest.countDocuments({ userId: params.id });
  } catch (err) {
    console.error("Failed to fetch user details:", err);
    notFound();
  }

  const serializedUser = {
    _id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    verificationStatus: user.verificationStatus || 'pending',
    gender: user.gender,
    age: user.age,
    profession: user.profession,
    bio: user.bio,
    isFlatmateSearchable: user.isFlatmateSearchable || false,
    hobbies: user.hobbies || [],
    flatPreferences: user.flatPreferences || [],
    vibePreferences: user.vibePreferences || [],
    rejectionReason: user.rejectionReason,
    rejectedAt: user.rejectedAt ? new Date(user.rejectedAt).toISOString() : undefined,
    reverificationRequestMessage: user.reverificationRequestMessage,
    reverificationRequestedAt: user.reverificationRequestedAt ? new Date(user.reverificationRequestedAt).toISOString() : undefined,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users Management</span>
        </Link>

        {/* View Properties & Analytics Button */}
        <div className="flex items-center space-x-2">
          <Link
            href={`/admin/users/${user._id}/properties`}
            className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Home className="h-4 w-4" />
            <span>User Properties & Analytics ({totalProperties})</span>
          </Link>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xl border border-brand-primary/20 flex-shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-7 w-7" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{user.name || "Unnamed User"}</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {user.role}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                user.verificationStatus === 'verified'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : user.verificationStatus === 'rejected'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {user.verificationStatus || 'pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Phone: {user.phone} {user.email && `| Email: ${user.email}`}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-slate-50 border rounded-xl px-4 py-2.5 text-center min-w-[90px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Listings</span>
            <p className="text-lg font-extrabold text-slate-800">{totalProperties}</p>
          </div>
          <div className="bg-slate-50 border rounded-xl px-4 py-2.5 text-center min-w-[90px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active</span>
            <p className="text-lg font-extrabold text-brand-primary">{activeProperties}</p>
          </div>
          <div className="bg-slate-50 border rounded-xl px-4 py-2.5 text-center min-w-[90px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vibe Reqs</span>
            <p className="text-lg font-extrabold text-violet-600">{vibeRequestsCount}</p>
          </div>
        </div>
      </div>

      {/* Main Details Form */}
      <UserDetailsForm user={serializedUser} canEdit={canEdit} />
    </div>
  );
}
