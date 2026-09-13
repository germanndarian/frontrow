import { describe, it, expect, beforeEach } from "vitest";
import { clientKey, rateLimit, rateLimited, resetRateLimits } from "@/lib/rate-limit";

beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("serves a normal client without ever getting close", () => {
    // The iOS app and the website both poll every 30s; a heavy user asking
    // for four leagues makes a handful of requests a minute.
    const now = Date.now();
    for (let i = 0; i < 20; i++) {
      expect(rateLimit("1.1.1.1", now + i * 1000).ok).toBe(true);
    }
  });

  it("turns away a client past the budget", () => {
    const now = Date.now();
    for (let i = 0; i < 120; i++) expect(rateLimit("2.2.2.2", now).ok).toBe(true);
    const over = rateLimit("2.2.2.2", now);
    expect(over.ok).toBe(false);
    expect(over.remaining).toBe(0);
    expect(over.resetIn).toBeGreaterThan(0);
  });

  it("lets them back in on the next window", () => {
    const now = Date.now();
    for (let i = 0; i < 121; i++) rateLimit("3.3.3.3", now);
    expect(rateLimit("3.3.3.3", now).ok).toBe(false);
    expect(rateLimit("3.3.3.3", now + 60_001).ok).toBe(true);
  });

  it("counts each client on its own", () => {
    const now = Date.now();
    for (let i = 0; i < 121; i++) rateLimit("4.4.4.4", now);
    expect(rateLimit("4.4.4.4", now).ok).toBe(false);
    expect(rateLimit("5.5.5.5", now).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("takes the left-most forwarded address, which is the client", () => {
    const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1, 10.0.0.2" });
    expect(clientKey(headers)).toBe("9.9.9.9");
  });

  it("falls back through x-real-ip to a shared bucket", () => {
    expect(clientKey(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});

describe("rateLimited", () => {
  const req = (ip: string) => new Request("https://x/api", { headers: { "x-forwarded-for": ip } });

  it("says nothing at all while the client is within budget", () => {
    expect(rateLimited(req("6.6.6.6"))).toBeNull();
  });

  it("answers 429 with a Retry-After once it isn't", async () => {
    for (let i = 0; i < 120; i++) rateLimited(req("7.7.7.7"));
    const res = rateLimited(req("7.7.7.7"));
    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get("retry-after"))).toBeGreaterThan(0);
    await expect(res?.json()).resolves.toEqual({ error: "rate_limited" });
  });
});
