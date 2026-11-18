import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function secretMatches(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function extractSecret(request: NextRequest): string {
  const headerSecret = request.headers.get("x-revalidate-secret");
  if (headerSecret) {
    return headerSecret;
  }
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }
  return "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Revalidation is not configured." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!secretMatches(extractSecret(request), expected)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Invalid revalidation secret." } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Expected a JSON request body." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const tags = stringList(record.tags);
  const paths = stringList(record.paths).filter((path) => path.startsWith("/"));

  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json(
      { error: { code: "nothing_to_revalidate", message: "Provide at least one tag or path." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json(
    { revalidated: { tags, paths } },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
