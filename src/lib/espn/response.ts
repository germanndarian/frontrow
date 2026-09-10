import { NextResponse } from "next/server";
import { STALE_HEADER } from "@/lib/upstream";
import type { Cached } from "./client";

/** JSON response for a cached surface, tagged when it's last-known-good data
    served because ESPN was unreachable. */
export function jsonCached<R>({ data, stale }: Cached<R>) {
  return NextResponse.json(
    data,
    stale ? { headers: { [STALE_HEADER]: "1" } } : undefined,
  );
}
