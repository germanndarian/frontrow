import type { FollowedPlayer, FollowedTeam, LeagueId } from "./types";
import { headshot, logo, ncaaLogo } from "./mock";

/* ───────────────────────────────────────────────────────────────────────────
   Selection catalog for onboarding. Teams for all four leagues (searchable),
   plus a curated pool of notable players. The four marquee entries reuse the
   same ids as the rich dashboard data (Yankees 10, Oilers 6, Eagles 21,
   Texas 251; Judge 33192, McDavid 3895074, Hurts 4040715, Manning 4870906) so
   picking them surfaces full stats. Any other pick gets a graceful placeholder
   card until live data is wired up.
   ─────────────────────────────────────────────────────────────────────────── */

export interface CatalogTeam extends FollowedTeam {
  name: string;
}
export interface CatalogPlayer extends FollowedPlayer {
  teamId: string;
}

type Prefix = "mlb" | "nhl" | "nfl" | "ncaa";

function t(
  league: LeagueId,
  prefix: Prefix,
  id: string,
  abbr: string,
  displayName: string,
  color = "#676d76",
): CatalogTeam {
  return {
    league,
    teamId: id,
    abbreviation: abbr,
    displayName,
    name: displayName.split(" ").pop()!,
    color,
    logo: prefix === "ncaa" ? ncaaLogo(id) : logo(prefix, abbr.toLowerCase()),
  };
}

const MLB: CatalogTeam[] = [
  t("mlb", "mlb", "29", "ARI", "Arizona Diamondbacks", "#a71930"),
  t("mlb", "mlb", "15", "ATL", "Atlanta Braves", "#ce1141"),
  t("mlb", "mlb", "1", "BAL", "Baltimore Orioles", "#df4601"),
  t("mlb", "mlb", "2", "BOS", "Boston Red Sox", "#bd3039"),
  t("mlb", "mlb", "16", "CHC", "Chicago Cubs", "#0e3386"),
  t("mlb", "mlb", "4", "CWS", "Chicago White Sox", "#27251f"),
  t("mlb", "mlb", "17", "CIN", "Cincinnati Reds", "#c6011f"),
  t("mlb", "mlb", "5", "CLE", "Cleveland Guardians", "#0c2340"),
  t("mlb", "mlb", "27", "COL", "Colorado Rockies", "#33006f"),
  t("mlb", "mlb", "6", "DET", "Detroit Tigers", "#0c2340"),
  t("mlb", "mlb", "18", "HOU", "Houston Astros", "#002d62"),
  t("mlb", "mlb", "7", "KC", "Kansas City Royals", "#004687"),
  t("mlb", "mlb", "3", "LAA", "Los Angeles Angels", "#ba0021"),
  t("mlb", "mlb", "19", "LAD", "Los Angeles Dodgers", "#005a9c"),
  t("mlb", "mlb", "28", "MIA", "Miami Marlins", "#00a3e0"),
  t("mlb", "mlb", "8", "MIL", "Milwaukee Brewers", "#12284b"),
  t("mlb", "mlb", "9", "MIN", "Minnesota Twins", "#002b5c"),
  t("mlb", "mlb", "21", "NYM", "New York Mets", "#002d72"),
  t("mlb", "mlb", "10", "NYY", "New York Yankees", "#0c2340"),
  t("mlb", "mlb", "11", "ATH", "Athletics", "#003831"),
  t("mlb", "mlb", "22", "PHI", "Philadelphia Phillies", "#e81828"),
  t("mlb", "mlb", "23", "PIT", "Pittsburgh Pirates", "#27251f"),
  t("mlb", "mlb", "25", "SD", "San Diego Padres", "#2f241d"),
  t("mlb", "mlb", "26", "SF", "San Francisco Giants", "#fd5a1e"),
  t("mlb", "mlb", "12", "SEA", "Seattle Mariners", "#0c2c56"),
  t("mlb", "mlb", "24", "STL", "St. Louis Cardinals", "#c41e3a"),
  t("mlb", "mlb", "30", "TB", "Tampa Bay Rays", "#092c5c"),
  t("mlb", "mlb", "13", "TEX", "Texas Rangers", "#003278"),
  t("mlb", "mlb", "14", "TOR", "Toronto Blue Jays", "#134a8e"),
  t("mlb", "mlb", "20", "WSH", "Washington Nationals", "#ab0003"),
];

