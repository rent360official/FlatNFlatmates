'use server';

import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import PlatformSetting from "@/models/PlatformSetting";
import { revalidatePath } from "next/cache";

export async function getInquiriesAction(params?: {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    await dbConnect();

    const status = params?.status;
    const type = params?.type;
    const search = params?.search?.trim();
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 50);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { contactInfo: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { reason: { $regex: search, $options: "i" } },
        { propertyTitle: { $regex: search, $options: "i" } },
      ];
    }

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Inquiry.countDocuments(query),
    ]);

    return {
      success: true,
      inquiries: JSON.parse(JSON.stringify(inquiries)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("Error getting inquiries:", error);
    return {
      success: false,
      error: error.message || "Failed to load inquiries",
      inquiries: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
  }
}

export async function updateInquiryStatusAction(
  id: string,
  status: "pending" | "in_progress" | "resolved" | "closed",
  adminNotes?: string
) {
  try {
    await dbConnect();

    const updateData: any = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updated = await Inquiry.findByIdAndUpdate(id, updateData, { new: true }).lean();

    if (!updated) {
      return { success: false, error: "Inquiry not found" };
    }

    revalidatePath("/admin/inquiries");
    return { success: true, inquiry: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("Error updating inquiry status:", error);
    return { success: false, error: error.message || "Failed to update inquiry" };
  }
}

export async function deleteInquiryAction(id: string) {
  try {
    await dbConnect();
    await Inquiry.findByIdAndDelete(id);
    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting inquiry:", error);
    return { success: false, error: error.message || "Failed to delete inquiry" };
  }
}

export async function getContactEmailSettingAction() {
  try {
    await dbConnect();
    const setting = await PlatformSetting.findOne({ key: "contact_email" }).lean();
    return {
      success: true,
      email: (setting?.value as string) || "rent360official@gmail.com",
      updatedAt: setting?.updatedAt || null,
    };
  } catch (error: any) {
    console.error("Error fetching contact email setting:", error);
    return {
      success: false,
      email: "rent360official@gmail.com",
      error: error.message,
    };
  }
}

export async function updateContactEmailSettingAction(email: string) {
  try {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      return { success: false, error: "Please provide a valid email address." };
    }

    await dbConnect();
    await PlatformSetting.findOneAndUpdate(
      { key: "contact_email" },
      {
        key: "contact_email",
        value: trimmed,
        description: "Official destination email for user inquiries and contact form submissions",
      },
      { upsert: true, new: true }
    );

    revalidatePath("/admin/inquiries");
    return { success: true, email: trimmed };
  } catch (error: any) {
    console.error("Error updating contact email setting:", error);
    return { success: false, error: error.message || "Failed to update contact email" };
  }
}
