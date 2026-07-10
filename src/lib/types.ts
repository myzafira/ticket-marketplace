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
  seller: { handle: string };
  order?: {
    id: string;
    totalCents: number;
    platformFeeCents: number;
    sellerPayoutCents: number;
    buyer: { handle: string };
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
  buyer: { handle: string };
  fulfillingListings?: { id: string; priceCents: number }[];
};
