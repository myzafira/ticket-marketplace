import { Prisma } from "@prisma/client";

// A findUnique "does this already exist?" check followed by a separate
// create isn't atomic — two near-simultaneous requests (double-click, two
// tabs) can both pass the check and race to insert, so the loser must
// still be handled cleanly via the DB's own unique constraint (P2002)
// rather than surfacing as an unhandled 500.
export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
