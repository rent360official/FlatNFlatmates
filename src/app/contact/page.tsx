'use client';

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle2, AlertCircle, Copy, Check, HelpCircle, ShieldCheck } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    contactInfo: "",
    reason: "general_inquiry",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const officialEmail = "rent360official@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(officialEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.contactInfo.trim()) {
      setError("Please provide your email address or mobile number.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter a brief message or description for your inquiry.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      setSuccess(true);
      setFormData({
        name: "",
        contactInfo: "",
        reason: "general_inquiry",
        description: "",
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please reach out to us directly at rent360official@gmail.com");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-3">
            <Mail className="w-3.5 h-3.5" /> Support & Inquiries
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Get in Touch with Us
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Card: Contact Info (Email Only) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Contact Information</h2>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
                    <a 
                      href={`mailto:${officialEmail}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-brand-primary transition-colors block break-all"
                    >
                      {officialEmail}
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleCopyEmail}
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors shadow-2xs shrink-0"
                  title="Copy Email"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Response Time</p>
                    <p className="text-slate-500">We aim to review and respond to inquiries within 24 to 48 business hours.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Listing Verification</p>
                    <p className="text-slate-500">To expedite property or flatmate verification, mention your registered email or listing ID in your message.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-900">
              <p className="font-bold text-amber-950 mb-1">Safety Advisory</p>
              <p className="text-amber-800">
                FlatNFlatmates.in representatives will never ask for your banking passwords, OTPs, or advance deposits for visits. Please be alert against unauthorized individuals.
              </p>
            </div>
          </div>

          {/* Right Card: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Send Us a Message</h2>
              </div>

              {success ? (
                <div className="py-8 px-6 text-center space-y-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">Inquiry Received!</h3>
                    <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                      Thank you for reaching out. We have received your inquiry and forwarded it to our team. We will get back to you shortly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>{error}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Your Name <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition"
                      />
                    </div>

                    {/* Contact Info (Mobile/Email) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mobile Number or Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactInfo}
                        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                        placeholder="e.g. 9876543210 or user@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Reason for Contact <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition"
                    >
                      <option value="general_inquiry">General Inquiry / Information</option>
                      <option value="listing_issue">Property / Listing Issue or Verification</option>
                      <option value="flatmate_issue">Flatmate Match / Profile Assistance</option>
                      <option value="feedback">Feedback & Suggestions</option>
                      <option value="technical_support">Technical Support / Website Bug</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Description / Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Please describe how we can assist you..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition resize-y min-h-[100px]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Inquiry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
