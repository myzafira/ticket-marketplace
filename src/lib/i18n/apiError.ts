// Maps the (English) error strings returned by API routes to translation
// keys under `errors.*`, so the same string shown to the user gets localized
// without having to touch every route handler. Falls back to the raw
// message from the API when it isn't a recognized string (e.g. a zod
// validation message we haven't mapped, or the moderation/contact-info
// checker's dynamic text) — better an English fallback than a blank error.
const EXACT_MATCH: Record<string, string> = {
  "Not authenticated": "errors.notAuthenticated",
  Forbidden: "errors.forbidden",
  "Invalid input": "errors.invalidInput",
  "Something went wrong": "errors.somethingWentWrong",
  "No image provided": "errors.noImageProvided",
  "Image must be 5MB or smaller": "errors.imageTooLarge",
  "Only JPEG, PNG, WebP, or GIF images are allowed": "errors.invalidImageType",
  "Invalid image URL": "errors.invalidImageUrl",
  "Verify your email before posting a request": "errors.verifyBeforeRequest",
  "Request not found": "errors.requestNotFound",
  "This request is already closed": "errors.requestAlreadyClosed",
  "Invalid email or password": "errors.invalidEmailOrPassword",
  "Order not found": "errors.orderNotFound",
  "Only the seller can upload the ticket for this order":
    "errors.onlySellerCanUploadTicket",
  "This order is no longer active": "errors.orderNoLongerActive",
  "That code is incorrect or has expired": "errors.codeIncorrectOrExpired",
  "An account with this email already exists": "errors.emailAlreadyExists",
  "Verify your email before leaving a review": "errors.verifyBeforeReview",
  "Only completed orders can be reviewed": "errors.onlyCompletedOrdersReviewable",
  "You weren't part of this order": "errors.notPartOfOrder",
  "You already reviewed this order": "errors.alreadyReviewedOrder",
  "Verify your email before filing a report": "errors.verifyBeforeReport",
  "You already have an open report for this order": "errors.alreadyOpenReport",
  "Verify your email before listing a ticket": "errors.verifyBeforeListing",
  "Listing not found": "errors.listingNotFound",
  "Cannot cancel a sold listing": "errors.cannotCancelSoldListing",
  "At least one admin email is required": "errors.adminEmailRequired",
  "You cannot remove your own account from the admin list":
    "errors.cannotRemoveSelfAsAdmin",
  "Current password is incorrect": "errors.currentPasswordIncorrect",
  "Sellers should use the conversations list for this listing":
    "errors.sellersUseConversationList",
  "Verify your email before messaging a seller": "errors.verifyBeforeMessaging",
  "You can't message yourself about your own listing": "errors.cannotMessageSelf",
  "Verify your email before buying a ticket": "errors.verifyBeforeBuying",
  "You cannot buy your own listing": "errors.cannotBuyOwnListing",
  "This listing is no longer available": "errors.listingNoLongerAvailable",
  "Conversation not found": "errors.conversationNotFound",
  "Verify your email before sending a message":
    "errors.verifyBeforeMessagingConversation",
  "The second threshold must be greater than the first":
    "errors.secondThresholdMustExceedFirst",
  "Address looks too short — include street, city, and postal code":
    "errors.addressTooShort",
  "Address should include a house/building or street number":
    "errors.addressNeedsNumber",
  "Address should include a 5-digit postal code": "errors.addressNeedsPostalCode",
  "New passwords don't match": "errors.passwordMismatch",
  "You cannot report your own listing": "errors.cannotReportOwnListing",
  "You already have an open report for this listing": "errors.alreadyOpenListingReport",
};

const QUOTED_EMAIL_RE = /^"(.+)" is not a valid email address$/;

export function translateApiError(
  t: (key: string, vars?: Record<string, string | number>) => string,
  message: string | undefined | null,
  fallback = ""
): string {
  if (!message) return fallback;

  const key = EXACT_MATCH[message];
  if (key) return t(key);

  const emailMatch = message.match(QUOTED_EMAIL_RE);
  if (emailMatch) return t("errors.invalidAdminEmail", { email: emailMatch[1] });

  return message;
}