const NHL: CatalogTeam[] = [
  t("nhl", "nhl", "ana", "ANA", "Anaheim Ducks", "#f47a38"),
  t("nhl", "nhl", "bos", "BOS", "Boston Bruins", "#fcb514"),
  t("nhl", "nhl", "buf", "BUF", "Buffalo Sabres", "#003087"),
  t("nhl", "nhl", "cgy", "CGY", "Calgary Flames", "#c8102e"),
  t("nhl", "nhl", "car", "CAR", "Carolina Hurricanes", "#cc0000"),
  t("nhl", "nhl", "chi", "CHI", "Chicago Blackhawks", "#cf0a2c"),
  t("nhl", "nhl", "17", "COL", "Colorado Avalanche", "#6f263d"),
  t("nhl", "nhl", "cbj", "CBJ", "Columbus Blue Jackets", "#002654"),
  t("nhl", "nhl", "25", "DAL", "Dallas Stars", "#006847"),
  t("nhl", "nhl", "det", "DET", "Detroit Red Wings", "#ce1126"),
  t("nhl", "nhl", "6", "EDM", "Edmonton Oilers", "#fc4c02"),
  t("nhl", "nhl", "26", "FLA", "Florida Panthers", "#c8102e"),
  t("nhl", "nhl", "la", "LA", "Los Angeles Kings", "#111111"),
  t("nhl", "nhl", "min", "MIN", "Minnesota Wild", "#154734"),
  t("nhl", "nhl", "mtl", "MTL", "Montreal Canadiens", "#af1e2d"),
  t("nhl", "nhl", "nsh", "NSH", "Nashville Predators", "#ffb81c"),
  t("nhl", "nhl", "nj", "NJ", "New Jersey Devils", "#ce1126"),
  t("nhl", "nhl", "nyr", "NYR", "New York Rangers", "#0038a8"),
  t("nhl", "nhl", "ott", "OTT", "Ottawa Senators", "#c52032"),
  t("nhl", "nhl", "phi", "PHI", "Philadelphia Flyers", "#f74902"),
  t("nhl", "nhl", "pit", "PIT", "Pittsburgh Penguins", "#ffb81c"),
  t("nhl", "nhl", "sj", "SJ", "San Jose Sharks", "#006d75"),
  t("nhl", "nhl", "sea", "SEA", "Seattle Kraken", "#99d9d9"),
  t("nhl", "nhl", "stl", "STL", "St. Louis Blues", "#002f87"),
  t("nhl", "nhl", "tb", "TB", "Tampa Bay Lightning", "#002868"),
  t("nhl", "nhl", "tor", "TOR", "Toronto Maple Leafs", "#00205b"),
  t("nhl", "nhl", "van", "VAN", "Vancouver Canucks", "#00205b"),
  t("nhl", "nhl", "vgk", "VGK", "Vegas Golden Knights", "#b4975a"),
  t("nhl", "nhl", "wsh", "WSH", "Washington Capitals", "#041e42"),
  t("nhl", "nhl", "wpg", "WPG", "Winnipeg Jets", "#041e42"),
];

