'use server';

import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import PropertyInquiry from "@/models/PropertyInquiry";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendPropertyInterestSms, formatE164Phone } from "@/lib/msg91";
import { isFeatureActive } from "@/lib/featureAccess";

/**
 * 1. Log a Call Action & Return Direct Native Tel URL
 * Does NOT display the owner's phone number directly on the UI
 */
export async function recordPropertyCallAction(propertyId: string): Promise<{
  success: boolean;
  telUrl?: string;
  requireLogin?: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        success: false,
        requireLogin: true,
        error: "Please sign in to call the property owner.",
      };
    }

    await dbConnect();
    const property = await Property.findById(propertyId);
    if (!property) {
      return { success: false, error: "Property not found" };
    }

    const owner = await User.findById(property.ownerId);
    if (!owner || !owner.phone) {
      return { success: false, error: "Owner contact unavailable" };
    }

    const userId = (session.user as any)?.id;
    const userName = (session.user as any)?.name || "Seeker";
    const userPhone = (session.user as any)?.phone;

    // Log call inquiry to database so owner can view call counts
    await PropertyInquiry.create({
      propertyId: property._id,
      ownerId: property.ownerId,
      userId: userId || undefined,
      userName: userName || undefined,
      userPhone: userPhone || undefined,
      inquiryType: 'call',
      smsStatus: 'n/a',
    });

    const formattedPhone = formatE164Phone(owner.phone);
    return {
      success: true,
      telUrl: `tel:${formattedPhone}`,
    };
  } catch (error: any) {
    console.error("Error recording property call action:", error);
    return { success: false, error: "Failed to initiate call connection" };
  }
}

/**
 * 2. Log a WhatsApp Click Action
 */
export async function recordPropertyWhatsappAction(propertyId: string): Promise<{
  success: boolean;
  requireLogin?: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        success: false,
        requireLogin: true,
        error: "Please sign in to message the property owner on WhatsApp.",
      };
    }

    await dbConnect();
    const property = await Property.findById(propertyId);
    if (!property) {
      return { success: false, error: "Property not found" };
    }

    const userId = (session.user as any)?.id;
    const userName = (session.user as any)?.name || "Seeker";
    const userPhone = (session.user as any)?.phone;

    // Log WhatsApp inquiry
    await PropertyInquiry.create({
      propertyId: property._id,
      ownerId: property.ownerId,
      userId: userId || undefined,
      userName: userName || undefined,
      userPhone: userPhone || undefined,
      inquiryType: 'whatsapp',
      smsStatus: 'n/a',
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error recording WhatsApp action:", error);
    return { success: false, error: "Failed to record inquiry" };
  }
}

/**
 * 3. Submit Property Interest & Send MSG91 SMS to Owner
 * Controlled by Feature Management (key: 'property_interest_sms')
 */
export async function submitPropertyInterestSmsAction(propertyId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  requireLogin?: boolean;
  alreadyExisted?: boolean;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        success: false,
        requireLogin: true,
        error: "Please log in to share your interest with the owner.",
      };
    }

    await dbConnect();
    const property = await Property.findById(propertyId);
    if (!property) {
      return { success: false, error: "Property not found" };
    }

    const owner = await User.findById(property.ownerId);
    if (!owner || !owner.phone) {
      return { success: false, error: "Owner phone number is not available" };
    }

    const user = session.user as any;
    const userRole = user.role || 'user';
    const userName = user.name || "A prospective tenant";
    const userPhone = user.phone || "Number on profile";

    // 1. Deduplication: Has this user already expressed interest in this property?
    const existingInquiry = await PropertyInquiry.findOne({
      propertyId: property._id,
      userId: user.id,
      inquiryType: 'sms_interested',
    });

    if (existingInquiry) {
      return {
        success: true,
        alreadyExisted: true,
        message: "You have already shared your interest for this property with the owner.",
      };
    }

    // Check Feature Flag for MSG91 Interest SMS
    const isSmsFeatureEnabled = await isFeatureActive('property_interest_sms', userRole);

    let smsStatus: 'sent' | 'skipped_feature_disabled' | 'failed' | 'mocked' = 'skipped_feature_disabled';
    let smsResponse: any = null;

    if (isSmsFeatureEnabled) {
      const siteUrl = process.env.NEXTAUTH_URL || "https://flatandflatmates.in";
      const propertyUrl = `${siteUrl}/flat/${property._id.toString()}`;

      const smsRes = await sendPropertyInterestSms({
        ownerPhone: owner.phone,
        userName,
        userPhone,
        propertyTitle: `${property.bhkConfig} in ${property.title}`,
        propertyUrl,
      });

      if (smsRes.success) {
        smsStatus = process.env.TELEPHONY_PROVIDER === 'mock' ? 'mocked' : 'sent';
        smsResponse = smsRes.rawResponse || smsRes.messageId;
      } else {
        smsStatus = 'failed';
        smsResponse = smsRes.error;
        console.error("Interest SMS dispatch failed:", smsRes.error);
      }
    } else {
      console.log(`[Feature Management] 'property_interest_sms' is disabled. Skipping SMS dispatch.`);
    }

    // Save inquiry in database
    await PropertyInquiry.create({
      propertyId: property._id,
      ownerId: property.ownerId,
      userId: user.id,
      userName,
      userPhone,
      inquiryType: 'sms_interested',
      smsStatus,
      smsResponse,
    });

    return {
      success: true,
      message: "Interest successfully shared with the owner!",
    };
  } catch (error: any) {
    console.error("Error submitting property interest SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to share interest. Please try again.",
    };
  }
}
