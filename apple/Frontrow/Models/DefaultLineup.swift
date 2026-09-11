import Foundation

/// The same sample lineup the web app offers during onboarding. Stands in
/// for the account's follows until Phase 3 syncs them from Supabase.
enum DefaultLineup {
    static let teams: [FollowedTeam] = [
        FollowedTeam(league: .mlb, teamId: "10", displayName: "New York Yankees", abbreviation: "NYY",
                     logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png", color: "#0c2340"),
        FollowedTeam(league: .nhl, teamId: "6", displayName: "Edmonton Oilers", abbreviation: "EDM",
                     logo: "https://a.espncdn.com/i/teamlogos/nhl/500/edm.png", color: "#fc4c02"),
        FollowedTeam(league: .nfl, teamId: "21", displayName: "Philadelphia Eagles", abbreviation: "PHI",
                     logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", color: "#004c54"),
        FollowedTeam(league: .collegeFootball, teamId: "251", displayName: "Texas Longhorns", abbreviation: "TEX",
                     logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/251.png", color: "#bf5700"),
    ]

    static let players: [FollowedPlayer] = [
        FollowedPlayer(league: .mlb, playerId: "33192", fullName: "Aaron Judge", teamAbbr: "NYY",
                       headshot: "https://a.espncdn.com/i/headshots/mlb/players/full/33192.png", position: "RF"),
        FollowedPlayer(league: .nhl, playerId: "3895074", fullName: "Connor McDavid", teamAbbr: "EDM",
                       headshot: "https://a.espncdn.com/i/headshots/nhl/players/full/3895074.png", position: "C"),
        FollowedPlayer(league: .nfl, playerId: "4040715", fullName: "Jalen Hurts", teamAbbr: "PHI",
                       headshot: "https://a.espncdn.com/i/headshots/nfl/players/full/4040715.png", position: "QB"),
        FollowedPlayer(league: .collegeFootball, playerId: "4870906", fullName: "Arch Manning", teamAbbr: "TEX",
                       headshot: "https://a.espncdn.com/i/headshots/college-football/players/full/4870906.png", position: "QB"),
    ]
}
