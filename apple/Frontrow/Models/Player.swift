import Foundation

/// One season stat with its league rank, e.g. HR 17, "Tied-93rd".
struct PlayerSeasonStat: Codable, Sendable, Hashable, Identifiable {
    let name: String
    let abbr: String
    let label: String
    let value: String
    let rank: Int?
    let rankDisplay: String?

    var id: String { "\(abbr)-\(name)" }

    /// Leading the league earns the gold star.
    var leads: Bool { rank == 1 }

    var rankText: String {
        if leads { return "★ 1st" }
        if let rankDisplay, !rankDisplay.isEmpty { return rankDisplay }
        if let rank { return "\(rank)th" }
        return ""
    }
}

/// One line in a player's game log.
struct GameLogEntry: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let date: String
    let opponentAbbr: String
    let opponentLogo: String
    let atVs: String
    let result: Outcome
    let score: String
    let stats: [String: String]
    let primary: Double

    /// The three numbers worth reading, in the order a box score prints them.
    /// JSON objects arrive as an unordered dictionary, so the order has to be
    /// stated rather than discovered — alphabetical would lead with "2B".
    func headline(_ league: League) -> String {
        let preferred = GameLogEntry.statOrder(league)
        let ranked = stats.keys.sorted { a, b in
            let ia = preferred.firstIndex(of: a) ?? preferred.count
            let ib = preferred.firstIndex(of: b) ?? preferred.count
            return ia == ib ? a < b : ia < ib
        }
        return ranked.prefix(3).compactMap { key in
            stats[key].map { "\($0) \(key)" }
        }.joined(separator: " · ")
    }

    static func statOrder(_ league: League) -> [String] {
        switch league {
        case .mlb: ["AB", "R", "H", "HR", "RBI", "BB"]
        case .nhl: ["G", "A", "PTS", "+/-", "SOG"]
        case .nba: ["PTS", "REB", "AST", "MIN"]
        case .nfl, .collegeFootball: ["C/ATT", "YDS", "TD", "INT", "CAR", "REC", "RUSHYDS"]
        }
    }
}

struct RecentLog: Codable, Sendable, Hashable {
    let label: String
    let entries: [GameLogEntry]
}

/// What `/api/player/<id>?league=` returns.
struct Player: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let league: League
    let fullName: String
    let firstName: String
    let lastName: String
    let teamId: String
    let teamAbbr: String
    let teamLogo: String
    let color: String
    let position: String
    let jersey: String
    let headshot: String
    let seasonLabel: String
    let stats: [PlayerSeasonStat]
    /// Height, weight and the rest. Optional so an older API can't fail the
    /// decode, and every field inside it optional for the same reason the
    /// web says: which ones exist depends on the sport.
    let bio: PlayerBio?
    let recent: RecentLog
    let placeholder: Bool?

    var isEmpty: Bool { (placeholder ?? false) || stats.isEmpty }

    /// "NYY · RF · #99"
    var subtitle: String {
        var parts = [teamAbbr, position]
        if !jersey.isEmpty { parts.append("#\(jersey)") }
        return parts.filter { !$0.isEmpty }.joined(separator: " · ")
    }

    /// "2026" — the season label without the boilerplate.
    var seasonChip: String {
        seasonLabel
            .replacingOccurrences(of: " regular season stats", with: "", options: .caseInsensitive)
            .replacingOccurrences(of: " season stats", with: "", options: .caseInsensitive)
    }
}

/// What ESPN keeps on a player besides their numbers. A college player has
/// no draft, a hockey player often has no college, and bats/throws is
/// baseball's alone — so a field that isn't there simply isn't drawn.
struct PlayerBio: Codable, Sendable, Hashable {
    let height: String?
    let weight: String?
    let age: Int?
    let birthplace: String?
    let batsThrows: String?
    let experience: String?
    let college: String?
    let draft: String?
    /// Only when it isn't "active".
    let status: String?

    /// The rows to draw, in reading order, skipping whatever is missing.
    var rows: [(String, String)] {
        var out: [(String, String)] = []
        if let status, !status.isEmpty { out.append(("Status", status)) }
        if let height, !height.isEmpty { out.append(("Height", height)) }
        if let weight, !weight.isEmpty { out.append(("Weight", weight)) }
        if let age { out.append(("Age", "\(age)")) }
        if let birthplace, !birthplace.isEmpty { out.append(("Born", birthplace)) }
        if let batsThrows, !batsThrows.isEmpty { out.append(("Bats/Throws", batsThrows)) }
        if let experience, !experience.isEmpty { out.append(("Experience", experience)) }
        if let college, !college.isEmpty { out.append(("College", college)) }
        if let draft, !draft.isEmpty { out.append(("Draft", draft)) }
        return out
    }

    var isEmpty: Bool { rows.isEmpty }
}

/// A player the user stars. Replaced by the account's follows in Phase 3.
struct FollowedPlayer: Codable, Sendable, Hashable, Identifiable {
    let league: League
    let playerId: String
    let fullName: String
    let teamAbbr: String
    let headshot: String
    let position: String

    var id: String { "\(league.rawValue):\(playerId)" }
}
