import ActivityKit
import Foundation

/// A game being tracked on the Lock Screen and in the Dynamic Island.
///
/// The static half is what can't change while the activity runs — who is
/// playing, and in what. The `ContentState` is everything that moves, and is
/// what gets sent on each update, so it stays small: numbers and short
/// strings, no logos or URLs.
struct GameActivity: ActivityAttributes {
    struct ContentState: Codable, Sendable, Hashable {
        var homeScore: Int
        var awayScore: Int
        /// "Top 6th", "2nd · 07:34" — the period and clock as ESPN writes it.
        var status: String
        /// Whether the game has finished, so the activity can say so and end.
        var final: Bool

        /* Baseball. Nil for every other sport. */
        var balls: Int?
        var strikes: Int?
        var outs: Int?
        var onFirst: Bool?
        var onSecond: Bool?
        var onThird: Bool?
        var pitcher: String?
        var batter: String?

        /* Football. Nil for every other sport. */
        /// "2nd & 9 at TA&M 48".
        var downDistance: String?
        /// True when the home team has the ball, for the possession dot.
        var homeHasBall: Bool?

        /// "1-1, 2 outs", when this is a game with a count.
        var countLine: String? {
            guard let balls, let strikes, let outs else { return nil }
            return "\(balls)-\(strikes), \(outs) out\(outs == 1 ? "" : "s")"
        }

        var isBaseball: Bool { outs != nil }
    }

    let gameId: String
    let leagueName: String
    let homeAbbr: String
    let awayAbbr: String
    /// "#0c2340" — the team colours, for the score bubbles.
    let homeColor: String
    let awayColor: String
}

extension GameActivity.ContentState {
    /// The moving half of a game, as the activity needs it.
    init(_ game: Game) {
        homeScore = game.home.score ?? 0
        awayScore = game.away.score ?? 0
        status = game.shortDetail.isEmpty ? game.statusDetail : game.shortDetail
        final = game.state == .post

        balls = game.bases?.balls
        strikes = game.bases?.strikes
        outs = game.bases?.outs
        onFirst = game.bases?.onFirst
        onSecond = game.bases?.onSecond
        onThird = game.bases?.onThird
        pitcher = game.bases?.pitcher
        batter = game.bases?.batter

        downDistance = game.field?.headline
        homeHasBall = game.field?.homeHasBall
    }
}

extension GameActivity {
    init(_ game: Game) {
        gameId = game.id
        leagueName = game.league.name
        homeAbbr = game.home.abbreviation
        awayAbbr = game.away.abbreviation
        homeColor = game.home.color
        awayColor = game.away.color
    }

    /// The sports with something worth watching minute to minute. Hockey and
    /// the rest can follow once they have a situation block to draw.
    static func canTrack(_ game: Game) -> Bool {
        game.state == .in && (game.bases != nil || game.field != nil)
    }
}

extension GameActivity {
    /// Stand-ins for the gallery: a bases-loaded at-bat, an empty diamond and
    /// a football drive — the three shapes the card has to handle.
    struct Sample: Identifiable {
        let attributes: GameActivity
        let state: ContentState
        let title: String
        var id: String { title }
    }

    static var samples: [Sample] {
        let mlb = GameActivity(
            gameId: "sample-mlb", leagueName: "MLB",
            homeAbbr: "WSH", awayAbbr: "LAA",
            homeColor: "#ab0003", awayColor: "#ba0021"
        )
        let nfl = GameActivity(
            gameId: "sample-nfl", leagueName: "NFL",
            homeAbbr: "PHI", awayAbbr: "WSH",
            homeColor: "#004c54", awayColor: "#5a1414"
        )
        return [
            Sample(attributes: mlb, state: ContentState(
                homeScore: 2, awayScore: 1, status: "Bot 1st", final: false,
                balls: 1, strikes: 2, outs: 1,
                onFirst: true, onSecond: true, onThird: true,
                pitcher: "G. Rodriguez", batter: "Y. Morales"
            ), title: "Baseball · bases loaded"),
            Sample(attributes: mlb, state: ContentState(
                homeScore: 0, awayScore: 0, status: "Top 6th", final: false,
                balls: 1, strikes: 1, outs: 2,
                onFirst: false, onSecond: false, onThird: false,
                pitcher: "J. Jobe", batter: "C. Carrigg"
            ), title: "Baseball · nobody on"),
            Sample(attributes: nfl, state: ContentState(
                homeScore: 17, awayScore: 13, status: "3rd · 09:32", final: false,
                downDistance: "2nd & 9 at PHI 48", homeHasBall: true
            ), title: "Football"),
        ]
    }
}
