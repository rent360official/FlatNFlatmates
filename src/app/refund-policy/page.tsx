import React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isFeatureActive } from "@/lib/featureAccess";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cancellation & Refund Policy | FlatNFlatmates.in",
  description: "Cancellation, return, and refund policies for services on FlatNFlatmates.in.",
};

export default async function RefundPolicyPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "anonymous";
  const hasVibeUpgrade = await isFeatureActive("vibe_upgrade_catalog", role);

  const lastUpdated = "September 2026";

  const sections: { title: string; content: React.ReactNode; isContact?: boolean }[] = [
    {
      title: "Listing & Search Services",
      content: (
        <p>
          Browsing flats, discovering flatmates, and standard property listings on FlatNFlatmates are provided 100% free of charge. As no platform service fee is charged for basic discovery and inquiry features, no refunds are applicable for standard listings.
        </p>
      ),
    },
    ...(hasVibeUpgrade
      ? [
          {
            title: "Vibe Upgrade Packages & Redecoration Services",
            content: (
              <>
                <p>
                  For users subscribing to or ordering Vibe Upgrade room transformation packages:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Cancellations Before Dispatch:</strong> You may cancel your Vibe Upgrade request up to 12 hours prior to the scheduled installation appointment for a 100% full refund.
                  </li>
                  <li>
                    <strong className="text-slate-800">Cancellations After Dispatch / Arrival:</strong> If cancellation occurs after the logistics team has dispatched materials or arrived at the property, a nominal logistics handling fee of ₹300 may be deducted from the refunded amount.
                  </li>
                  <li>
                    <strong className="text-slate-800">Quality Guarantee & Replacements:</strong> If any decor item, lighting, or furniture element delivered is damaged or mismatched, our team will replace the affected item free of charge within 48 hours.
                  </li>
                </ul>
              </>
            ),
          },
        ]
      : []),
    {
      title: "Security Deposits & Tenancy Rentals",
      content: (
        <p>
          Security deposits and monthly rents agreed between tenants and property owners are transacted directly between the respective parties. FlatNFlatmates does not hold, manage, or arbitrate rental security deposits. Tenancy deposit disputes are governed by the private agreement signed between the landlord and tenant.
        </p>
      ),
    },
    {
      title: "Refund Processing Timeline",
      content: (
        <p>
          Approved refunds for eligible paid services are processed back to the original payment method (UPI / Debit Card / Net Banking) within <strong className="text-slate-900">5 to 7 business days</strong> from the date of approval.
        </p>
      ),
    },
    {
      title: "How to Request a Cancellation or Refund",
      isContact: true,
      content: (
        <>
          <p>
            To initiate a cancellation or refund request, please email our support team with your order reference or registered mobile number:
          </p>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <p className="font-semibold text-slate-800">FlatNFlatmates Customer Support</p>
            <p className="text-slate-600">
              Email: <a href="mailto:rent360official@gmail.com" className="text-brand-primary underline font-medium">rent360official@gmail.com</a>
            </p>
            <p className="text-slate-500 text-xs">Response time: Usually within 24 business hours</p>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white border rounded-2xl p-6 sm:p-10 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <RotateCcw className="w-3.5 h-3.5 text-brand-primary" />
            Customer Support & Policies
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-xs text-slate-400">Last updated: {lastUpdated}</p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t">
            This policy outlines the cancellation and refund terms applicable to services on FlatNFlatmates.in.
          </p>
        </div>

        {/* Content Document */}
        <div className="bg-white border rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className={`space-y-3 ${section.isContact ? "border-t pt-6" : ""}`}
            >
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                {section.title}
              </h2>
              {section.content}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
