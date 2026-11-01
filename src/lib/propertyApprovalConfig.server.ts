import dbConnect from "@/lib/db";
import FeatureFlag from "@/models/FeatureFlag";
import {
  PROPERTY_APPROVAL_MESSAGE_FLAG_KEY,
  BULK_PROPERTY_APPROVAL_MESSAGE_FLAG_KEY,
  DEFAULT_APPROVAL_MESSAGE_TEMPLATE,
  DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE,
} from "./propertyApprovalConfig";

/**
 * Retrieves the configured single property message template from the database (or default).
 * Only to be imported from server components / server actions.
 */
export async function getPropertyApprovalMessageTemplate(): Promise<string> {
  try {
    await dbConnect();
    const flag = await FeatureFlag.findOne({ key: PROPERTY_APPROVAL_MESSAGE_FLAG_KEY }).lean();
    if (flag && typeof flag.value === "string" && flag.value.trim().length > 0) {
      return flag.value;
    }
    return DEFAULT_APPROVAL_MESSAGE_TEMPLATE;
  } catch (err) {
    console.error("Failed to load property approval message template:", err);
    return DEFAULT_APPROVAL_MESSAGE_TEMPLATE;
  }
}

/**
 * Retrieves the configured bulk property message template from the database (or default).
 * Only to be imported from server components / server actions.
 */
export async function getBulkPropertyApprovalMessageTemplate(): Promise<string> {
  try {
    await dbConnect();
    const flag = await FeatureFlag.findOne({ key: BULK_PROPERTY_APPROVAL_MESSAGE_FLAG_KEY }).lean();
    if (flag && typeof flag.value === "string" && flag.value.trim().length > 0) {
      return flag.value;
    }
    return DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE;
  } catch (err) {
    console.error("Failed to load bulk property approval message template:", err);
    return DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE;
  }
}
