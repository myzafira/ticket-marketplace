import type { UserRole } from "@prisma/client";
import { isAdminRole } from "@/lib/permissions";

// VIP perk: a newly created listing is visible only to VIP buyers (plus the
// seller and admins) for a configurable window after creation. The window is
// stored as an absolute timestamp on the listing (Listing.vipEarlyAccessUntil,
// computed from settings.vipEarlyAccessMinutes at creation time) rather than
// derived live, so a later settings change doesn't retroactively alter an
// already-posted listing's window.
export function canAccessListing(
  listing: { vipEarlyAccessUntil: Date | null; sellerId: string },
  viewer: { id: string; role: UserRole } | null
): boolean {
  if (!listing.vipEarlyAccessUntil || listing.vipEarlyAccessUntil <= new Date()) {
    return true;
  }
  if (!viewer) return false;
  if (viewer.id === listing.sellerId) return true;
  if (viewer.role === "VIP_USER") return true;
  return isAdminRole(viewer.role);
}
