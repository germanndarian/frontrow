import Foundation
import Observation

/// Loads the scoreboard a week at a time, buckets games by state, and polls
/// while anything in the current week is live — the same rules as the
/// website, widened from today's slate to a week.
@MainActor
@Observable
final class ScoresModel {
    enum Phase: Equatable {
        case idle, loading, loaded, failed(String)
    }

    private(set) var phase: Phase = .idle
    private(set) var games: [Game] = []
    private(set) var weeks: [WeekWindow]
    var league: League? = nil // nil = all
    var week: WeekWindow

    private let api: APIClient
    private var preferences: Preferences
    private var pollTask: Task<Void, Never>?
    private var loadToken = 0

    init(api: APIClient = .shared, preferences: Preferences = .empty) {
        let windows = WeekWindow.all()
        self.api = api
        self.preferences = preferences
        self.weeks = windows
        self.week = windows.first { $0.offset == 0 } ?? windows[0]
    }

    /// Follows changed in Settings or onboarding — reload against the new set.
    func apply(_ next: Preferences) async {
        guard next != preferences else { return }
        preferences = next
        if let league, !next.leagues.contains(league) { self.league = nil }
        await load()
    }

    /// A different week was tapped: the games on screen belong to the old one,
    /// so clear them rather than leaving last week's results under a new title.
    func select(_ window: WeekWindow) async {
        guard window != week else { return }
        week = window
        games = []
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

    /// "NFL Week 2 · NCAAF Week 3" — the season week for whichever weekly
    /// leagues have games in view, so the strip says where the season is.
    var weekNote: String? {
        var notes: [String] = []
        for league in League.displayOrder {
            let weeks = Set(visible.filter { $0.league == league }.compactMap(\.week))
            guard let number = weeks.sorted().last else { continue }
            notes.append("\(league.name) Week \(number)")
        }
        return notes.isEmpty ? nil : notes.joined(separator: " · ")
    }

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
        loadToken += 1
        let token = loadToken
        let leagues = preferences.orderedLeagues.map(\.rawValue).joined(separator: ",")

        // Onboarding warmed this exact request a moment ago — use it and skip
        // the round trip, so the tabs open on games rather than skeletons.
        if games.isEmpty, let warm = Prefetch.take(leagues: leagues, dates: week.query) {
            games = warm.sorted { ($0.startsAt ?? .distantFuture) < ($1.startsAt ?? .distantFuture) }
            phase = .loaded
            schedulePolling()
            return
        }

        if games.isEmpty { phase = .loading }
        do {
            let fetched: [Game] = try await api.get(
                "scoreboard", query: ["leagues": leagues, "dates": week.query]
            )
            // A slower answer for a week the user has already left is stale.
            guard token == loadToken else { return }
            games = fetched.sorted { ($0.startsAt ?? .distantFuture) < ($1.startsAt ?? .distantFuture) }
            phase = .loaded
        } catch {
            guard token == loadToken else { return }
            if games.isEmpty { phase = .failed(error.localizedDescription) }
        }
        schedulePolling()
    }

    /// Poll every 30s only while a game is live in the week on screen.
    private func schedulePolling() {
        pollTask?.cancel()
        guard week.offset == 0, games.contains(where: { $0.state == .in }) else { return }
        pollTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(30))
            guard !Task.isCancelled else { return }
            await self?.load()
        }
    }
}
