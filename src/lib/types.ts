export type RatingSummary = { average: number | null; count: number };

export type OrderReportReason =
  | "TICKET_NOT_RECEIVED"
  | "WRONG_OR_INVALID_TICKET"
  | "PAYMENT_ISSUE"
  | "OTHER";

export type MyReport = { id: string; status: "OPEN" | "RESOLVED" } | null;

export type ReviewSummary = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { handle: string };
};

export type Listing = {
  id: string;
  title: string;
  eventName: string;
  venue: string;
  eventDate: string;
  section: string | null;
  quantity: number;
  priceCents: number;
  faceValueCents: number | null;
  description: string | null;
  imageUrls: string[];
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  sellerId: string;
  createdAt: string;
  fulfillsRequestId: string | null;
  isFavorited?: boolean;
  myReport?: MyReport;
  // Non-null while this listing is still inside its VIP early-access
  // window — only present in responses to viewers allowed to see it
  // (the seller, a VIP buyer, or an admin).
  vipEarlyAccessUntil?: string | null;
  seller: {
    handle: string;
    rating?: RatingSummary;
    recentReviews?: ReviewSummary[];
    isVerified?: boolean;
    salesCount?: number;
  };
  order?: {
    id: string;
    totalCents: number;
    platformFeeCents: number;
    sellerPayoutCents: number;
    feeDiscountPercent: number;
    vipFeeDiscountPercent: number;
    pointsEarnedByBuyer: number;
    pointsEarnedBySeller: number;
    pointsRedeemedBySeller: number;
    ticketProofUrl: string | null;
    ticketProofCode: string | null;
    buyer: { handle: string };
    myReview?: { rating: number; comment: string | null } | null;
    myReport?: MyReport;
  } | null;
};

export type Order = {
  id: string;
  totalCents: number;
  platformFeeCents: number;
  sellerPayoutCents: number;
  feeDiscountPercent: number;
  vipFeeDiscountPercent: number;
  pointsEarnedByBuyer: number;
  pointsEarnedBySeller: number;
  pointsRedeemedBySeller: number;
  ticketProofUrl: string | null;
  ticketProofCode: string | null;
  createdAt: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  listing: Listing;
  myReview?: { rating: number; comment: string | null } | null;
  myReport?: MyReport;
};

export type BuyRequest = {
  id: string;
  eventName: string;
  venue: string | null;
  eventDate: string;
  quantity: number;
  maxPriceCents: number;
  notes: string | null;
  imageUrl: string | null;
  status: "OPEN" | "FULFILLED" | "CANCELLED";
  buyerId: string;
  createdAt: string;
  buyer: {
    handle: string;
    rating?: RatingSummary;
    recentReviews?: ReviewSummary[];
    isVerified?: boolean;
    purchaseCount?: number;
  };
  fulfillingListings?: { id: string; priceCents: number }[];
};

export type Message = {
  id: string;
  body: string;
  createdAt: string;
  fromMe: boolean;
};

export type ConversationSummary = {
  id: string;
  role?: "buyer" | "seller";
  listing: { id: string; eventName: string };
  otherParty: { handle: string };
  buyer?: { handle: string };
  lastMessage: string | null;
  updatedAt: string;
};
