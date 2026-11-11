/**
 * Refund Eligibility and Refund Amount, as defined in GLOSSARY.md.
 * Pure functions only — the database lookups live in refunds.server.ts.
 */

export const REFUND_WINDOW_DAYS = 14;
export const REFUND_WATCH_LIMIT_SECONDS = 2 * 60 * 60;
export const REFUND_COMPLETION_LIMIT = 0.5;

// The Refund Window is counted in whole calendar days, not hours — someone
// who buys at 23:00 still gets the whole of their fourteenth day.
export function toDayString(when: Date): string {
  const year = when.getFullYear();
  const month = String(when.getMonth() + 1).padStart(2, "0");
  const day = String(when.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function lastDayOfRefundWindow(purchasedAt: Date): string {
  const deadline = new Date(purchasedAt);
  deadline.setDate(deadline.getDate() + REFUND_WINDOW_DAYS);
  return toDayString(deadline);
}

export function isRefundWindowOpen(purchasedAt: Date, today: Date): boolean {
  const day = toDayString(today);
  return (
    day >= toDayString(purchasedAt) && day <= lastDayOfRefundWindow(purchasedAt)
  );
}

/** The amount paid per Seat, times the Seats being given back. */
export function teamRefundAmount(input: {
  amountPaid: number;
  totalSeats: number;
  seatsGivenBack: number;
}): number {
  if (input.totalSeats <= 0) return 0;
  return Math.round(
    (input.amountPaid * input.seatsGivenBack) / input.totalSeats
  );
}

export type RefundFacts = {
  purchasedAt: Date;
  amountPaid: number;
  today: Date;
  hasRequestedRefund: boolean;
} & (
  | {
      kind: "own";
      watchedSeconds: number;
      completedLessons: number;
      totalLessons: number;
    }
  | {
      kind: "team";
      totalSeats: number;
      unclaimedSeats: number;
    }
);

export type RefundDecision =
  | {
      eligible: true;
      amount: number;
      lastDayOfWindow: string;
      /** Only set for a team Purchase. */
      seatsGivenBack: number | null;
    }
  | { eligible: false; reason: string };

export function decideRefund(facts: RefundFacts): RefundDecision {
  if (facts.hasRequestedRefund) {
    return {
      eligible: false,
      reason: "You already have a Refund Requested on this purchase.",
    };
  }

  if (!isRefundWindowOpen(facts.purchasedAt, facts.today)) {
    return {
      eligible: false,
      reason: `The ${REFUND_WINDOW_DAYS}-day Refund Window has closed.`,
    };
  }

  const lastDayOfWindow = lastDayOfRefundWindow(facts.purchasedAt);

  if (facts.kind === "team") {
    if (facts.unclaimedSeats <= 0) {
      return {
        eligible: false,
        reason: "Every seat on this purchase has been claimed or refunded.",
      };
    }

    return {
      eligible: true,
      amount: teamRefundAmount({
        amountPaid: facts.amountPaid,
        totalSeats: facts.totalSeats,
        seatsGivenBack: facts.unclaimedSeats,
      }),
      lastDayOfWindow,
      seatsGivenBack: facts.unclaimedSeats,
    };
  }

  if (facts.watchedSeconds >= REFUND_WATCH_LIMIT_SECONDS) {
    return {
      eligible: false,
      reason: "You have watched too much of this course to refund it.",
    };
  }

  if (
    facts.totalLessons > 0 &&
    facts.completedLessons / facts.totalLessons >= REFUND_COMPLETION_LIMIT
  ) {
    return {
      eligible: false,
      reason: "You have completed too much of this course to refund it.",
    };
  }

  return {
    eligible: true,
    amount: facts.amountPaid,
    lastDayOfWindow,
    seatsGivenBack: null,
  };
}