const NFL: CatalogTeam[] = [
  t("nfl", "nfl", "ari", "ARI", "Arizona Cardinals", "#97233f"),
  t("nfl", "nfl", "atl", "ATL", "Atlanta Falcons", "#a71930"),
  t("nfl", "nfl", "bal", "BAL", "Baltimore Ravens", "#241773"),
  t("nfl", "nfl", "buf", "BUF", "Buffalo Bills", "#00338d"),
  t("nfl", "nfl", "car", "CAR", "Carolina Panthers", "#0085ca"),
  t("nfl", "nfl", "chi", "CHI", "Chicago Bears", "#0b162a"),
  t("nfl", "nfl", "cin", "CIN", "Cincinnati Bengals", "#fb4f14"),
  t("nfl", "nfl", "cle", "CLE", "Cleveland Browns", "#311d00"),
  t("nfl", "nfl", "dal", "DAL", "Dallas Cowboys", "#041e42"),
  t("nfl", "nfl", "den", "DEN", "Denver Broncos", "#fb4f14"),
  t("nfl", "nfl", "det", "DET", "Detroit Lions", "#0076b6"),
  t("nfl", "nfl", "gb", "GB", "Green Bay Packers", "#203731"),
  t("nfl", "nfl", "hou", "HOU", "Houston Texans", "#03202f"),
  t("nfl", "nfl", "ind", "IND", "Indianapolis Colts", "#002c5f"),
  t("nfl", "nfl", "jax", "JAX", "Jacksonville Jaguars", "#006778"),
  t("nfl", "nfl", "kc", "KC", "Kansas City Chiefs", "#e31837"),
  t("nfl", "nfl", "lv", "LV", "Las Vegas Raiders", "#000000"),
  t("nfl", "nfl", "lac", "LAC", "Los Angeles Chargers", "#0080c6"),
  t("nfl", "nfl", "lar", "LAR", "Los Angeles Rams", "#003594"),
  t("nfl", "nfl", "mia", "MIA", "Miami Dolphins", "#008e97"),
  t("nfl", "nfl", "min", "MIN", "Minnesota Vikings", "#4f2683"),
  t("nfl", "nfl", "ne", "NE", "New England Patriots", "#002244"),
  t("nfl", "nfl", "no", "NO", "New Orleans Saints", "#d3bc8d"),
  t("nfl", "nfl", "nyg", "NYG", "New York Giants", "#0b2265"),
  t("nfl", "nfl", "nyj", "NYJ", "New York Jets", "#125740"),
  t("nfl", "nfl", "21", "PHI", "Philadelphia Eagles", "#004c54"),
  t("nfl", "nfl", "pit", "PIT", "Pittsburgh Steelers", "#ffb612"),
  t("nfl", "nfl", "sf", "SF", "San Francisco 49ers", "#aa0000"),
  t("nfl", "nfl", "sea", "SEA", "Seattle Seahawks", "#002244"),
  t("nfl", "nfl", "tb", "TB", "Tampa Bay Buccaneers", "#d50a0a"),
  t("nfl", "nfl", "ten", "TEN", "Tennessee Titans", "#0c2340"),
  t("nfl", "nfl", "wsh", "WSH", "Washington Commanders", "#5a1414"),
];

const NCAAF: CatalogTeam[] = [
  t("college-football", "ncaa", "251", "TEX", "Texas Longhorns", "#bf5700"),
  t("college-football", "ncaa", "61", "UGA", "Georgia Bulldogs", "#ba0c2f"),
  t("college-football", "ncaa", "333", "ALA", "Alabama Crimson Tide", "#9e1b32"),
  t("college-football", "ncaa", "194", "OSU", "Ohio State Buckeyes", "#bb0000"),
  t("college-football", "ncaa", "130", "MICH", "Michigan Wolverines", "#00274c"),
  t("college-football", "ncaa", "2483", "ORE", "Oregon Ducks", "#154733"),
  t("college-football", "ncaa", "87", "ND", "Notre Dame Fighting Irish", "#0c2340"),
  t("college-football", "ncaa", "213", "PSU", "Penn State Nittany Lions", "#041e42"),
  t("college-football", "ncaa", "99", "LSU", "LSU Tigers", "#461d7c"),
  t("college-football", "ncaa", "2633", "TENN", "Tennessee Volunteers", "#ff8200"),
  t("college-football", "ncaa", "201", "OU", "Oklahoma Sooners", "#841617"),
  t("college-football", "ncaa", "245", "TAM", "Texas A&M Aggies", "#500000"),
  t("college-football", "ncaa", "30", "USC", "USC Trojans", "#990000"),
  t("college-football", "ncaa", "57", "FLA", "Florida Gators", "#0021a5"),
  t("college-football", "ncaa", "52", "FSU", "Florida State Seminoles", "#782f40"),
  t("college-football", "ncaa", "228", "CLEM", "Clemson Tigers", "#f56600"),
  t("college-football", "ncaa", "2", "AUB", "Auburn Tigers", "#0c2340"),
  t("college-football", "ncaa", "145", "MISS", "Ole Miss Rebels", "#ce1126"),
  t("college-football", "ncaa", "2390", "MIA", "Miami Hurricanes", "#f47321"),
  t("college-football", "ncaa", "264", "WASH", "Washington Huskies", "#4b2e83"),
  t("college-football", "ncaa", "158", "NEB", "Nebraska Cornhuskers", "#e41c38"),
  t("college-football", "ncaa", "275", "WIS", "Wisconsin Badgers", "#c5050c"),
];

export const TEAMS_BY_LEAGUE: Record<LeagueId, CatalogTeam[]> = {
  // NBA onboarding is served live from ESPN; the offline catalog stays empty.
  nba: [],
  mlb: MLB,
  nhl: NHL,
  nfl: NFL,
  "college-football": NCAAF,
};

