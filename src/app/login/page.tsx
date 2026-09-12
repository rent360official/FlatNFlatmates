'use client';

import { Suspense, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Phone, Lock, User as UserIcon, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import TurnstileWidget from "@/components/common/TurnstileWidget";
import { useMsg91Otp } from "@/lib/useMsg91Otp";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const { isLoaded: isSdkLoaded, sendOtp: sdkSendOtp, retryOtp: sdkRetryOtp, verifyOtp: sdkVerifyOtp } = useMsg91Otp();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoadingOtp(true);
    try {
      // 1. Security & Rate Limit validation on backend
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to send OTP. Please check your number.");
        setLoadingOtp(false);
        return;
      }

      setUserExists(data.exists);

      // 2. Dispatch OTP via MSG91 Client Web SDK if loaded
      if (isSdkLoaded) {
        const sdkRes = await sdkSendOtp(phone);
        if (!sdkRes.success && sdkRes.error) {
          alert(sdkRes.error);
          setLoadingOtp(false);
          return;
        }
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      alert("Please enter the verification OTP.");
      return;
    }
    if (userExists === false && !name) {
      alert("Please enter your full name to complete registration.");
      return;
    }
    startTransition(async () => {
      let verificationPayload = otp;

      // If MSG91 Web SDK is active and not using dev bypass code
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

      const result = await signIn("credentials", {
        phone,
        otp: verificationPayload,
        name: userExists ? undefined : name,
        email: userExists ? undefined : (email || undefined),
        redirect: false,
      });

      if (result?.error) {
        alert(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  // Determine Title based on current state
  const titleText = !showOtpField 
    ? "Sign In / Sign Up" 
    : (userExists ? "Sign In to Your Account" : "Create Your Account");

  const subtitleText = !showOtpField
    ? "Access flats search, matching profiles & secure calling in Pune."
    : (userExists 
        ? `Welcome back! Please enter the OTP sent to ${phone}.` 
        : `New number detected! Please fill details below to register.`);

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4 bg-gray-50/50 flex-grow w-full">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 font-sans">{titleText}</h2>
          <p className="text-xs text-slate-500">{subtitleText}</p>
        </div>

        {/* Custom OTP Credentials Form */}
        {!showOtpField ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phone Number</label>
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
              {loadingOtp ? "Sending OTP..." : "Request Verification OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* For New Users (Sign Up flow): Show Name and Email fields */}
            {userExists === false && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter your full name (Mandatory)"
                      required
                      className="w-full text-xs border rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 outline-brand-primary font-sans"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter email address (Optional)"
                      className="w-full text-xs border rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 outline-brand-primary font-sans"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Verification OTP</label>
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
                onClick={() => {
                  setShowOtpField(false);
                  setUserExists(null);
                }}
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
              {isPending ? "Verifying..." : (userExists ? "Verify & Sign In" : "Register & Sign In")}
            </button>
          </form>
        )}

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="border-t w-full"></div>
          <span className="absolute bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or</span>
        </div>

        {/* Google Sign-in */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 flex items-center justify-center space-x-2"
        >
          <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </Button>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[75vh] items-center justify-center text-sm text-slate-500">Loading auth form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
