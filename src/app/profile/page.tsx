import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updatePersonalInfo } from "./actions";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  
  const user = await User.findById((session?.user as any)?.id).lean();

  if (!user) {
    return <div className="text-sm text-slate-500">Loading user profile...</div>;
  }

  // Parse vibePreferences to pull values for form
  const getVibeVal = (prefix: string) => {
    const found = user.vibePreferences?.find(vp => vp.startsWith(prefix));
    return found ? found.split(":")[1] : "";
  };

  const cleanliness = getVibeVal("cleanliness");
  const food = getVibeVal("food");
  const smoking = getVibeVal("smoking");
  const sleep = getVibeVal("sleep");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 font-sans">Personal Information</h2>
        <p className="text-xs text-slate-500">Update your public profile info that flatmate seekers and landlords will see.</p>
      </div>

      <form action={updatePersonalInfo as any} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full Name</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={user.name || ""}
              required
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phone (Read-only)</label>
            <input 
              type="text" 
              value={user.phone}
              disabled
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-100/80 text-slate-400 cursor-not-allowed outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              name="email" 
              defaultValue={user.email || ""}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Age</label>
            <input 
              type="number" 
              name="age" 
              defaultValue={user.age || ""}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gender</label>
            <select 
              name="gender" 
              defaultValue={user.gender || "male"}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Profession</label>
          <input 
            type="text" 
            name="profession" 
            defaultValue={user.profession || ""}
            placeholder="e.g. Software Engineer, Student"
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Bio</label>
          <textarea 
            name="bio" 
            defaultValue={user.bio || ""}
            placeholder="Tell potential roommates about yourself..."
            rows={4}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Cleanliness Habit</label>
            <select name="cleanliness" defaultValue={cleanliness || "moderate"} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
              <option value="high">Obsessive (Very Clean)</option>
              <option value="moderate">Moderate (Standard Clean)</option>
              <option value="low">Laid-back (Relaxed)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Food Policy Preference</label>
            <select name="food" defaultValue={food || "any"} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
              <option value="veg_only">Strict Vegetarian</option>
              <option value="egg_allowed">Eggetarian</option>
              <option value="any">No Restrictions (Non-Veg Allowed)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Smoking & Alcohol Preference</label>
            <select name="smoking" defaultValue={smoking || "no"} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
              <option value="no">Strictly Non-smoker/drinker</option>
              <option value="occasional">Occasional / Outside only</option>
              <option value="yes">No restrictions</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Sleep Schedule</label>
            <select name="sleep" defaultValue={sleep || "night_owl"} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
              <option value="early_bird">Early Bird (Rise early, sleep early)</option>
              <option value="night_owl">Night Owl (Late sleep, late wake)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Hobbies (comma-separated)</label>
            <input 
              type="text" 
              name="hobbies" 
              defaultValue={user.hobbies?.join(", ") || ""}
              placeholder="e.g. Football, Reading, Gaming"
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Flat Pref Tags (comma-separated)</label>
            <input 
              type="text" 
              name="flatPreferences" 
              defaultValue={user.flatPreferences?.join(", ") || ""}
              placeholder="e.g. Gym, Parking, High-floor"
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <button 
            type="submit" 
            className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-6 py-2.5 text-xs font-semibold transition-colors"
          >
            Save Profile Info
          </button>
        </div>
      </form>
    </div>
  );
}
