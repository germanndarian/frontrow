import Foundation

enum Outcome: String, Codable, Sendable, Hashable {
    case win = "W", loss = "L", tie = "T"
}

struct Team: Codable, Sendable, Hashable {
    let id: String
    let league: League
    let location: String
    let name: String
    let displayName: String
    let abbreviation: String
    let logo: String
    let color: String
    let altColor: String
    let record: String
    let standingSummary: String
}

/// One finished game in a team's recent form, most recent first.
struct FormEntry: Codable, Sendable, Hashable, Identifiable {
    let result: Outcome
    let opponentAbbr: String
    let atVs: String
    let score: String
    let date: String

    var id: String { "\(date)-\(opponentAbbr)-\(score)" }
}

struct NextUp: Codable, Sendable, Hashable {
    let opponentAbbr: String
    let opponentName: String
    let opponentLogo: String
    let atVs: String
    let date: String

    var startsAt: Date? { ISODate.parse(date) }
}

/// What `/api/team/<id>?league=` returns: the team, its recent form, what's
/// next, and the scoring stretch the bar charts are drawn from.
struct TeamCard: Codable, Sendable, Hashable {
    let team: Team
    let form: [FormEntry]
    let next: NextUp?
    let scoring: [Int]
    let conceded: [Int]?
    let inPlayoffs: Bool?
    let placeholder: Bool?

    /// Scored and allowed only line up when the feed gave us both.
    var allowed: [Int]? {
        guard let conceded, conceded.count == scoring.count, !scoring.isEmpty else { return nil }
        return conceded
    }
}

struct ScheduleGame: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let date: String
    let state: GameState
    let opponentAbbr: String
    let opponentName: String
    let opponentLogo: String
    let atVs: String
    let result: Outcome?
    let score: String?
    let broadcast: String?

    var startsAt: Date? { ISODate.parse(date) }
}
