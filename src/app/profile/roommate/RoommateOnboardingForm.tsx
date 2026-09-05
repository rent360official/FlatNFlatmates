'use client';

import { useState, useTransition } from "react";
import { updateRoommateProfile } from "../actions";

export default function RoommateOnboardingForm({ 
  initialSearchable, 
  initialTargetLocations, 
  localities,
  properties,
  initialListing,
  initialPreferences,
  initialVibes
}: { 
  initialSearchable: boolean; 
  initialTargetLocations: string[]; 
  localities: any[]; 
  properties: { _id: string; title: string }[];
  initialListing: { budgetMin: number; budgetMax: number; propertyId: string };
  initialPreferences: {
    userType: string;
    profession: string;
    shift: string;
    socialType: string;
    gymGuy: string;
    outsideEater: string;
  };
  initialVibes: {
    cleanliness: string;
    food: string;
    smoking: string;
    sleep: string;
  };
}) {
  const [isSearchable, setIsSearchable] = useState(initialSearchable);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initialTargetLocations);
  const [isPending, startTransition] = useTransition();

  // Listing budget and property connection
  const [budgetMin, setBudgetMin] = useState(initialListing.budgetMin ? initialListing.budgetMin.toString() : "");
  const [budgetMax, setBudgetMax] = useState(initialListing.budgetMax ? initialListing.budgetMax.toString() : "");
  const [propertyId, setPropertyId] = useState(initialListing.propertyId);

  // Flatmate Preferences
  const [prefUserType, setPrefUserType] = useState(initialPreferences.userType);
  const [prefProfession, setPrefProfession] = useState(initialPreferences.profession);
  const [prefShift, setPrefShift] = useState(initialPreferences.shift);
  const [prefSocialType, setPrefSocialType] = useState(initialPreferences.socialType);
  const [prefGymGuy, setPrefGymGuy] = useState(initialPreferences.gymGuy);
  const [prefOutsideEater, setPrefOutsideEater] = useState(initialPreferences.outsideEater);

  // Vibe Preferences (User's own traits)
  const [vibeCleanliness, setVibeCleanliness] = useState(initialVibes.cleanliness || "moderate");
  const [vibeFood, setVibeFood] = useState(initialVibes.food || "any");
  const [vibeSmoking, setVibeSmoking] = useState(initialVibes.smoking || "no");
  const [vibeSleep, setVibeSleep] = useState(initialVibes.sleep || "flexible");

  const handleToggle = () => {
    setIsSearchable(!isSearchable);
  };

  const handleLocationToggle = (id: string) => {
    if (selectedLocations.includes(id)) {
      setSelectedLocations(selectedLocations.filter(locId => locId !== id));
    } else {
      setSelectedLocations([...selectedLocations, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearchable && selectedLocations.length === 0 && !propertyId) {
      alert("Please select at least one target location or link a property to be searchable.");
      return;
    }

    startTransition(async () => {
      const res = await updateRoommateProfile({
        isSearchable,
        targetLocations: selectedLocations,
        budgetMin: parseInt(budgetMin) || 5000,
        budgetMax: parseInt(budgetMax) || 20000,
        propertyId: propertyId || null,
        userType: prefUserType as any,
        profession: prefProfession as any,
        shift: prefShift as any,
        socialType: prefSocialType as any,
        gymGuy: prefGymGuy as any,
        outsideEater: prefOutsideEater as any,
        cleanliness: vibeCleanliness,
        food: vibeFood,
        smoking: vibeSmoking,
        sleep: vibeSleep,
      });

      if (res.success) {
        alert("Roommate profile settings updated successfully!");
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl font-sans">
      
      {/* 1. Discoverability Status */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Discoverability</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl">
          <div>
            <span className="text-xs font-bold text-slate-800">Searchable as a Flatmate</span>
            <p className="text-[11px] text-slate-500">Enable this to let other flatmate seekers discover you in the search page.</p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isSearchable ? "bg-brand-primary" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isSearchable ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Accommodation Setup */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Accommodation & Budgets</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Budget Min (₹/mo)</label>
            <input 
              type="number"
              placeholder="e.g. 5000"
              value={budgetMin}
              onChange={e => setBudgetMin(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Budget Max (₹/mo)</label>
            <input 
              type="number"
              placeholder="e.g. 20000"
              value={budgetMax}
              onChange={e => setBudgetMax(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Linked Flat (If you have one)</label>
          <select 
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            className="w-full text-xs border rounded-lg px-3 py-2.5 bg-slate-50 outline-brand-primary"
          >
            <option value="">No Property (Looking to rent one together)</option>
            {properties.map(p => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">If linked, your listing will display property first on the search page.</p>
        </div>
      </div>

      {/* 3. Target Localities */}
      {(!propertyId) && (
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Target Locality Preference</h3>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Locality Areas</span>
            <p className="text-[11px] text-slate-500 mb-3">Select the areas in Pune where you are looking to rent a flat.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {localities.map((loc) => {
                const selected = selectedLocations.includes(loc._id);
                return (
                  <button
                    key={loc._id}
                    type="button"
                    onClick={() => handleLocationToggle(loc._id)}
                    className={`px-3 py-2 rounded-lg text-xs border text-left transition-all flex items-center justify-between ${
                      selected 
                        ? "border-brand-primary bg-brand-primary/10/50 text-brand-primaryHover font-semibold shadow-sm" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-650"
                    }`}
                  >
                    <span>{loc.name}</span>
                    {selected && <div className="h-1.5 w-1.5 rounded-full bg-brand-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Your Roommate Traits (lifestyle vibe) */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Your Lifestyle Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Cleanliness</label>
            <select 
              value={vibeCleanliness}
              onChange={e => setVibeCleanliness(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="high">Obsessive (Very Clean)</option>
              <option value="moderate">Moderate</option>
              <option value="low">Laid-back (Relaxed)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Food Policy</label>
            <select 
              value={vibeFood}
              onChange={e => setVibeFood(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="any">No restriction</option>
              <option value="veg_only">Strictly Vegetarian</option>
              <option value="egg_allowed">Eggetarian</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Smoking Policy</label>
            <select 
              value={vibeSmoking}
              onChange={e => setVibeSmoking(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="no">Non-smoker only</option>
              <option value="occasional">Occasional smoker</option>
              <option value="yes">No restrictions</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Sleep Schedule</label>
            <select 
              value={vibeSleep}
              onChange={e => setVibeSleep(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="flexible">Flexible</option>
              <option value="early_bird">Early riser</option>
              <option value="night_owl">Night owl</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Flatmate Preferences */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Roommate Preferences</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">User Status Preference</label>
            <select 
              value={prefUserType}
              onChange={e => setPrefUserType(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="">No preference</option>
              <option value="Student">Student</option>
              <option value="Professional">Working Professional</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Social Style</label>
            <select 
              value={prefSocialType}
              onChange={e => setPrefSocialType(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="">No preference</option>
              <option value="Socializing">Outgoing & Socializing</option>
              <option value="Reserved">Quiet & Reserved</option>
            </select>
          </div>

          {prefUserType === "Professional" && (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Work Sector Sector</label>
                <select 
                  value={prefProfession}
                  onChange={e => setPrefProfession(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="">Any</option>
                  <option value="Government Job">Government Job</option>
                  <option value="Corporate Job">Corporate Job</option>
                  <option value="Self Employed">Self Employed</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Shift Hours</label>
                <select 
                  value={prefShift}
                  onChange={e => setPrefShift(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="">Any</option>
                  <option value="Day Shift">Day Shift</option>
                  <option value="Night Shift">Night Shift</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gym Lifestyle Preference</label>
            <select 
              value={prefGymGuy}
              onChange={e => setPrefGymGuy(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="">No preference</option>
              <option value="Not at all">Not at all</option>
              <option value="Maybe">Maybe</option>
              <option value="Definitely">Definitely gym enthusiast</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Outside Eating Style</label>
            <select 
              value={prefOutsideEater}
              onChange={e => setPrefOutsideEater(e.target.value)}
              className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
            >
              <option value="">No preference</option>
              <option value="Too much">Outgoing food lover (Too much)</option>
              <option value="Only evening small snacks">Evening small snacks only</option>
              <option value="No, only homemade foodie">Homemade foodie only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-6 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
        >
          {isPending ? "Saving roommate settings..." : "Save Preferences"}
        </button>
      </div>
    </form>
  );
}
