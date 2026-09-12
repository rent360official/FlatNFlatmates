import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import ProfileForm from "./ProfileForm";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  
  const user = await User.findById((session?.user as any)?.id).lean();

  if (!user) {
    return <div className="text-sm text-slate-500 font-sans">Loading user profile...</div>;
  }

  // Serialize user fields for the client component
  const serializedUser = {
    name: user.name,
    phone: user.phone,
    email: user.email,
    age: user.age,
    gender: user.gender,
    profession: user.profession,
    bio: user.bio,
    verificationStatus: user.verificationStatus || 'pending',
    rejectionReason: user.rejectionReason,
    rejectedAt: user.rejectedAt ? new Date(user.rejectedAt).toISOString() : undefined,
    reverificationRequestMessage: user.reverificationRequestMessage,
    reverificationRequestedAt: user.reverificationRequestedAt ? new Date(user.reverificationRequestedAt).toISOString() : undefined,
    hobbies: user.hobbies || [],
    flatPreferences: user.flatPreferences || [],
    vibePreferences: user.vibePreferences || [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 font-sans">Personal Information</h2>
        <p className="text-xs text-slate-500">Update your public profile info that flatmate seekers and landlords will see.</p>
      </div>

      <ProfileForm initialUser={serializedUser} />
    </div>
  );
}
