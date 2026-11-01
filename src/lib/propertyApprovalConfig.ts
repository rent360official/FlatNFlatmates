export const PROPERTY_APPROVAL_MESSAGE_FLAG_KEY = "property_approval_message_template";
export const BULK_PROPERTY_APPROVAL_MESSAGE_FLAG_KEY = "bulk_property_approval_message_template";

export const DEFAULT_APPROVAL_MESSAGE_TEMPLATE = `Hi {{owner_name}}! We have drafted your property listing "{{property_title}}" ({{bhk_config}} in {{locality}}, ₹{{rent_amount}}/mo) on FlatNFlatmates.

Please review your listing details, photos, and make it live in 1-click here:
{{magic_link}}

- FlatNFlatmates Team`;

export const DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE = `Hi {{owner_name}}! We have drafted {{property_count}} property listings for you on FlatNFlatmates.

Please review your properties and make them live in 1-click here:
{{magic_link}}

- FlatNFlatmates Team`;

export interface MessagePlaceholderInfo {
  placeholder: string;
  label: string;
  description: string;
  sampleValue: string;
}

export const AVAILABLE_MESSAGE_PLACEHOLDERS: MessagePlaceholderInfo[] = [
  {
    placeholder: "{{owner_name}}",
    label: "Owner Name",
    description: "Full name of the property owner (falls back to 'Property Owner')",
    sampleValue: "Rajesh Kumar",
  },
  {
    placeholder: "{{property_title}}",
    label: "Property Title",
    description: "Title of the listing",
    sampleValue: "Spacious 2BHK Near Tech Park",
  },
  {
    placeholder: "{{bhk_config}}",
    label: "BHK Config",
    description: "Apartment configuration (e.g., 1BHK, 2BHK, 3BHK)",
    sampleValue: "2BHK",
  },
  {
    placeholder: "{{locality}}",
    label: "Locality",
    description: "Locality name of the property",
    sampleValue: "Hinjewadi Phase 1",
  },
  {
    placeholder: "{{city}}",
    label: "City",
    description: "City name of the property",
    sampleValue: "Pune",
  },
  {
    placeholder: "{{rent_amount}}",
    label: "Rent Amount",
    description: "Monthly rent in INR formatted with commas",
    sampleValue: "28,000",
  },
  {
    placeholder: "{{deposit_amount}}",
    label: "Deposit Amount",
    description: "Security deposit amount in INR formatted with commas",
    sampleValue: "60,000",
  },
  {
    placeholder: "{{magic_link}}",
    label: "Magic Review Link",
    description: "Direct URL for owner verification and 1-click make-live",
    sampleValue: "https://flatnflatmates.com/approve-property/663a9b8f10b74c20",
  },
  {
    placeholder: "{{property_id}}",
    label: "Property ID",
    description: "Unique MongoDB ID or short reference of the property",
    sampleValue: "663a9b8f10b74c20",
  },
];

export const AVAILABLE_BULK_MESSAGE_PLACEHOLDERS: MessagePlaceholderInfo[] = [
  {
    placeholder: "{{owner_name}}",
    label: "Owner Name",
    description: "Full name of the property owner (falls back to 'Property Owner')",
    sampleValue: "Rajesh Kumar",
  },
  {
    placeholder: "{{property_count}}",
    label: "Property Count",
    description: "Total number of properties pending approval",
    sampleValue: "3",
  },
  {
    placeholder: "{{magic_link}}",
    label: "Bulk Magic Link",
    description: "Direct bulk approval URL where owner can select and make live all properties in 1 click",
    sampleValue: "https://flatnflatmates.com/approve-all-property/663a9b8f10b74c20",
  },
  {
    placeholder: "{{user_id}}",
    label: "User ID",
    description: "Unique MongoDB ID of the property owner",
    sampleValue: "663a9b8f10b74c20",
  },
];

export interface FormatMessageParams {
  ownerName?: string;
  propertyTitle?: string;
  bhkConfig?: string;
  localityName?: string;
  cityName?: string;
  rentAmount?: number;
  depositAmount?: number;
  magicLink: string;
  propertyId?: string;
}

export interface FormatBulkMessageParams {
  ownerName?: string;
  propertyCount: number;
  magicLink: string;
  userId?: string;
}

/**
 * Replaces placeholders in the template with actual property & owner data.
 * Supports both {{placeholder}} and {placeholder} syntax.
 */
export function formatPropertyApprovalMessage(
  template: string,
  data: FormatMessageParams
): string {
  const tpl = template || DEFAULT_APPROVAL_MESSAGE_TEMPLATE;
  const ownerName = data.ownerName?.trim() || "Property Owner";
  const propertyTitle = data.propertyTitle || "Untitled Property";
  const bhkConfig = data.bhkConfig || "Flat";
  const locality = data.localityName || "Pune";
  const city = data.cityName || "Pune";
  const rent = typeof data.rentAmount === "number" ? data.rentAmount.toLocaleString("en-IN") : "0";
  const deposit = typeof data.depositAmount === "number" ? data.depositAmount.toLocaleString("en-IN") : "0";
  const magicLink = data.magicLink || "";
  const propertyId = data.propertyId || "";

  return tpl
    .replace(/\{\{\s*owner_name\s*\}\}|\{\s*owner_name\s*\}/gi, ownerName)
    .replace(/\{\{\s*property_title\s*\}\}|\{\s*property_title\s*\}/gi, propertyTitle)
    .replace(/\{\{\s*bhk_config\s*\}\}|\{\s*bhk_config\s*\}/gi, bhkConfig)
    .replace(/\{\{\s*locality\s*\}\}|\{\s*locality\s*\}/gi, locality)
    .replace(/\{\{\s*city\s*\}\}|\{\s*city\s*\}/gi, city)
    .replace(/\{\{\s*rent_amount\s*\}\}|\{\s*rent_amount\s*\}/gi, rent)
    .replace(/\{\{\s*deposit_amount\s*\}\}|\{\s*deposit_amount\s*\}/gi, deposit)
    .replace(/\{\{\s*magic_link\s*\}\}|\{\s*magic_link\s*\}/gi, magicLink)
    .replace(/\{\{\s*property_id\s*\}\}|\{\s*property_id\s*\}/gi, propertyId);
}

/**
 * Replaces placeholders in the bulk approval template with owner data and count.
 */
export function formatBulkPropertyApprovalMessage(
  template: string,
  data: FormatBulkMessageParams
): string {
  const tpl = template || DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE;
  const ownerName = data.ownerName?.trim() || "Property Owner";
  const count = data.propertyCount ? data.propertyCount.toString() : "1";
  const magicLink = data.magicLink || "";
  const userId = data.userId || "";

  return tpl
    .replace(/\{\{\s*owner_name\s*\}\}|\{\s*owner_name\s*\}/gi, ownerName)
    .replace(/\{\{\s*property_count\s*\}\}|\{\s*property_count\s*\}/gi, count)
    .replace(/\{\{\s*magic_link\s*\}\}|\{\s*magic_link\s*\}/gi, magicLink)
    .replace(/\{\{\s*user_id\s*\}\}|\{\s*user_id\s*\}/gi, userId);
}
