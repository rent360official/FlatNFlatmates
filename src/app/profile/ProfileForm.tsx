'use client';

import { useState, useTransition, useRef } from "react";
import { updatePersonalInfo, requestReverification, deleteMyAccount } from "./actions";
import { signOut, useSession } from "next-auth/react";
import { AlertTriangle, ShieldAlert, RefreshCw, Trash2, CheckCircle2, Clock, Camera, User, Upload, X } from "lucide-react";
import SquareImageCropperModal from "@/components/profile/SquareImageCropperModal";
import React from "react";

interface ProfileFormProps {
  initialUser: {
    name?: string;
    phone: string;
    email?: string;
    profilePhoto?: string;
    age?: number;
    gender?: string;
    profession?: string;
    bio?: string;
    verificationStatus?: string;
    rejectionReason?: string;
    rejectedAt?: string;
    reverificationRequestMessage?: string;
    reverificationRequestedAt?: string;
    hobbies: string[];
    flatPreferences: string[];
    vibePreferences: string[];
  };
}

export default function ProfileForm({ initialUser }: ProfileFormProps) {
  const { data: session, update: updateSession } = useSession();

  const [name, setName] = useState(initialUser.name || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [profilePhoto, setProfilePhoto] = useState(initialUser.profilePhoto || "");
  const [age, setAge] = useState(initialUser.age ? initialUser.age.toString() : "");
  const [gender, setGender] = useState(initialUser.gender || "male");
  const [profession, setProfession] = useState(initialUser.profession || "");
  const [bio, setBio] = useState(initialUser.bio || "");
  const [hobbies, setHobbies] = useState(initialUser.hobbies?.join(", ") || "");
  const [flatPreferences, setFlatPreferences] = useState(initialUser.flatPreferences?.join(", ") || "");

  // Photo Cropping & Upload State
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Reverification modal / state
  const [showReverifyModal, setShowReverifyModal] = useState(false);
  const [reverifyMessage, setReverifyMessage] = useState("");
  const [reverifyPending, setReverifyPending] = useState(false);
  const [reverifySuccess, setReverifySuccess] = useState(false);

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger file browser for photo upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_MB = 25;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setPhotoMessage({
        type: 'error',
        text: `Image size exceeds the maximum limit of ${MAX_SIZE_MB}MB. Please select a smaller image.`,
      });
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoMessage({ type: 'error', text: "Please select a valid image file (PNG, JPG, WEBP)." });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if cancelled
    e.target.value = "";
  };

  // Handle saving cropped photo to S3
  const handleCropComplete = async (croppedBase64: string) => {
    setRawImageToCrop(null);
    setIsUploadingPhoto(true);
    setPhotoMessage(null);

    // Optimistic UI update
    setProfilePhoto(croppedBase64);

    try {
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: croppedBase64 }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload photo to S3");
      }

      setProfilePhoto(data.profilePhoto);
      setPhotoMessage({ type: 'success', text: "Profile photo updated successfully!" });

      // Update NextAuth session image if available
      if (updateSession) {
        updateSession({ image: data.profilePhoto });
      }
    } catch (err: any) {
      console.error("Profile photo upload error:", err);
      setPhotoMessage({ type: 'error', text: err.message || "Failed to upload photo. Please try again." });
      setProfilePhoto(initialUser.profilePhoto || "");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle removing profile photo
  const handleRemovePhoto = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    setIsUploadingPhoto(true);
    setPhotoMessage(null);

    try {
      const res = await fetch("/api/profile/photo", {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove photo");
      }

      setProfilePhoto("");
      setPhotoMessage({ type: 'success', text: "Profile photo removed." });

      if (updateSession) {
        updateSession({ image: "" });
      }
    } catch (err: any) {
      console.error("Profile photo removal error:", err);
      setPhotoMessage({ type: 'error', text: err.message || "Failed to remove photo." });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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

  const handleReverificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reverifyMessage.trim()) return;

    setReverifyPending(true);
    const res = await requestReverification(reverifyMessage.trim());
    setReverifyPending(false);

    if (res.error) {
      alert(res.error);
    } else {
      setReverifySuccess(true);
      setShowReverifyModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await deleteMyAccount();
    if (res.error) {
      alert(res.error);
      setIsDeleting(false);
    } else {
      await signOut({ callbackUrl: "/" });
    }
  };

  const isRejected = initialUser.verificationStatus === 'rejected';

  return (
    <div className="space-y-6 max-w-2xl font-sans">
      
      {/* Interactive 1:1 Square Cropper Modal */}
      {rawImageToCrop && (
        <SquareImageCropperModal
          imageSrc={rawImageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => setRawImageToCrop(null)}
        />
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {/* Profile Photo Upload Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Profile Photo</h3>
        </div>

        {photoMessage && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold ${
              photoMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {photoMessage.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar Container in 1:1 Cover Mode */}
          <div className="relative group self-start sm:self-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-inner flex items-center justify-center relative">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={name || "User profile photo"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-2xl">
                  {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-brand-primary" />}
                </div>
              )}

              {/* Hover Camera Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-xs cursor-pointer"
                title="Change photo"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-semibold">Change</span>
              </button>
            </div>

            {/* Spinner indicator when uploading */}
            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center backdrop-blur-xs">
                <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{profilePhoto ? "Change Photo" : "Upload Photo"}</span>
              </button>

              {profilePhoto && (
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {isRejected && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-xl flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-red-900">
                Account Verification Rejected
              </h3>
              <p className="text-xs text-red-700 leading-relaxed">
                Your account verification has been marked as rejected by our moderation team. You cannot post new properties or resume paused listings at this time.
              </p>
              {initialUser.rejectionReason && (
                <div className="mt-2 p-2.5 bg-white/80 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                  <span className="font-bold text-red-900 block text-[10px] uppercase tracking-wider mb-0.5">Reason provided by moderator:</span>
                  "{initialUser.rejectionReason}"
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-red-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-red-600">
              Think this was a mistake? You can request account re-verification.
            </span>
            <button
              type="button"
              onClick={() => setShowReverifyModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Request Re-verification</span>
            </button>
          </div>
        </div>
      )}

      {/* Reverification Request Pending Notification */}
      {(reverifySuccess || (initialUser.verificationStatus === 'pending' && initialUser.reverificationRequestMessage)) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3 text-blue-900 shadow-xs">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold">Re-verification Request Submitted</p>
            <p className="text-blue-700">
              Your re-verification appeal is pending review by our administrator team. We will notify you once reviewed.
            </p>
            {initialUser.reverificationRequestMessage && (
              <p className="text-[11px] text-blue-600 italic bg-white/70 p-2 rounded border border-blue-100 mt-1">
                "{initialUser.reverificationRequestMessage}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g. 24"
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

      {/* Danger Zone: Account Deletion */}
      <div className="mt-12 border border-red-200 bg-red-50/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-sm font-bold">Danger Zone</h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">Delete Account</p>
            <p className="text-[11px] text-slate-500 max-w-md">
              Permanently delete your user account and profile data. All your active properties will be deactivated and marked as removed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-xs flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Re-verification Modal */}
      {showReverifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-50 text-brand-primary rounded-xl">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Re-verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explain why your account verification should be reinstated. An admin will review your message.
                </p>
              </div>
            </div>

            <form onSubmit={handleReverificationSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Appeal / Request Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reverifyMessage}
                  onChange={(e) => setReverifyMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="e.g., I have updated my listing details and verified all information according to community guidelines..."
                  className="w-full text-xs border rounded-lg p-3 bg-slate-50 outline-brand-primary resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowReverifyModal(false)}
                  disabled={reverifyPending}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reverifyPending || !reverifyMessage.trim()}
                  className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {reverifyPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start space-x-3 text-red-600">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Are you absolutely sure?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This action is permanent and cannot be undone. Your account, profile information, and all associated active listings will be removed.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
              <strong>Notice:</strong> If your account is currently in rejected status, your registered mobile number will remain flagged on record to prevent unauthorized recreation.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? "Deleting Account..." : "Yes, Delete My Account"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
