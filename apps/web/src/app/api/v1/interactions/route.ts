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