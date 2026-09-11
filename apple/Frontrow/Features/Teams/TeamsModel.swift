import Foundation
import Observation

/// Holds one team card per followed team and remembers which one the season
/// panel is showing. The cache means tapping between teams doesn't refetch.
@MainActor
@Observable
final class TeamsModel {
    let cards: Cache<FollowedTeam, TeamCard>
    private(set) var teams: [FollowedTeam]
    var selectedID: String?

    init(api: APIClient = .shared, preferences: Preferences = .current) {
        teams = preferences.teams
        cards = Cache { follow in
            try await api.get("team/\(follow.teamId)", query: ["league": follow.league.rawValue])
        }
    }

    /// The team the season panel features: the tapped one, or the first.
    var spotlight: FollowedTeam? {
        teams.first { $0.id == selectedID } ?? teams.first
    }

    func load(force: Bool = false) async {
        // Fetch every card at once; the cache skips the ones it already has.
        await withTaskGroup(of: Void.self) { group in
            for team in teams {
                group.addTask { [cards] in await cards.fetch(team, force: force) }
            }
        }
    }
}