/* ── Players ────────────────────────────────────────────────────────────── */

function p(
  league: LeagueId,
  sport: "mlb" | "nhl" | "nfl" | "college-football",
  id: string,
  fullName: string,
  teamId: string,
  teamAbbr: string,
  position: string,
): CatalogPlayer {
  return {
    league,
    id,
    fullName,
    teamId,
    teamAbbr,
    position,
    headshot: headshot(sport, id),
  };
}

export const PLAYERS_BY_LEAGUE: Record<LeagueId, CatalogPlayer[]> = {
  nba: [],
  mlb: [
    p("mlb", "mlb", "33192", "Aaron Judge", "10", "NYY", "RF"),
    p("mlb", "mlb", "39832", "Shohei Ohtani", "19", "LAD", "DH"),
    p("mlb", "mlb", "33039", "Mookie Betts", "19", "LAD", "SS"),
    p("mlb", "mlb", "30193", "Freddie Freeman", "19", "LAD", "1B"),
    p("mlb", "mlb", "36969", "Juan Soto", "21", "NYM", "RF"),
    p("mlb", "mlb", "32158", "Bryce Harper", "22", "PHI", "1B"),
    p("mlb", "mlb", "42403", "Bobby Witt Jr.", "7", "KC", "SS"),
    p("mlb", "mlb", "30155", "Jose Ramirez", "5", "CLE", "3B"),
    p("mlb", "mlb", "32691", "Corbin Carroll", "29", "ARI", "OF"),
    p("mlb", "mlb", "41292", "Gunnar Henderson", "1", "BAL", "SS"),
  ],
  nhl: [
    p("nhl", "nhl", "3895074", "Connor McDavid", "6", "EDM", "C"),
    p("nhl", "nhl", "3114727", "Leon Draisaitl", "6", "EDM", "C"),
    p("nhl", "nhl", "3041969", "Nathan MacKinnon", "17", "COL", "C"),
    p("nhl", "nhl", "4233563", "Cale Makar", "17", "COL", "D"),
    p("nhl", "nhl", "4024123", "Auston Matthews", "tor", "TOR", "C"),
    p("nhl", "nhl", "3114", "Sidney Crosby", "pit", "PIT", "C"),
    p("nhl", "nhl", "3069750", "Nikita Kucherov", "tb", "TB", "RW"),
    p("nhl", "nhl", "3899937", "Connor Hellebuyck", "wpg", "WPG", "G"),
  ],
  nfl: [
    p("nfl", "nfl", "4040715", "Jalen Hurts", "21", "PHI", "QB"),
    p("nfl", "nfl", "3929630", "Saquon Barkley", "21", "PHI", "RB"),
    p("nfl", "nfl", "3139477", "Patrick Mahomes", "kc", "KC", "QB"),
    p("nfl", "nfl", "3918298", "Josh Allen", "buf", "BUF", "QB"),
    p("nfl", "nfl", "3916387", "Lamar Jackson", "bal", "BAL", "QB"),
    p("nfl", "nfl", "4241389", "CeeDee Lamb", "dal", "DAL", "WR"),
    p("nfl", "nfl", "4362628", "Ja'Marr Chase", "cin", "CIN", "WR"),
    p("nfl", "nfl", "4361423", "Micah Parsons", "dal", "DAL", "LB"),
  ],
  "college-football": [
    p("college-football", "college-football", "4870906", "Arch Manning", "251", "TEX", "QB"),
    p("college-football", "college-football", "4685569", "Drew Allar", "213", "PSU", "QB"),
    p("college-football", "college-football", "4429084", "Carson Beck", "61", "UGA", "QB"),
    p("college-football", "college-football", "5083397", "Jeremiah Smith", "194", "OSU", "WR"),
    p("college-football", "college-football", "4432762", "Caleb Downs", "194", "OSU", "S"),
  ],
};

export const ALL_TEAMS: CatalogTeam[] = [...MLB, ...NHL, ...NFL, ...NCAAF];

export function findCatalogTeam(teamId: string): CatalogTeam | undefined {
  return ALL_TEAMS.find((t) => t.teamId === teamId);
}

export function findCatalogPlayer(id: string): CatalogPlayer | undefined {
  return Object.values(PLAYERS_BY_LEAGUE)
    .flat()
    .find((p) => p.id === id);
}
