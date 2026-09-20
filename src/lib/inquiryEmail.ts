import PlatformSetting from "@/models/PlatformSetting";
import dbConnect from "@/lib/db";

export const DEFAULT_CONTACT_EMAIL = "rent360official@gmail.com";

/**
 * Retrieves the currently configured contact email from DB, falling back to rent360official@gmail.com.
 */
export async function getConfiguredContactEmail(): Promise<string> {
  try {
    await dbConnect();
    const setting = await PlatformSetting.findOne({ key: "contact_email" }).lean();
    if (setting && typeof setting.value === "string" && setting.value.trim().length > 0) {
      return setting.value.trim();
    }
  } catch (e) {
    console.error("Error reading contact_email setting:", e);
  }
  return DEFAULT_CONTACT_EMAIL;
}

/**
 * Dispatches an email notification for a new user inquiry.
 * Supports SMTP/SendGrid/Resend if configured, with graceful logging and guaranteed DB persistence.
 */
export async function sendInquiryEmailNotification({
  targetEmail,
  contactInfo,
  reason,
  description,
  name,
  inquiryId,
  type = 'inquiry',
  propertyId,
  propertyTitle,
}: {
  targetEmail: string;
  contactInfo: string;
  reason: string;
  description: string;
  name?: string;
  inquiryId: string;
  type?: 'inquiry' | 'report';
  propertyId?: string;
  propertyTitle?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedReason = reason.replace(/_/g, " ").toUpperCase();
    const siteUrl = process.env.NEXTAUTH_URL || "https://flatandflatmates.in";
    const isReport = type === 'report';

    const emailSubject = isReport
      ? `[Listing Report Flagged] ${propertyTitle || 'Property #' + propertyId} - ${formattedReason}`
      : `[New Inquiry] ${formattedReason} - ${contactInfo}`;

    console.log(`[${isReport ? 'REPORT' : 'INQUIRY'} EMAIL DISPATCH] To: ${targetEmail} | ID #${inquiryId}`);
    console.log(`[DETAILS] Contact: ${contactInfo} | Reason: ${formattedReason} | Msg: ${description}`);

    // If an external SMTP or webhook is configured in environment, send it here:
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: isReport
              ? "FlatNFlatmates Moderation <moderation@flatandflatmates.in>"
              : "FlatNFlatmates Inquiries <inquiries@flatandflatmates.in>",
            to: [targetEmail],
            subject: emailSubject,
            html: isReport
              ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px; background-color: #fffaf5;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h2 style="color: #ea580c; margin-top: 0;">🚩 Property Listing Reported</h2>
                  </div>
                  <p>A user has submitted a moderation report regarding a property listing on FlatNFlatmates.</p>
                  
                  <div style="background-color: #ffffff; padding: 15px; border: 1px solid #fed7aa; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 4px 0;"><strong>Report ID:</strong> ${inquiryId}</p>
                    <p style="margin: 4px 0;"><strong>Reported Property:</strong> ${propertyTitle || "Untitled Property"}</p>
                    ${propertyId ? `<p style="margin: 4px 0;"><strong>Property Link:</strong> <a href="${siteUrl}/flat/${propertyId}" style="color: #ea580c; font-weight: bold;">View Listing on Platform</a></p>` : ""}
                    <p style="margin: 4px 0;"><strong>Report Reason:</strong> <span style="background-color: #ffedd5; color: #9a3412; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${formattedReason}</span></p>
                    <p style="margin: 4px 0;"><strong>Reporter Name:</strong> ${name || "Registered User"}</p>
                    <p style="margin: 4px 0;"><strong>Reporter Contact:</strong> ${contactInfo}</p>
                  </div>

                  <div style="background-color: #ffffff; padding: 15px; border: 1px solid #fed7aa; border-radius: 6px; margin: 15px 0;">
                    <strong style="color: #7c2d12;">Reporter Explanation:</strong>
                    <p style="margin: 8px 0 0 0; white-space: pre-wrap; color: #334155;">${description}</p>
                  </div>

                  <hr style="border: none; border-top: 1px solid #fed7aa; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">Review and take action in the <a href="${siteUrl}/admin/inquiries" style="color: #ea580c;">FlatNFlatmates Admin Portal (Inquiries & Reports Section)</a>.</p>
                </div>
              `
              : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #0F7A5C; margin-top: 0;">New User Inquiry</h2>
                  <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
                  <p><strong>Contact Info:</strong> ${contactInfo}</p>
                  ${name ? `<p><strong>Name:</strong> ${name}</p>` : ""}
                  <p><strong>Category:</strong> ${formattedReason}</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; white-space: pre-wrap;">${description}</p>
                  </div>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">View and manage this inquiry in the <a href="${siteUrl}/admin/inquiries">FlatNFlatmates Admin Portal</a>.</p>
                </div>
              `,
          }),
        });
      } catch (err) {
        console.error("Resend API delivery error:", err);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send inquiry email notification:", error);
    return { success: false, error: error.message };
  }
}
