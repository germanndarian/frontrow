import Foundation

/// Per-league display metadata — the Swift half of the web's `leagues.ts`:
/// what the standings table shows, what a "score" is called, and what to say
/// when a league has nothing going on.
extension League {
    /// The unit the standings group by: "Division" everywhere but college.
    var groupNoun: String {
        self == .collegeFootball ? "Conference" : "Division"
    }

    /// Runs, goals or points — for labels like "Runs/G".
    var scoreNoun: String {
        switch self {
        case .mlb: "Runs"
        case .nhl: "Goals"
        case .nba, .nfl, .collegeFootball: "Points"
        }
    }

    struct StandingsColumn: Identifiable, Sendable {
        let key: String
        let label: String
        var emphasis = false
        var id: String { key }
    }

    /// The columns worth showing for this league, in order. Hockey counts
    /// points, everyone else counts win percentage.
    var standingsColumns: [StandingsColumn] {
        switch self {
        case .nhl:
            [
                .init(key: "gamesPlayed", label: "GP"),
                .init(key: "wins", label: "W"),
                .init(key: "losses", label: "L"),
                .init(key: "otLosses", label: "OTL"),
                .init(key: "points", label: "PTS", emphasis: true),
            ]
        case .nfl:
            [
                .init(key: "wins", label: "W"),
                .init(key: "losses", label: "L"),
                .init(key: "ties", label: "T"),
                .init(key: "winPercent", label: "PCT", emphasis: true),
                .init(key: "streak", label: "STRK"),
            ]
        case .collegeFootball:
            [
                .init(key: "wins", label: "W"),
                .init(key: "losses", label: "L"),
                .init(key: "winPercent", label: "PCT", emphasis: true),
                .init(key: "streak", label: "STRK"),
            ]
        case .mlb, .nba:
            [
                .init(key: "wins", label: "W"),
                .init(key: "losses", label: "L"),
                .init(key: "winPercent", label: "PCT", emphasis: true),
                .init(key: "gamesBehind", label: "GB"),
                .init(key: "streak", label: "STRK"),
            ]
        }
    }
}

extension League {
    /// What one column of a line score is called: a quarter, an inning, a
    /// period. Anything past regulation is overtime.
    func periodLabel(_ index: Int, of total: Int) -> String {
        let regulation: Int
        switch self {
        case .mlb: regulation = 9
        case .nhl: regulation = 3
        case .nba, .nfl, .collegeFootball: regulation = 4
        }
        guard index < regulation else {
            let extras = total - regulation
            return extras > 1 ? "OT\(index - regulation + 1)" : "OT"
        }
        return "\(index + 1)"
    }

    /// The column head over the running total.
    var totalLabel: String {
        switch self {
        case .mlb: "R"
        default: "T"
        }
    }
}

/// What ESPN's clinch letters mean, spelled out under the table.
enum Clinch {
    static func meaning(_ marker: String) -> String {
        switch marker {
        case "x": "clinched playoff berth"
        case "y": "clinched division"
        case "z": "clinched home-field"
        case "e": "eliminated"
        default: marker
        }
    }
}
