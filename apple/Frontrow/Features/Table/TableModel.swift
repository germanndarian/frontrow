import Foundation
import Observation

/// Standings for one league at a time — the followed team's division or
/// conference, so the table stays the size of a phone screen.
@MainActor
@Observable
final class TableModel {
    /// Keyed by the followed team as well as the league: changing who you
    /// follow changes which group comes back, so it deserves its own entry.
    struct Key: Hashable, Sendable {
        let league: League
        let teamId: String?
    }

    let standings: Cache<Key, StandingsGroup>
    private(set) var preferences: Preferences
    var league: League?

    init(api: APIClient = .shared, preferences: Preferences = .empty) {
        self.preferences = preferences
        standings = Cache { key in
            var query: [String: String] = [:]
            if let teamId = key.teamId { query["teamId"] = teamId }
            return try await api.get("standings/\(key.league.rawValue)", query: query)
        }
    }

    var leagues: [League] { preferences.orderedLeagues }

    /// The chosen league, or the first one followed.
    var active: League? {
        if let league, leagues.contains(league) { return league }
        return leagues.first
    }

    var activeKey: Key? {
        active.map { Key(league: $0, teamId: preferences.team(in: $0)?.teamId) }
    }

    func apply(_ next: Preferences) async {
        guard next != preferences else { return }
        preferences = next
        if let league, !next.leagues.contains(league) { self.league = nil }
        await load()
    }

    func load(force: Bool = false) async {
        guard let activeKey else { return }
        await standings.fetch(activeKey, force: force)
    }
}
