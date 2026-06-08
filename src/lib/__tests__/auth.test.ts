import { describe, it, expect, beforeEach } from "vitest";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/store";
import { useSettings } from "@/lib/settings";

beforeEach(() => {
  useAuth.setState({ accounts: {}, session: null, guest: false });
  usePreferences.setState({
    sports: [],
    leagues: [],
    teams: [],
    players: [],
    onboarded: false,
  });
  useSettings.getState().reset();
  localStorage.clear();
});

describe("signUp", () => {
  it("creates an account and opens a session", async () => {
    const res = await useAuth.getState().signUp({
      username: "courtside",
      password: "hunter2",
    });
    expect(res.ok).toBe(true);
    expect(useAuth.getState().session?.userId).toBe("courtside");
    expect(useAuth.getState().accounts["courtside"]).toBeDefined();
  });

  it("never stores the password in clear text", async () => {
    await useAuth.getState().signUp({ username: "abby", password: "hunter2" });
    const account = useAuth.getState().accounts["abby"];
    expect(account.passwordHash).not.toContain("hunter2");
    expect(account.passwordHash.length).toBeGreaterThan(0);
  });

  it("rejects a too-short password", async () => {
    const res = await useAuth.getState().signUp({ username: "abe", password: "123" });
    expect(res.ok).toBe(false);
  });

  it("rejects a duplicate username", async () => {
    await useAuth.getState().signUp({ username: "dup", password: "hunter2" });
    const res = await useAuth.getState().signUp({ username: "DUP", password: "another1" });
    expect(res.ok).toBe(false);
  });
});

describe("logIn", () => {
  beforeEach(async () => {
    await useAuth.getState().signUp({ username: "fan", password: "hunter2" });
    useAuth.getState().logOut();
  });

  it("succeeds with the right password", async () => {
    const res = await useAuth.getState().logIn({ username: "fan", password: "hunter2" });
    expect(res.ok).toBe(true);
    expect(useAuth.getState().session?.userId).toBe("fan");
  });

  it("fails with the wrong password", async () => {
    const res = await useAuth.getState().logIn({ username: "fan", password: "nope" });
    expect(res.ok).toBe(false);
    expect(useAuth.getState().session).toBeNull();
  });

  it("fails for an unknown username", async () => {
    const res = await useAuth.getState().logIn({ username: "ghost", password: "hunter2" });
    expect(res.ok).toBe(false);
  });

  it("issues a longer session when remembered", async () => {
    const res = await useAuth.getState().logIn({
      username: "fan",
      password: "hunter2",
      remember: true,
    });
    expect(res.ok).toBe(true);
    const session = useAuth.getState().session!;
    expect(session.expiresAt).toBeGreaterThan(Date.now());
    expect(session.remember).toBe(true);
  });
});

describe("logOut", () => {
  it("clears the session and resets follows", async () => {
    await useAuth.getState().signUp({ username: "leaver", password: "hunter2" });
    usePreferences.getState().toggleSport("baseball");
    useAuth.getState().logOut();
    expect(useAuth.getState().session).toBeNull();
    expect(usePreferences.getState().sports).toEqual([]);
  });
});
