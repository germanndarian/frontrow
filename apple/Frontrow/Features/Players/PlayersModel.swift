import Foundation
import Observation

/// One player payload per starred name, cached so opening the sheet doesn't
/// refetch what the card already has.
@MainActor
@Observable
final class PlayersModel {
    let players: Cache<FollowedPlayer, Player>
    private(set) var followed: [FollowedPlayer]
    private(set) var teams: [FollowedTeam]

    /// Starred players under the team they play for, in the order the Teams
    /// tab lists those teams — a name is easier to find next to its badge
    /// than in one long column.
    struct Section: Identifiable {
        let teamAbbr: String
        let title: String
        let color: String
        let players: [FollowedPlayer]
        var id: String { teamAbbr }
    }

    var sections: [Section] {
        var byTeam: [String: [FollowedPlayer]] = [:]
        for player in followed { byTeam[player.teamAbbr, default: []].append(player) }

        var sections: [Section] = []
        var placed: Set<String> = []
        for team in teams {
            guard let players = byTeam[team.abbreviation] else { continue }
            sections.append(Section(teamAbbr: team.abbreviation, title: team.displayName,
                                    color: team.color, players: players))
            placed.insert(team.abbreviation)
        }
        // A player whose team isn't followed still needs a home.
        for abbr in byTeam.keys.sorted() where !placed.contains(abbr) {
            sections.append(Section(teamAbbr: abbr, title: abbr, color: "#8C8C86",
                                    players: byTeam[abbr] ?? []))
        }
        return sections
    }

    init(api: APIClient = .shared, preferences: Preferences = .empty) {
        followed = preferences.players
        teams = preferences.teams
        players = Cache { follow in
            try await api.get("player/\(follow.playerId)", query: ["league": follow.league.rawValue])
        }
    }

    func apply(_ next: Preferences) async {
        teams = next.teams
        guard next.players != followed else { return }
        followed = next.players
        await load()
    }

    func load(force: Bool = false) async {
        await withTaskGroup(of: Void.self) { group in
            for player in followed {
                group.addTask { [players] in await players.fetch(player, force: force) }
            }
        }
    }
}
