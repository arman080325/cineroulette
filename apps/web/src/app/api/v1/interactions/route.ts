import { NextRequest, NextResponse } from "next/server";
import { prisma, InteractionAction } from "@cineroulette/db";

/**
 * POST /api/v1/interactions — Section 17.
 * body: { titleId, action, sessionId? } -> watched / not_interested / saved
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

  return NextResponse.json({ ok: true });
}