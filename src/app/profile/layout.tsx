import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ProfileNav from "./ProfileNav";
import React from "react";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/profile");
  }

  const name = session.user?.name || session.user?.email || "User Profile";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 mb-6 lg:mb-0">
          <ProfileNav name={name} />
        </aside>

        {/* Content Panel */}
        <main className="lg:col-span-9 bg-white border rounded-xl p-6 md:p-8 shadow-sm">
          {children}
        </main>
        
      </div>
    </div>
  );
}
