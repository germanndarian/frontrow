import Foundation

struct PlayoffSide: Codable, Sendable, Hashable {
    let teamId: String
    let abbreviation: String
    let displayName: String
    let logo: String
    let color: String
    let seed: Int?
    let score: Int?
    let winner: Bool
}

struct PlayoffMatchup: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let round: Int
    let format: String
    let bestOf: Int?
    let state: GameState
    let home: PlayoffSide
    let away: PlayoffSide
    let summary: String
    let winnerTeamId: String?
    let nextMatchupId: String?

    func involves(_ teamId: String) -> Bool {
        home.teamId == teamId || away.teamId == teamId
    }

    func dims(_ side: PlayoffSide) -> Bool {
        guard let winnerTeamId, !winnerTeamId.isEmpty else { return false }
        return winnerTeamId != side.teamId
    }
}

struct PlayoffRound: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let name: String
    let matchups: [PlayoffMatchup]

    var isLive: Bool { matchups.contains { $0.state == .in } }
}

/// What `/api/playoffs/<league>` returns. Empty rounds mean no bracket yet.
struct PlayoffBracket: Codable, Sendable, Hashable {
    let league: League
    let name: String
    let rounds: [PlayoffRound]
}
