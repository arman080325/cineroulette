import { NextRequest, NextResponse } from "next/server";
import { prisma, InteractionAction } from "@cineroulette/db";
import { trackServerEvent } from "@/lib/analytics-server";

/**
 * POST /api/v1/interactions — Section 17.
 * body: { titleId, action, sessionId? } -> watched / not_interested / saved
 *
 * Section 26 north-star metric: every SAVED/WATCHED counts as a positive
 * outcome, every NOT_INTERESTED counts against it. Tracked here, not just
 * client-side, so the metric is accurate even if a browser tracking call
 * gets blocked (ad blockers routinely block posthog-js).
 */

interface InteractionBody {
  titleId: string;
  action: "WATCHED" | "NOT_INTERESTED" | "SAVED";
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as InteractionBody;

  if (!body.titleId || !body.action) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "titleId and action are required." } },
      { status: 400 }
    );
  }
  if (!Object.values(InteractionAction).includes(body.action as InteractionAction)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: `Unknown action: ${body.action}` } },
      { status: 400 }
    );
  }

  await prisma.userInteraction.create({
    data: {
      titleId: body.titleId,
      action: body.action as InteractionAction,
      sessionId: body.sessionId ?? null,
    },
  });

  const eventName =
    body.action === "SAVED"
      ? "title_saved"
      : body.action === "NOT_INTERESTED"
        ? "title_not_interested"
        : "title_watched";

  await trackServerEvent(body.sessionId ?? "anonymous", eventName, { titleId: body.titleId });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/v1/interactions — un-save.
 * body: { titleId, sessionId }
 *
 * Removes SAVED rows rather than writing a NOT_INTERESTED tombstone:
 * un-saving means "I never meant to bookmark this", which is different from
 * "I actively don't want this recommended again". Conflating them would
 * poison the taste signal the score engine reads later.
 */
export async function DELETE(req: NextRequest) {
  const body = (await req.json()) as { titleId?: string; sessionId?: string };

  if (!body.titleId || !body.sessionId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "titleId and sessionId are required." } },
      { status: 400 }
    );
  }

  await prisma.userInteraction.deleteMany({
    where: { titleId: body.titleId, sessionId: body.sessionId, action: "SAVED" },
  });

  return NextResponse.json({ ok: true });
}