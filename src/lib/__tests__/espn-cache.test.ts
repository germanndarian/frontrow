import { describe, it, expect, vi, beforeEach } from "vitest";

/* `unstable_cache` needs the Next request context, which doesn't exist under
   Vitest — stub it to pass the builder straight through. The behaviour under
   test is the last-known-good fallback around it, not Next's caching. */
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

const { espnCached } = await import("@/lib/espn/client");

describe("espnCached", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fresh data and marks it not stale", async () => {
    const res = await espnCached(["t", "fresh"], 60, async () => ({ n: 1 }));
    expect(res).toEqual({ data: { n: 1 }, stale: false });
  });

  it("falls back to the last good value when the upstream read fails", async () => {
    const key = ["t", "fallback"];
    await espnCached(key, 60, async () => ({ n: 1 }));

    const res = await espnCached(key, 60, async () => {
      throw new Error("ESPN 403");
    });
    expect(res).toEqual({ data: { n: 1 }, stale: true });
  });

  it("throws when it fails with nothing cached to fall back on", async () => {
    await expect(
      espnCached(["t", "cold"], 60, async () => {
        throw new Error("ESPN 403");
      }),
    ).rejects.toThrow("ESPN 403");
  });

  it("keeps separate entries per key", async () => {
    await espnCached(["t", "a"], 60, async () => "a-value");
    await espnCached(["t", "b"], 60, async () => "b-value");

    const a = await espnCached(["t", "a"], 60, async () => {
      throw new Error("down");
    });
    expect(a).toEqual({ data: "a-value", stale: true });
  });

  it("refreshes the fallback after a later success", async () => {
    const key = ["t", "refresh"];
    await espnCached(key, 60, async () => 1);
    await espnCached(key, 60, async () => 2);

    const res = await espnCached(key, 60, async () => {
      throw new Error("down");
    });
    expect(res).toEqual({ data: 2, stale: true });
  });
});
