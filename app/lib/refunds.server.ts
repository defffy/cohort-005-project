import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "~/db";
import {
  coupons,
  courses,
  lessonProgress,
  lessons,
  LessonProgressStatus,
  modules,
  purchases,
  refunds,
  RefundStatus,
  videoWatchEvents,
} from "~/db/schema";
import { decideRefund, teamRefundAmount, type RefundDecision } from "./refunds";

type Purchase = typeof purchases.$inferSelect;

function getLatestPurchase(userId: number, courseId: number) {
  return db
    .select()
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.courseId, courseId)))
    .orderBy(sql`${purchases.createdAt} desc`)
    .get();
}

function hasRequestedRefund(purchaseId: number) {
  return !!db
    .select({ id: refunds.id })
    .from(refunds)
    .where(
      and(
        eq(refunds.purchaseId, purchaseId),
        eq(refunds.status, RefundStatus.Requested)
      )
    )
    .get();
}

function getLessonIdsForCourse(courseId: number): number[] {
  return db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId))
    .all()
    .map((row) => row.id);
}

function getCompletedLessonCount(userId: number, lessonIds: number[]) {
  if (lessonIds.length === 0) return 0;

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.status, LessonProgressStatus.Completed),
        inArray(lessonProgress.lessonId, lessonIds)
      )
    )
    .get();

  return result?.count ?? 0;
}

function getSecondsWatched(userId: number, lessonIds: number[]) {
  if (lessonIds.length === 0) return 0;

  const furthestPerLesson = db
    .select({
      furthest: sql<number>`max(${videoWatchEvents.positionSeconds})`,
    })
    .from(videoWatchEvents)
    .where(
      and(
        eq(videoWatchEvents.userId, userId),
        inArray(videoWatchEvents.lessonId, lessonIds)
      )
    )
    .groupBy(videoWatchEvents.lessonId)
    .all();

  return furthestPerLesson.reduce((total, row) => total + row.furthest, 0);
}

function countSeats(purchaseId: number) {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(coupons)
    .where(eq(coupons.purchaseId, purchaseId))
    .get();
  return result?.count ?? 0;
}

/**
 * Seats nobody has Claimed and no Refund has taken. A Seat whose last Refund
 * was Declined is Unclaimed again.
 */
function getUnclaimedSeatIds(purchaseId: number): number[] {
  return db
    .select({ id: coupons.id })
    .from(coupons)
    .leftJoin(refunds, eq(coupons.refundId, refunds.id))
    .where(
      and(
        eq(coupons.purchaseId, purchaseId),
        isNull(coupons.redeemedByUserId),
        or(isNull(coupons.refundId), eq(refunds.status, RefundStatus.Declined))
      )
    )
    .all()
    .map((row) => row.id);
}

export type RefundOffer = {
  purchase: Purchase;
  decision: RefundDecision;
  unclaimedSeatIds: number[];
};

/** What the User is offered for their latest Purchase of a course, if any. */
export function getRefundOffer(
  userId: number,
  courseId: number,
  today: Date = new Date()
): RefundOffer | null {
  const purchase = getLatestPurchase(userId, courseId);
  if (!purchase) return null;

  const base = {
    purchasedAt: new Date(purchase.createdAt),
    amountPaid: purchase.amountPaid,
    today,
    hasRequestedRefund: hasRequestedRefund(purchase.id),
  };

  const totalSeats = countSeats(purchase.id);

  if (totalSeats > 0) {
    const unclaimedSeatIds = getUnclaimedSeatIds(purchase.id);
    return {
      purchase,
      unclaimedSeatIds,
      decision: decideRefund({
        ...base,
        kind: "team",
        totalSeats,
        unclaimedSeats: unclaimedSeatIds.length,
      }),
    };
  }

  const lessonIds = getLessonIdsForCourse(courseId);
  return {
    purchase,
    unclaimedSeatIds: [],
    decision: decideRefund({
      ...base,
      kind: "own",
      watchedSeconds: getSecondsWatched(userId, lessonIds),
      completedLessons: getCompletedLessonCount(userId, lessonIds),
      totalLessons: lessonIds.length,
    }),
  };
}

/** Records a Requested Refund and holds the Seats it gives back. */
export function requestRefund(input: {
  purchaseId: number;
  reason: string;
  seatIds: number[];
}) {
  return db.transaction((tx) => {
    const refund = tx
      .insert(refunds)
      .values({
        purchaseId: input.purchaseId,
        status: RefundStatus.Requested,
        reason: input.reason,
      })
      .returning()
      .get();

    if (input.seatIds.length > 0) {
      tx.update(coupons)
        .set({ refundId: refund.id })
        .where(inArray(coupons.id, input.seatIds))
        .run();
    }

    return refund;
  });
}

/** The Refund Amount of a Refund, from the Seats it covers if it has any. */
function getRefundAmount(refundId: number, purchase: Purchase) {
  const totalSeats = countSeats(purchase.id);
  if (totalSeats === 0) return purchase.amountPaid;

  const covered = db
    .select({ count: sql<number>`count(*)` })
    .from(coupons)
    .where(eq(coupons.refundId, refundId))
    .get();

  return teamRefundAmount({
    amountPaid: purchase.amountPaid,
    totalSeats,
    seatsGivenBack: covered?.count ?? 0,
  });
}

export function getRequestedRefundsForUser(userId: number) {
  const rows = db
    .select({ refund: refunds, purchase: purchases, course: courses })
    .from(refunds)
    .innerJoin(purchases, eq(refunds.purchaseId, purchases.id))
    .innerJoin(courses, eq(purchases.courseId, courses.id))
    .where(
      and(
        eq(purchases.userId, userId),
        eq(refunds.status, RefundStatus.Requested)
      )
    )
    .all();

  return rows.map(({ refund, purchase, course }) => ({
    id: refund.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    amount: getRefundAmount(refund.id, purchase),
    reason: refund.reason,
    requestedAt: refund.requestedAt,
  }));
}

/**
 * Where a Seat stands with Refunds: held by a Requested Refund, gone because
 * of an Approved one, or untouched (no Refund, or its last one was Declined).
 */
export function getSeatRefundState(seat: {
  refundId: number | null;
}): RefundStatus.Requested | RefundStatus.Approved | null {
  if (seat.refundId === null) return null;

  const refund = db
    .select({ status: refunds.status })
    .from(refunds)
    .where(eq(refunds.id, seat.refundId))
    .get();

  if (
    refund?.status === RefundStatus.Requested ||
    refund?.status === RefundStatus.Approved
  ) {
    return refund.status;
  }
  return null;
}

/**
 * Why a Seat cannot be Claimed because of a Refund, or null if no Refund is
 * in the way.
 */
export function getSeatRefundBlock(seat: {
  refundId: number | null;
}): string | null {
  switch (getSeatRefundState(seat)) {
    case RefundStatus.Requested:
      return "This seat is part of a Refund that is waiting on an Admin, so it cannot be claimed right now.";
    case RefundStatus.Approved:
      return "This seat has been refunded and can no longer be claimed.";
    default:
      return null;
  }
}
