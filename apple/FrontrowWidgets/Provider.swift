import WidgetKit
import Foundation

/// What every widget size draws from: the followed game happening now, what's
/// next, and the last result — whichever of those exist.
struct ScoreEntry: TimelineEntry, Sendable {
    let date: Date
    let live: Game?
    let upcoming: [Game]
    let recent: Game?
    let accent: AccentId
    /// True when this is the sample lineup rather than the account's follows.
    let isSample: Bool

    var headline: Game? { live ?? upcoming.first ?? recent }

    static func placeholder(_ date: Date = .now) -> ScoreEntry {
        ScoreEntry(
            date: date,
            live: SampleGames.live,
            upcoming: SampleGames.upcoming,
            recent: nil,
            accent: .cobalt,
            isSample: true
        )
    }
}

struct ScoreProvider: TimelineProvider, Sendable {
    func placeholder(in context: Context) -> ScoreEntry { .placeholder() }

    func getSnapshot(in context: Context, completion: @escaping @Sendable (ScoreEntry) -> Void) {
        // The gallery preview shouldn't wait on the network.
        guard !context.isPreview else { return completion(.placeholder()) }
        Task { completion(await entry()) }
    }

    func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<ScoreEntry>) -> Void) {
        Task {
            let entry = await entry()
            // A game in progress is worth coming back to often; an empty
            // evening is not. WidgetKit gives us a budget either way.
            let next = Calendar.current.date(
                byAdding: .minute, value: entry.live == nil ? 30 : 5, to: .now
            ) ?? .now.addingTimeInterval(1800)
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }

    /// Reads the follows the app last wrote, asks the same API the app asks,
    /// and keeps only the games involving those teams.
    private func entry() async -> ScoreEntry {
        let snapshot = SharedStore.read()
        let leagues = League.displayOrder.filter { snapshot.leagues.contains($0) }
        guard !leagues.isEmpty else {
            return ScoreEntry(date: .now, live: nil, upcoming: [], recent: nil,
                              accent: snapshot.accent, isSample: !SharedStore.hasAccountData)
        }

        let week = WeekWindow.current()
        let games: [Game]
        do {
            games = try await APIClient.shared.get(
                "scoreboard",
                query: [
                    "leagues": leagues.map(\.rawValue).joined(separator: ","),
                    "dates": week.query,
                ]
            )
        } catch {
            // Nothing to show beats a broken tile; the next refresh tries again.
            return ScoreEntry(date: .now, live: nil, upcoming: [], recent: nil,
                              accent: snapshot.accent, isSample: !SharedStore.hasAccountData)
        }

        let followed = Set(snapshot.teams.map(\.id))
        let mine = games.filter { game in
            followed.contains("\(game.league.rawValue):\(game.home.teamId)")
                || followed.contains("\(game.league.rawValue):\(game.away.teamId)")
        }
        let byStart = mine.sorted { ($0.startsAt ?? .distantFuture) < ($1.startsAt ?? .distantFuture) }

        return ScoreEntry(
            date: .now,
            live: byStart.first { $0.state == .in },
            upcoming: Array(byStart.filter { $0.state == .pre }.prefix(3)),
            recent: byStart.last { $0.state == .post },
            accent: snapshot.accent,
            isSample: !SharedStore.hasAccountData
        )
    }
}

/// Stand-ins for the widget gallery and the Xcode previews, mirroring the
/// mockup's Oilers–Panthers game.
enum SampleGames {
    static let live = Game(
        id: "sample-live", league: .nhl, state: .in,
        statusDetail: "2nd Period", shortDetail: "2nd · 07:34",
        date: ISO8601DateFormatter().string(from: .now),
        home: side("EDM", "Oilers", "#fc4c02", 2, winner: true),
        away: side("FLA", "Panthers", "#c8102e", 1),
        venue: "Rogers Place", broadcast: "ESPN", situation: nil,
        lastPlay: nil, period: "2nd", odds: nil, week: nil
    )

    static var upcoming: [Game] { [next, later] }

    static let next = Game(
        id: "sample-next", league: .mlb, state: .pre,
        statusDetail: "Scheduled", shortDetail: "7:05 PM",
        date: ISO8601DateFormatter().string(from: .now.addingTimeInterval(7200)),
        home: side("TEX", "Rangers", "#003278", nil),
        away: side("NYY", "Yankees", "#0c2340", nil),
        venue: nil, broadcast: "ESPN", situation: nil,
        lastPlay: nil, period: nil, odds: nil, week: nil
    )

    static let later = Game(
        id: "sample-later", league: .nfl, state: .pre,
        statusDetail: "Scheduled", shortDetail: "1:00 PM",
        date: ISO8601DateFormatter().string(from: .now.addingTimeInterval(93_600)),
        home: side("DAL", "Cowboys", "#003594", nil),
        away: side("PHI", "Eagles", "#004c54", nil),
        venue: nil, broadcast: "FOX", situation: nil,
        lastPlay: nil, period: nil, odds: nil, week: 2
    )

    private static func side(_ abbr: String, _ name: String, _ color: String, _ score: Int?, winner: Bool = false) -> GameSide {
        GameSide(
            teamId: abbr, abbreviation: abbr, displayName: name, shortName: name,
            logo: "", color: color, score: score, record: nil, winner: winner, rank: nil
        )
    }
}
