import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import React from "react";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  const role = (session.user as any)?.role;
  const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(role);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 bg-gray-50/50">
        <div className="max-w-md space-y-4 bg-white p-8 rounded-2xl border shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-sm text-gray-500">
            You do not have the required permissions to view the admin back office. Please log in with an administrator account.
          </p>
          <div className="pt-2">
            <a href="/">
              <button className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all">
                Return to Home
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const propertyCollectorUrl = process.env.PROPERTY_COLLECTOR_URL || process.env.NEXT_PUBLIC_PROPERTY_COLLECTOR_URL;

  return <AdminLayout propertyCollectorUrl={propertyCollectorUrl}>{children}</AdminLayout>;
}
