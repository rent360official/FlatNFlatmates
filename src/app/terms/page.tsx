import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isFeatureActive } from "@/lib/featureAccess";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms & Conditions | FlatNFlatmates.in",
  description: "Terms and conditions governing the use of FlatNFlatmates.in platform services in Pune.",
};

export default async function TermsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "anonymous";
  const hasVibeUpgrade = await isFeatureActive("vibe_upgrade_catalog", role);

  const lastUpdated = "September 2026";

  const sections: { title: string; content: React.ReactNode; isContact?: boolean }[] = [
    {
      title: "Acceptance & Eligibility",
      content: (
        <>
          <p>
            By accessing or using FlatNFlatmates, you agree to be bound by these Terms and our Privacy Policy. If you do not agree with any part of the terms, you may not access or use our services.
          </p>
          <p>
            You must be at least 18 years old and capable of entering into legally binding contracts under the Indian Contract Act, 1872 to create an account or publish listings on our platform.
          </p>
        </>
      ),
    },
    {
      title: "Platform Role & Nature of Service",
      content: (
        <>
          <p>
            FlatNFlatmates operates solely as an online discovery and networking intermediary platform connecting property owners, current tenants, and prospective flatmates in Pune.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>FlatNFlatmates is not a real estate broker, landlord, property manager, or insurance provider.</li>
            <li>We do not own, inspect, manage, or lease properties unless explicitly stated under a written managed-services contract.</li>
            <li>Agreements, rent transfers, security deposits, and tenancy contracts are entered into directly between the property owner/tenant and the prospective renter.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Listing Accuracy & User Responsibilities",
      content: (
        <>
          <p>
            When listing a flat, room share, or flatmate seeker profile, you represent and warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>All information provided (pricing, location, photographs, house rules, furnishings) is accurate, genuine, and current.</li>
            <li>You have the legal authority to rent or sub-lease the accommodation described.</li>
            <li>You must accurately declare your relation to the property (Owner, Existing Flatmate, or Authorized Broker).</li>
            <li>You will not upload copyrighted images or deceptive media depicting properties other than the actual listing.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Zero-Tolerance Harassment & Safety Guidelines",
      content: (
        <>
          <p>
            To maintain a safe community for all users, particularly students and young working professionals:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Harassment, abusive language, discriminatory remarks (based on religion, caste, nationality, or orientation), or unsolicited spam are strictly prohibited.</li>
            <li>Users must not collect, harvest, or misuse contact details obtained through our direct messaging or inquiry features.</li>
            <li>We reserve the right to immediately suspend or permanently terminate accounts found violating community safety guidelines.</li>
          </ul>
        </>
      ),
    },
    ...(hasVibeUpgrade
      ? [
          {
            title: "Vibe Upgrade & Add-On Services",
            content: (
              <p>
                FlatNFlatmates offers optional add-on interior styling packages ("Vibe Upgrade Packs"). Orders placed for styling packs are subject to locality availability in Pune, payment verification, and scheduling confirmation. Please refer to our <Link href="/refund-policy" className="text-brand-primary underline">Refund Policy</Link> for details regarding order adjustments and cancellations.
              </p>
            ),
          },
        ]
      : []),
    {
      title: "Limitation of Liability & Disclaimers",
      content: (
        <>
          <p>
            FlatNFlatmates provides its platform on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by applicable Indian law:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>We make no warranties regarding the accuracy, completeness, or safety of third-party user postings.</li>
            <li>Users are advised to conduct physical inspections and standard due diligence prior to signing agreements or transferring financial deposits.</li>
            <li>FlatNFlatmates shall not be liable for direct, indirect, incidental, or consequential damages resulting from tenancy disputes, property damages, or unfulfilled promises between users.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Governing Law & Dispute Resolution",
      content: (
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms or platform usage shall be subject to the exclusive jurisdiction of the competent courts in Pune, Maharashtra.
        </p>
      ),
    },
    {
      title: "Contact Information",
      isContact: true,
      content: (
        <>
          <p>
            If you have any questions, clarifications, or feedback regarding these Terms, please contact our team:
          </p>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <p className="font-semibold text-slate-800">FlatNFlatmates Support & Grievance Team</p>
            <p className="text-slate-600">
              Email: <a href="mailto:rent360official@gmail.com" className="text-brand-primary underline font-medium">rent360official@gmail.com</a>
            </p>
            <p className="text-slate-500 text-xs">Pune, Maharashtra, India</p>
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
            <FileText className="w-3.5 h-3.5 text-brand-primary" />
            Legal Agreement
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-xs text-slate-400">Last updated: {lastUpdated}</p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t">
            Please read these Terms and Conditions ("Terms", "Agreement") carefully before using the FlatNFlatmates website (<Link href="/" className="text-brand-primary underline">flatandflatmates.in</Link>) operated by FlatNFlatmates ("we", "us", "our").
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
