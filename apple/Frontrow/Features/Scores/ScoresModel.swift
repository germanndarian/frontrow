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
    /// Ids of pinned games, mirrored from the store so the sort can see them.
    var pinned: Set<String> = []
    private var loadToken = 0

    init(api: APIClient = .shared, preferences: Preferences = .empty) {
        let windows = WeekWindow.all()
        self.api = api
        self.preferences = preferences
        self.weeks = windows
        self.week = windows.first { $0.offset == 0 } ?? .current()
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

    /// "Your teams" is the default view: the whole point of the app is the
    /// handful of teams you follow, so an unfiltered week of 200 games is the
    /// wrong thing to open on. Picking a league shows that league in full,
    /// with your teams' games marked and sorted to the front of each group.
    var visible: [Game] {
        guard let league else {
            // Nothing followed yet (a guest mid-setup) — showing nothing would
            // read as breakage, so fall back to the full slate.
            return preferences.teams.isEmpty ? games : games.filter(isFollowed)
        }
        return games.filter { $0.league == league }
    }

    /// True while "Your teams" is showing everything because there is nothing
    /// to narrow to.
    var showingEverything: Bool {
        league == nil && preferences.teams.isEmpty
    }

    struct Group: Identifiable {
        let state: GameState
        let title: String
        let games: [Game]
        var id: String { state.rawValue }
    }

    var groups: [Group] {
        let buckets: [(GameState, String)] = [(.in, "LIVE NOW"), (.pre, "UPCOMING"), (.post, "RESULTS")]
        let shown = visible
        return buckets
            .map { bucket in
                // Pinned games first, then your teams, then kick-off order.
                let inBucket = shown
                    .filter { $0.state == bucket.0 }
                    .enumerated()
                    .sorted { a, b in
                        if pinsApply {
                            let up = (pinned.contains(a.element.id), pinned.contains(b.element.id))
                            if up.0 != up.1 { return up.0 }
                        }
                        let mine = (isFollowed(a.element), isFollowed(b.element))
                        if mine.0 != mine.1 { return mine.0 }
                        return a.offset < b.offset
                    }
                    .map(\.element)
                return Group(state: bucket.0, title: bucket.1, games: inBucket)
            }
            .filter { !$0.games.isEmpty }
    }

    /// A game is marked as yours only when it is sitting among games that
    /// aren't — under "Your teams" every card would be marked, which says
    /// nothing and turns the whole list blue.
    var marksFollowed: Bool { league != nil }

    /// Pins order a league's list and nothing else. Under "Your teams" the
    /// list is already the games you care about, sorted the way you asked
    /// for; jumping one to the top there would be answering a question
    /// nobody asked.
    var pinsApply: Bool { league != nil }

    /// How many of the games on screen are your teams', for the group rule.
    func followedCount(in games: [Game]) -> Int {
        games.filter(isFollowed).count
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
