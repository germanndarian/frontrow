import Foundation
import Observation

/// One player payload per starred name, cached so opening the sheet doesn't
/// refetch what the card already has.
@MainActor
@Observable
final class PlayersModel {
    let players: Cache<FollowedPlayer, Player>
    private(set) var followed: [FollowedPlayer]

    init(api: APIClient = .shared, preferences: Preferences = .current) {
        followed = preferences.players
        players = Cache { follow in
            try await api.get("player/\(follow.playerId)", query: ["league": follow.league.rawValue])
        }
    }

    func load(force: Bool = false) async {
        await withTaskGroup(of: Void.self) { group in
            for player in followed {
                group.addTask { [players] in await players.fetch(player, force: force) }
            }
        }
    }
}
