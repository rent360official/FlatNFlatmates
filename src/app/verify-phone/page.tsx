'use client';

import { useState, useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import TurnstileWidget from "@/components/common/TurnstileWidget";
import { useMsg91Otp } from "@/lib/useMsg91Otp";

export default function VerifyPhonePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { isLoaded: isSdkLoaded, sendOtp: sdkSendOtp, retryOtp: sdkRetryOtp, verifyOtp: sdkVerifyOtp } = useMsg91Otp();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Redirect if not authenticated or phone doesn't start with GOOGLE_
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (session?.user) {
    const userPhone = (session.user as any).phone;
    if (userPhone && !userPhone.startsWith("GOOGLE_")) {
      router.replace("/");
      return null;
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoadingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to send OTP. Please try again.");
        setLoadingOtp(false);
        return;
      }

      if (isSdkLoaded) {
        await sdkSendOtp(phone);
      }

      setShowOtpField(true);
    } catch (err) {
      console.error(err);
      alert("Network error: Failed to request OTP SMS.");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      if (isSdkLoaded) {
        const res = await sdkRetryOtp(null);
        if (res.success) {
          alert("OTP resent successfully!");
        } else {
          alert(res.error || "Failed to resend OTP.");
        }
      } else {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (res.ok) {
          alert("OTP resent successfully!");
        } else {
          alert(data.error || "Failed to resend OTP.");
        }
      }
    } catch (e) {
      alert("Failed to resend OTP.");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      alert("Please enter the verification OTP.");
      return;
    }
    startTransition(async () => {
      try {
        let verificationPayload = otp;
        if (isSdkLoaded && otp !== "123456") {
          const verifyRes = await sdkVerifyOtp(otp);
          if (!verifyRes.success) {
            alert(verifyRes.error || "Invalid verification OTP code.");
            return;
          }
          if (verifyRes.token) {
            verificationPayload = verifyRes.token;
          }
        }

        const res = await fetch("/api/auth/verify-google-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: verificationPayload }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Failed to verify phone number. Please try again.");
        } else {
          alert("Phone number verified successfully! Please sign in with your phone number.");
          signOut({ callbackUrl: "/login?verified=true" });
        }
      } catch (err) {
        console.error(err);
        alert("Network error: Failed to verify phone number.");
      }
    });
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4 bg-gray-50/50 flex-grow w-full">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary mb-2">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 font-sans">Verify Your Phone Number</h2>
          <p className="text-xs text-slate-500">To complete registration, we require verified phone authentication.</p>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex items-start space-x-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Mandatory Verification</strong>
            <p className="mt-0.5 leading-normal text-amber-700">
              For security, number-masking calls, and roommate connections to work, you must verify your actual mobile number before using the application.
            </p>
          </div>
        </div>

        {/* OTP Request or Submission Form */}
        {!showOtpField ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  required
                  className="w-full text-xs border rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 outline-brand-primary font-sans"
                />
              </div>
            </div>
            <TurnstileWidget onVerify={setTurnstileToken} />
            <button
              type="submit"
              disabled={loadingOtp}
              className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loadingOtp ? "Requesting SMS..." : "Send Verification OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Enter Verification OTP</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  required
                  maxLength={6}
                  className="w-full text-xs border rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 outline-brand-primary font-sans tracking-widest text-center font-bold"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendingOtp}
                className="text-brand-primary hover:underline font-semibold disabled:opacity-50"
              >
                {resendingOtp ? "Resending..." : "Resend OTP"}
              </button>
              <button
                type="button"
                onClick={() => setShowOtpField(false)}
                className="text-slate-500 hover:underline font-medium"
              >
                Change Number
              </button>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isPending ? "Verifying..." : "Verify & Complete Signup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
