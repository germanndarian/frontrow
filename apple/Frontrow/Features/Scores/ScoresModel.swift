import Foundation
import Observation

/// Loads the scoreboard for the followed leagues, buckets games by state,
/// and polls while anything is live — the same rules as the website.
@MainActor
@Observable
final class ScoresModel {
    enum Phase: Equatable {
        case idle, loading, loaded, failed(String)
    }

    private(set) var phase: Phase = .idle
    private(set) var games: [Game] = []
    var league: League? = nil // nil = all

    private let api: APIClient
    private var preferences: Preferences
    private var pollTask: Task<Void, Never>?

    init(api: APIClient = .shared, preferences: Preferences = .empty) {
        self.api = api
        self.preferences = preferences
    }

    /// Follows changed in Settings or onboarding — reload against the new set.
    func apply(_ next: Preferences) async {
        guard next != preferences else { return }
        preferences = next
        if let league, !next.leagues.contains(league) { self.league = nil }
        await load()
    }

    var followedKeys: Set<String> {
        Set(preferences.teams.map(\.id))
    }

    var leagues: [League] { preferences.orderedLeagues }

    var visible: [Game] {
        guard let league else { return games }
        return games.filter { $0.league == league }
    }

    struct Group: Identifiable {
        let state: GameState
        let title: String
        let games: [Game]
        var id: String { state.rawValue }
    }

    var groups: [Group] {
        let buckets: [(GameState, String)] = [(.in, "LIVE NOW"), (.pre, "UPCOMING"), (.post, "RESULTS")]
        return buckets
            .map { bucket in Group(state: bucket.0, title: bucket.1, games: visible.filter { $0.state == bucket.0 }) }
            .filter { !$0.games.isEmpty }
    }

    var liveCount: Int { visible.filter { $0.state == .in }.count }

    func isFollowed(_ game: Game) -> Bool {
        followedKeys.contains("\(game.league.rawValue):\(game.home.teamId)")
            || followedKeys.contains("\(game.league.rawValue):\(game.away.teamId)")
    }

    func load() async {
        guard !preferences.leagues.isEmpty else {
            games = []
            phase = .loaded
            return
        }
        if games.isEmpty { phase = .loading }
        do {
            let leagues = preferences.orderedLeagues.map(\.rawValue).joined(separator: ",")
            let fetched: [Game] = try await api.get("scoreboard", query: ["leagues": leagues])
            games = fetched.sorted { ($0.startsAt ?? .distantFuture) < ($1.startsAt ?? .distantFuture) }
            phase = .loaded
        } catch {
            if games.isEmpty { phase = .failed(error.localizedDescription) }
        }
        schedulePolling()
    }

    /// Poll every 30s only while a game is live, like the web's refetchInterval.
    private func schedulePolling() {
        pollTask?.cancel()
        guard games.contains(where: { $0.state == .in }) else { return }
        pollTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(30))
            guard !Task.isCancelled else { return }
            await self?.load()
        }
    }
}
