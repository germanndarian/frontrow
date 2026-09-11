import Foundation

/// Who you follow. Loaded from the account on sign-in; for a guest it stays
/// in memory and disappears with the session, exactly as the website does it.
struct Preferences: Sendable, Hashable {
    var leagues: [League]
    var teams: [FollowedTeam]
    var players: [FollowedPlayer]

    static let empty = Preferences(leagues: [], teams: [], players: [])

    /// The lineup offered during onboarding as "Use a sample lineup".
    static let sample = Preferences(
        leagues: [.mlb, .nhl, .nfl, .collegeFootball],
        teams: DefaultLineup.teams,
        players: DefaultLineup.players
    )

    /// Leagues in display order, so chips read NBA · MLB · NHL · NFL · NCAAF.
    var orderedLeagues: [League] {
        League.displayOrder.filter { leagues.contains($0) }
    }

    func team(in league: League) -> FollowedTeam? {
        teams.first { $0.league == league }
    }
}
