import SwiftUI

/// The scoreboard the Scores tab last loaded, shared with whatever is open on
/// top of it. A game sheet reads the freshest copy from here, so it follows
/// the same thirty-second poll the tab is already running instead of starting
/// a second one of its own.
@MainActor
@Observable
final class LiveFeed {
    private(set) var games: [Game] = []

    func publish(_ games: [Game]) {
        self.games = games
    }

    /// The freshest copy of a game, or the one the caller already holds when
    /// the poll hasn't seen it — a game from another week, say.
    func fresh(_ game: Game) -> Game {
        games.first { $0.id == game.id } ?? game
    }
}
