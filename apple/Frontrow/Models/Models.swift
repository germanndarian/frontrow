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

    var startsAt: Date? { ISODate.parse(date) }
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
