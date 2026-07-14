export type RatingSummary = { average: number | null; count: number };

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
  description: string | null;
  imageUrl: string | null;
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  sellerId: string;
  createdAt: string;
  fulfillsRequestId: string | null;
  seller: {
    handle: string;
    rating?: RatingSummary;
    recentReviews?: ReviewSummary[];
  };
  order?: {
    id: string;
    totalCents: number;
    platformFeeCents: number;
    sellerPayoutCents: number;
    buyer: { handle: string };
    myReview?: { rating: number; comment: string | null } | null;
  } | null;
};

export type Order = {
  id: string;
  totalCents: number;
  platformFeeCents: number;
  sellerPayoutCents: number;
  createdAt: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  listing: Listing;
  myReview?: { rating: number; comment: string | null } | null;
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
