import { describe, expect, it } from "vitest";
import {
  decideRefund,
  isRefundWindowOpen,
  lastDayOfRefundWindow,
  teamRefundAmount,
  type RefundFacts,
} from "./refunds";

const purchasedAt = new Date(2026, 10, 1, 23, 0); // 1 Nov, 23:00

function ownFacts(overrides: Partial<RefundFacts> = {}): RefundFacts {
  return {
    kind: "own",
    purchasedAt,
    amountPaid: 7900,
    today: new Date(2026, 10, 5),
    hasRequestedRefund: false,
    watchedSeconds: 0,
    completedLessons: 0,
    totalLessons: 10,
    ...overrides,
  } as RefundFacts;
}

function teamFacts(overrides: Partial<RefundFacts> = {}): RefundFacts {
  return {
    kind: "team",
    purchasedAt,
    amountPaid: 39500,
    today: new Date(2026, 10, 5),
    hasRequestedRefund: false,
    totalSeats: 5,
    unclaimedSeats: 5,
    ...overrides,
  } as RefundFacts;
}

describe("Refund Window", () => {
  it("lasts 14 calendar days including the whole of the last day", () => {
    expect(lastDayOfRefundWindow(purchasedAt)).toBe("2026-11-15");
    expect(isRefundWindowOpen(purchasedAt, new Date(2026, 10, 15, 23, 59))).toBe(
      true
    );
    expect(isRefundWindowOpen(purchasedAt, new Date(2026, 10, 16, 0, 1))).toBe(
      false
    );
  });
});

describe("teamRefundAmount", () => {
  it("is the amount paid per Seat times the Seats given back", () => {
    expect(
      teamRefundAmount({ amountPaid: 39500, totalSeats: 5, seatsGivenBack: 3 })
    ).toBe(23700);
  });
});

describe("decideRefund for a Purchase for the User's own access", () => {
  it("refunds the amount paid", () => {
    expect(decideRefund(ownFacts())).toEqual({
      eligible: true,
      amount: 7900,
      lastDayOfWindow: "2026-11-15",
      seatsGivenBack: null,
    });
  });

  it("is not eligible once a Refund is already Requested", () => {
    expect(decideRefund(ownFacts({ hasRequestedRefund: true })).eligible).toBe(
      false
    );
  });

  it("is not eligible after the Refund Window closes", () => {
    expect(
      decideRefund(ownFacts({ today: new Date(2026, 10, 16) })).eligible
    ).toBe(false);
  });

  it("is not eligible after 2 hours watched", () => {
    expect(
      decideRefund(ownFacts({ watchedSeconds: 2 * 60 * 60 })).eligible
    ).toBe(false);
  });

  it("is not eligible once half the lessons are completed", () => {
    expect(decideRefund(ownFacts({ completedLessons: 5 })).eligible).toBe(
      false
    );
    expect(decideRefund(ownFacts({ completedLessons: 4 })).eligible).toBe(true);
  });
});

describe("decideRefund for a team Purchase", () => {
  it("refunds only the Unclaimed Seats", () => {
    expect(decideRefund(teamFacts({ unclaimedSeats: 3 }))).toEqual({
      eligible: true,
      amount: 23700,
      lastDayOfWindow: "2026-11-15",
      seatsGivenBack: 3,
    });
  });

  it("is not eligible when every Seat is Claimed", () => {
    expect(decideRefund(teamFacts({ unclaimedSeats: 0 })).eligible).toBe(false);
  });

  it("is not eligible after the Refund Window closes", () => {
    expect(
      decideRefund(teamFacts({ today: new Date(2026, 10, 16) })).eligible
    ).toBe(false);
  });
});
