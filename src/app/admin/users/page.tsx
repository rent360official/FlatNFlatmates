import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import UsersManagementClient from "./UsersManagementClient";
import { UserItem } from "./UsersTable";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function UsersAdminPage() {
  const session = await getServerSession(authOptions);
  const adminRole = (session?.user as any)?.role || "";
  const canEdit = ['super_admin', 'ops_admin', 'moderator'].includes(adminRole);

  await dbConnect();
  
  const rawUsers = await User.find().sort({ createdAt: -1 }).lean();
  const serializedUsers: UserItem[] = rawUsers.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    verificationStatus: u.verificationStatus || 'pending',
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
  }));

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      <UsersManagementClient users={serializedUsers} canEdit={canEdit} />
    </div>
  );
}
