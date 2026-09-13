import Foundation

/// The leagues the site covers, keyed exactly as the API keys them.
enum League: String, Codable, CaseIterable, Identifiable, Sendable {
    case nba, mlb, nhl, nfl
    case collegeFootball = "college-football"

    var id: String { rawValue }

    var name: String {
        switch self {
        case .nba: "NBA"
        case .mlb: "MLB"
        case .nhl: "NHL"
        case .nfl: "NFL"
        case .collegeFootball: "NCAAF"
        }
    }

    var fullName: String {
        switch self {
        case .nba: "National Basketball Association"
        case .mlb: "Major League Baseball"
        case .nhl: "National Hockey League"
        case .nfl: "National Football League"
        case .collegeFootball: "College Football"
        }
    }
}

enum GameState: String, Codable, Sendable {
    case pre, `in`, post
}

struct GameSide: Codable, Sendable, Hashable {
    let teamId: String
    let abbreviation: String
    let displayName: String
    let shortName: String
    let logo: String
    let color: String
    let score: Int?
    let record: String?
    let winner: Bool
    let rank: Int?
    /// Runs, points or goals per period, oldest first.
    let linescores: [Double]?
}

struct OddsLine: Codable, Sendable, Hashable {
    let details: String?
    let overUnder: Double?
    let provider: String?
}

struct Game: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let league: League
    let state: GameState
    let statusDetail: String
    let shortDetail: String
    let date: String
    let home: GameSide
    let away: GameSide
    let venue: String?
    let broadcast: String?
    let situation: String?
    let lastPlay: String?
    let period: String?
    let odds: OddsLine?
    /// Week of the season — football only; the API drops it elsewhere.
    let week: Int?
    /// Football, live only: where the ball is. Absent for every other sport
    /// and for a game that hasn't kicked off or has finished.
    let field: FieldSituation?
    /// Baseball, live only: the count, the outs and the runners.
    let bases: BaseState?

    var startsAt: Date? { ISODate.parse(date) }

    /// How many periods to draw in a line score: as many as either side
    /// reported, so overtime columns appear on their own.
    var periodCount: Int {
        max(home.linescores?.count ?? 0, away.linescores?.count ?? 0)
    }

    var hasLineScore: Bool { periodCount > 0 }
}

/// Where the ball sits on a football field. Positions are percentages across
/// the 100-yard playing surface: 0 is the away team's goal line, 100 the home
/// team's, matching the way the graphic draws them with the away side on the
/// left. Both go nil between drives and at the half.
struct FieldSituation: Codable, Sendable, Hashable {
    /// The line of scrimmage.
    let ballOn: Double?
    /// Where the chains are — downfield of the scrimmage line, so below it
    /// when the home team has the ball and above it when the away team does.
    let firstDown: Double?
    /// Which way the offense is driving, or nil when the feed didn't say.
    let homeHasBall: Bool?
    let down: Int?
    let distance: Int?
    /// "2nd & 9", as ESPN writes it — sometimes with the marker spelled out.
    let downDistanceText: String?
    /// "TA&M 48".
    let possessionText: String?
    /// Optional so an older build of the API can't fail the whole decode.
    let isRedZone: Bool?

    var inRedZone: Bool { isRedZone == true }

    /// True once there's a drive to draw; false at the half, when the feed
    /// keeps the situation but stops saying where the ball is.
    var hasBall: Bool { ballOn != nil }

    /// "2nd & 9 at TA&M 48" — ESPN spells the marker out in some feeds and
    /// leaves it to the caller in others, so only add it when it's missing.
    var headline: String? {
        guard let down = downDistanceText, !down.isEmpty else { return nil }
        guard let marker = possessionText, !marker.isEmpty,
              !down.localizedCaseInsensitiveContains(" at ") else { return down }
        return "\(down) at \(marker)"
    }
}

/// A live at-bat: the count, the outs, and who is standing where. Every
/// number is given rather than optional — a 0-0 count with nobody on is a
/// real state to draw, and a missing number would look the same.
struct BaseState: Codable, Sendable, Hashable {
    let balls: Int
    let strikes: Int
    let outs: Int
    let onFirst: Bool
    let onSecond: Bool
    let onThird: Bool
    /// Dropped by the feed between innings, so treated as absent not stale.
    let pitcher: String?
    let batter: String?

    /// "1-1, 2 out" — the line under the diamond.
    var countLine: String {
        "\(balls)-\(strikes), \(outs) out\(outs == 1 ? "" : "s")"
    }

    var runnersOn: Bool { onFirst || onSecond || onThird }
}

/// A team the user follows. Until Phase 3 syncs follows from the account,
/// these come from the default lineup.
struct FollowedTeam: Codable, Sendable, Hashable, Identifiable {
    let league: League
    let teamId: String
    let displayName: String
    let abbreviation: String
    let logo: String
    let color: String

    var id: String { "\(league.rawValue):\(teamId)" }
}
