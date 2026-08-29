'use client';

import { useState, useTransition } from "react";
import { updatePersonalInfo } from "./actions";
import React from "react";

interface ProfileFormProps {
  initialUser: {
    name?: string;
    phone: string;
    email?: string;
    age?: number;
    gender?: string;
    profession?: string;
    bio?: string;
    hobbies: string[];
    flatPreferences: string[];
    vibePreferences: string[];
  };
}

export default function ProfileForm({ initialUser }: ProfileFormProps) {
  const [name, setName] = useState(initialUser.name || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [age, setAge] = useState(initialUser.age?.toString() || "");
  const [gender, setGender] = useState(initialUser.gender || "male");
  const [profession, setProfession] = useState(initialUser.profession || "");
  const [bio, setBio] = useState(initialUser.bio || "");
  const [hobbies, setHobbies] = useState(initialUser.hobbies?.join(", ") || "");
  const [flatPreferences, setFlatPreferences] = useState(initialUser.flatPreferences?.join(", ") || "");

  const getVibeVal = (prefix: string) => {
    const found = initialUser.vibePreferences?.find(vp => vp.startsWith(prefix));
    return found ? found.split(":")[1] : "";
  };

  const [cleanliness, setCleanliness] = useState(getVibeVal("cleanliness") || "moderate");
  const [food, setFood] = useState(getVibeVal("food") || "any");
  const [smoking, setSmoking] = useState(getVibeVal("smoking") || "no");
  const [sleep, setSleep] = useState(getVibeVal("sleep") || "night_owl");

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("profession", profession);
    formData.append("bio", bio);
    formData.append("hobbies", hobbies);
    formData.append("flatPreferences", flatPreferences);
    formData.append("cleanliness", cleanliness);
    formData.append("food", food);
    formData.append("smoking", smoking);
    formData.append("sleep", sleep);

    startTransition(async () => {
      const res = await updatePersonalInfo(formData);
      if (res.error) {
        setStatus({ type: 'error', message: res.error });
      } else {
        setStatus({ type: 'success', message: "Profile updated successfully!" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {status && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold animate-in fade-in duration-200 ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phone (Read-only)</label>
          <input
            type="text"
            value={initialUser.phone}
            disabled
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-100/80 text-slate-400 cursor-not-allowed outline-none font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter email address (Optional)"
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
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
          value={profession}
          onChange={e => setProfession(e.target.value)}
          placeholder="e.g. Software Engineer, Student"
          className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
        />
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell potential roommates about yourself..."
          rows={4}
          className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Cleanliness Habit</label>
          <select
            value={cleanliness}
            onChange={e => setCleanliness(e.target.value)}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          >
            <option value="high">Obsessive (Very Clean)</option>
            <option value="moderate">Moderate (Standard Clean)</option>
            <option value="low">Laid-back (Relaxed)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Food Policy Preference</label>
          <select
            value={food}
            onChange={e => setFood(e.target.value)}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          >
            <option value="veg_only">Strict Vegetarian</option>
            <option value="egg_allowed">Eggetarian</option>
            <option value="any">No Restrictions (Non-Veg Allowed)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Smoking & Alcohol Preference</label>
          <select
            value={smoking}
            onChange={e => setSmoking(e.target.value)}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          >
            <option value="no">Strictly Non-smoker/drinker</option>
            <option value="occasional">Occasional / Outside only</option>
            <option value="yes">No restrictions</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Sleep Schedule</label>
          <select
            value={sleep}
            onChange={e => setSleep(e.target.value)}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          >
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
            value={hobbies}
            onChange={e => setHobbies(e.target.value)}
            placeholder="e.g. Football, Reading, Gaming"
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Flat Pref Tags (comma-separated)</label>
          <input
            type="text"
            value={flatPreferences}
            onChange={e => setFlatPreferences(e.target.value)}
            placeholder="e.g. Gym, Parking, High-floor"
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary font-sans"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-6 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 min-w-[120px] text-center font-sans"
        >
          {isPending ? "Saving..." : "Save Profile Info"}
        </button>
      </div>
    </form>
  );
}
