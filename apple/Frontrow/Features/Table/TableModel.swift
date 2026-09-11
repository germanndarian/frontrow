import Foundation
import Observation

/// Standings for one league at a time — the followed team's division or
/// conference, so the table stays the size of a phone screen.
@MainActor
@Observable
final class TableModel {
    let standings: Cache<League, StandingsGroup>
    let leagues: [League]
    private let teams: [FollowedTeam]
    var league: League?

    init(api: APIClient = .shared, preferences: Preferences = .current) {
        leagues = preferences.leagues
        teams = preferences.teams
        let follows = preferences.teams
        standings = Cache { league in
            var query: [String: String] = [:]
            if let mine = follows.first(where: { $0.league == league })?.teamId {
                query["teamId"] = mine
            }
            return try await api.get("standings/\(league.rawValue)", query: query)
        }
    }

    /// The chosen league, or the first one followed.
    var active: League? {
        if let league, leagues.contains(league) { return league }
        return leagues.first
    }

    func myTeam(in league: League) -> FollowedTeam? {
        teams.first { $0.league == league }
    }

    func load(force: Bool = false) async {
        guard let active else { return }
        await standings.fetch(active, force: force)
    }
}
