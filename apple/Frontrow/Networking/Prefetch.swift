import Foundation

/// A one-shot warm-up for the first screen the app shows.
///
/// The Done screen knows which leagues were picked a second before the tabs
/// need them, so it starts that request early and parks the answer here. The
/// scoreboard then opens with games instead of skeletons, which is most of
/// what makes "Open Frontrow" feel instant.
@MainActor
enum Prefetch {
    private static var scoreboards: [String: [Game]] = [:]
    private static var inFlight: Set<String> = []

    static func warm(leagues: String, dates: String, api: APIClient = .shared) {
        let key = "\(leagues)|\(dates)"
        guard !leagues.isEmpty, scoreboards[key] == nil, !inFlight.contains(key) else { return }
        inFlight.insert(key)
        Task {
            defer { inFlight.remove(key) }
            if let games: [Game] = try? await api.get(
                "scoreboard", query: ["leagues": leagues, "dates": dates]
            ) {
                scoreboards[key] = games
            }
        }
    }

    /// Hands the warmed games over exactly once — a second read should go to
    /// the network, since by then the scores have moved on.
    static func take(leagues: String, dates: String) -> [Game]? {
        scoreboards.removeValue(forKey: "\(leagues)|\(dates)")
    }
}
