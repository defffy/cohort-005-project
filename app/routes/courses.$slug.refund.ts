import { data, redirect } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/courses.$slug.refund";
import { getCurrentUserId } from "~/lib/session";
import { db } from "~/db";
import { courses, users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { parseFormData, parseParams } from "~/lib/validation";
import { getRefundOffer, requestRefund } from "~/lib/refunds.server";
import { formatPrice } from "~/lib/utils";

const refundParamsSchema = z.object({
  slug: z.string().min(1),
});

const refundActionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Tell us a little more about why you want a refund.")
    .max(1000, "Please keep your reason under 1000 characters."),
});

function getCourseBySlug(slug: string) {
  return db.select().from(courses).where(eq(courses.slug, slug)).get();
}

/**
 * The confirmation the User gets in their inbox. There is no mail transport
 * wired up yet, so the built message goes to the server log.
 */
export function buildRefundRequestedEmail(input: {
  userName: string;
  userEmail: string;
  courseTitle: string;
  amount: number;
  seatsGivenBack: number | null;
}) {
  const whatIsGivenBack =
    input.seatsGivenBack === null
      ? `your purchase of "${input.courseTitle}"`
      : `${input.seatsGivenBack} unclaimed ${
          input.seatsGivenBack === 1 ? "seat" : "seats"
        } of "${input.courseTitle}"`;

  return {
    to: input.userEmail,
    subject: `Refund requested — ${input.courseTitle}`,
    body: [
      `Hi ${input.userName},`,
      "",
      `We have your Refund request for ${whatIsGivenBack}.`,
      `The Refund Amount is ${formatPrice(input.amount)}, the amount you paid for what you are giving back.`,
      "",
      "An Admin reviews every Refund by hand. You do not need to do anything else — we will email you again once your Refund is Approved or Declined.",
      "",
      "— The Cadence team",
    ].join("\n"),
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const currentUserId = await getCurrentUserId(request);

  if (!currentUserId) {
    throw data("You must be logged in to request a refund.", { status: 401 });
  }

  const { slug } = parseParams(params, refundParamsSchema);
  const course = getCourseBySlug(slug);

  if (!course) {
    throw data("Course not found", { status: 404 });
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, currentUserId))
    .get();

  if (!user) {
    throw data("User not found", { status: 404 });
  }

  // Only the User who made the Purchase can ask for a Refund on it, so the
  // offer is always for the current User's own latest Purchase.
  const offer = getRefundOffer(currentUserId, course.id);

  if (!offer) {
    throw data("You have not bought this course.", { status: 403 });
  }

  if (!offer.decision.eligible) {
    throw data(offer.decision.reason, { status: 403 });
  }

  const formData = await request.formData();
  const parsed = parseFormData(formData, refundActionSchema);

  if (!parsed.success) {
    return data({ errors: parsed.errors }, { status: 400 });
  }

  requestRefund({
    purchaseId: offer.purchase.id,
    reason: parsed.data.reason,
    seatIds: offer.unclaimedSeatIds,
  });

  const email = buildRefundRequestedEmail({
    userName: user.name,
    userEmail: user.email,
    courseTitle: course.title,
    amount: offer.decision.amount,
    seatsGivenBack: offer.decision.seatsGivenBack,
  });

  console.log(`[email] to=${email.to} subject=${email.subject}\n${email.body}`);

  return redirect("/settings");
}
