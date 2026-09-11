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
}
