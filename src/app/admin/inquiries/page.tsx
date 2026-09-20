import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import PlatformSetting from "@/models/PlatformSetting";
import InquiriesView from "./InquiriesView";
import React from "react";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  await dbConnect();

  const [inquiriesDocs, settingDoc] = await Promise.all([
    Inquiry.find().sort({ createdAt: -1 }).limit(100).lean(),
    PlatformSetting.findOne({ key: "contact_email" }).lean(),
  ]);

  const inquiries = inquiriesDocs.map((doc: any) => ({
    _id: doc._id.toString(),
    type: (doc.type || "inquiry") as "inquiry" | "report",
    propertyId: doc.propertyId ? doc.propertyId.toString() : undefined,
    propertyTitle: doc.propertyTitle || "",
    reporterUserId: doc.reporterUserId ? doc.reporterUserId.toString() : undefined,
    contactInfo: doc.contactInfo || "",
    name: doc.name || "",
    reason: doc.reason || "general_inquiry",
    description: doc.description || "",
    status: doc.status || "pending",
    adminNotes: doc.adminNotes || "",
    userIp: doc.userIp || "",
    targetEmail: doc.targetEmail || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  }));

  const configuredContactEmail = (settingDoc?.value as string) || "rent360official@gmail.com";

  return (
    <InquiriesView
      initialInquiries={inquiries}
      initialContactEmail={configuredContactEmail}
    />
  );
}
