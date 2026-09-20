import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Server, RefreshCw, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | FlatNFlatmates.in",
  description: "Privacy policy detailing how personal data and contact information are protected on FlatNFlatmates.in.",
};

export default function PrivacyPage() {
  const lastUpdated = "September 2026";

  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white border rounded-2xl p-6 sm:p-10 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-brand-primary" />
            Data Protection & Privacy
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">Last updated: {lastUpdated}</p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t">
            At FlatNFlatmates (<Link href="/" className="text-brand-primary underline">flatandflatmates.in</Link>), we are committed to safeguarding the privacy and personal data of our users. This Privacy Policy describes how we collect, store, process, and protect your information.
          </p>
        </div>

        {/* Content Document */}
        <div className="bg-white border rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">1</span>
              Information We Collect
            </h2>
            <p>
              When you use our services, we collect information necessary to provide flat discovery and flatmate matching:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-800">Account & Identity Information:</strong> Name, email address, mobile phone number (verified via OTP), and optional profile photograph.
              </li>
              <li>
                <strong className="text-slate-800">Lifestyle & Flatmate Preferences:</strong> Profession, shift schedule, food choices (vegetarian, non-veg, vegan), cleanliness habits, fitness interests, and socializing preferences for roommate algorithm compatibility.
              </li>
              <li>
                <strong className="text-slate-800">Property Information:</strong> Property title, address, photographs, videos, floor specs, monthly rent, security deposit, and owner/lister relation.
              </li>
              <li>
                <strong className="text-slate-800">Location & Device Telemetry:</strong> Approximate geographical coordinates for search distance calculation, browser type, IP address, and interaction logs.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">2</span>
              How We Protect Your Contact Number
            </h2>
            <p>
              We treat your contact privacy with utmost priority:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Your phone number is never exposed publicly to web crawlers or unverified visitors.</li>
              <li>Direct call and WhatsApp inquiries require authenticated sessions and express user interest triggers.</li>
              <li>Users can toggle direct WhatsApp inquiry permissions on their listings at any time.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">3</span>
              How We Use Your Information
            </h2>
            <p>
              The information we collect is utilized strictly for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Enabling property search, commute calculation, and roommate lifestyle compatibility matching.</li>
              <li>Authenticating users and verifying listing owners.</li>
              <li>Processing requested service orders and support requests.</li>
              <li>Detecting fraudulent listings, spam, and security vulnerabilities.</li>
              <li>Providing customer support and responding to submitted inquiries.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">4</span>
              Third-Party Integrations & Sub-Processors
            </h2>
            <p>
              We collaborate with trusted service providers to deliver seamless functionality:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong className="text-slate-800">Google Maps Platform:</strong> For geocoding, locality mapping, distance matrix, and place autocomplete.</li>
              <li><strong className="text-slate-800">Cloudflare:</strong> For DNS, SSL encryption, and bot prevention (Turnstile).</li>
              <li><strong className="text-slate-800">Amazon Web Services (AWS S3):</strong> For secure media and image storage.</li>
              <li><strong className="text-slate-800">Telephony Gateways:</strong> For instant SMS OTP account authentication.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">5</span>
              Cookies & Tracking Technologies
            </h2>
            <p>
              We use essential session cookies and local storage tokens to preserve your login session, filter preferences, and saved wishlist items. You can manage or disable cookies via your browser settings, though certain personalized features may be impacted.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">6</span>
              Your Data Rights & Deletion Requests
            </h2>
            <p>
              Under Indian data protection frameworks, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Review and modify your personal profile information through the Account Settings portal.</li>
              <li>Hide or delete your property listings and flatmate seeker profiles.</li>
              <li>Request complete account and personal data erasure by emailing our grievance desk.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 border-t pt-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">7</span>
              Grievance Officer & Privacy Contact
            </h2>
            <p>
              For any questions, concerns, or data requests relating to this Privacy Policy, please contact our designated Privacy Desk:
            </p>
            <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
              <p className="font-semibold text-slate-800">FlatNFlatmates Privacy & Grievance Desk</p>
              <p className="text-slate-600">Email: <a href="mailto:rent360official@gmail.com" className="text-brand-primary underline font-medium">rent360official@gmail.com</a></p>
              <p className="text-slate-500 text-xs">Pune, Maharashtra, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
