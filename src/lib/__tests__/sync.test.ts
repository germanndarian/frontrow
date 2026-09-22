import { describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadUserData, pushPreferences, pushSettings } from "@/lib/sync";
import { usePreferences } from "@/lib/store";
import { useSettings } from "@/lib/settings";

/**
 * A tiny stand-in for the Supabase query builder — enough to exercise the
 * snake_case ⇄ camelCase mapping in sync.ts without any network. `select().eq()
 * .maybeSingle()` returns the seeded row; `upsert()` is captured.
 */
function fakeSupabase(rows: Record<string, unknown>) {
  const upserts: { table: string; row: Record<string, unknown> }[] = [];
  const client = {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle() {
          return Promise.resolve({ data: rows[table] ?? null, error: null });
        },
        upsert(row: Record<string, unknown>) {
          upserts.push({ table, row });
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { client: client as unknown as SupabaseClient, upserts };
}

beforeEach(() => {
  usePreferences.setState({
    sports: [],
    leagues: [],
    teams: [],
    players: [],
    onboarded: false,
  });
  useSettings.getState().reset();
});

describe("loadUserData", () => {
  it("populates the stores from DB rows", async () => {
    const { client } = fakeSupabase({
      preferences: {
        user_id: "u1",
        sports: ["baseball"],
        leagues: ["mlb"],
        teams: [],
        players: [],
        onboarded: true,
      },
      settings: {
        user_id: "u1",
        accent: "violet",
        radius: "round",
        density: "compact",
        reduce_motion: true,
        background_glow: false,
        greeting_name: "Sam",
        default_league: "mlb",
        hidden_sections: ["players"],
      },
    });

    await loadUserData(client, "u1");

    const prefs = usePreferences.getState();
    expect(prefs.sports).toEqual(["baseball"]);
    expect(prefs.onboarded).toBe(true);

    const settings = useSettings.getState();
    expect(settings.accent).toBe("violet");
    expect(settings.reduceMotion).toBe(true);
    expect(settings.backgroundGlow).toBe(false);
    expect(settings.greetingName).toBe("Sam");
    expect(settings.hiddenSections).toEqual(["players"]);
  });

  it("leaves defaults when the user has no rows yet", async () => {
    const { client } = fakeSupabase({});
    await loadUserData(client, "new-user");
    expect(usePreferences.getState().sports).toEqual([]);
    expect(useSettings.getState().accent).toBe("cobalt");
  });
});

describe("pushSettings", () => {
  it("maps store fields to snake_case columns", async () => {
    useSettings.getState().load({
      appearance: "dark",
      accent: "emerald",
      radius: "sharp",
      density: "compact",
      reduceMotion: true,
      backgroundGlow: false,
      greetingName: "Lee",
      defaultLeague: "nhl",
      hiddenSections: ["standings"],
    });
    const { client, upserts } = fakeSupabase({});

    await pushSettings(client, "u1");

    expect(upserts).toHaveLength(1);
    expect(upserts[0].table).toBe("settings");
    expect(upserts[0].row).toMatchObject({
      user_id: "u1",
      appearance: "dark",
      accent: "emerald",
      reduce_motion: true,
      background_glow: false,
      greeting_name: "Lee",
      default_league: "nhl",
      hidden_sections: ["standings"],
    });
  });
});

describe("pushPreferences", () => {
  it("writes the current follows for the user", async () => {
    usePreferences.setState({
      sports: ["hockey"],
      leagues: ["nhl"],
      teams: [],
      players: [],
      onboarded: true,
    });
    const { client, upserts } = fakeSupabase({});

    await pushPreferences(client, "u9");

    expect(upserts[0].table).toBe("preferences");
    expect(upserts[0].row).toMatchObject({
      user_id: "u9",
      sports: ["hockey"],
      leagues: ["nhl"],
      onboarded: true,
    });
  });
});

/* ── Followed players, from either client ─────────────────────────────── */

describe("followed players across the website and the iPhone app", () => {
  const phonePlayer = {
    league: "mlb",
    playerId: "33192",
    fullName: "Aaron Judge",
    teamAbbr: "NYY",
    headshot: "https://a.espncdn.com/i/headshots/mlb/players/full/33192.png",
    position: "RF",
  };

  it("reads a player the phone saved, under its playerId", async () => {
    const { client } = fakeSupabase({
      preferences: { user_id: "u1", sports: ["baseball"], leagues: ["mlb"], teams: [], players: [phonePlayer], onboarded: true },
    });
    await loadUserData(client, "u1");
    const [judge] = usePreferences.getState().players;
    expect(judge.id).toBe("33192");
    expect(judge).not.toHaveProperty("playerId");
  });

  it("still reads a player the website saved, under its id", async () => {
    const { client } = fakeSupabase({
      preferences: { user_id: "u1", sports: [], leagues: ["mlb"], teams: [], players: [{ ...phonePlayer, playerId: undefined, id: "33192" }], onboarded: true },
    });
    await loadUserData(client, "u1");
    expect(usePreferences.getState().players.map((p) => p.id)).toEqual(["33192"]);
  });

  it("leaves out a player saved with no id at all, rather than asking for 'undefined'", async () => {
    const { client } = fakeSupabase({
      preferences: { user_id: "u1", sports: [], leagues: ["mlb"], teams: [], players: [{ ...phonePlayer, playerId: undefined }], onboarded: true },
    });
    await loadUserData(client, "u1");
    expect(usePreferences.getState().players).toEqual([]);
  });

  it("saves players under both keys, so the phone can read them too", async () => {
    usePreferences.setState({
      players: [{ league: "mlb", id: "33192", fullName: "Aaron Judge", teamAbbr: "NYY", headshot: "", position: "RF" }],
    });
    const { client, upserts } = fakeSupabase({});
    await pushPreferences(client, "u1");
    const saved = (upserts[0].row.players as Record<string, string>[])[0];
    expect(saved.id).toBe("33192");
    expect(saved.playerId).toBe("33192");
  });
});
