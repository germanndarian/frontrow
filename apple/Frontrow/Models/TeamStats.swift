import Foundation

/// Derived team numbers — the Swift half of the web's `team-stats.ts`, so the
/// app and the website agree on what a streak or a win percentage is.
enum TeamStats {
    struct Record: Sendable {
        let wins: Int, losses: Int, ties: Int
    }

    /// "84-62" or "10-4-1" → the parts, or nil if it isn't a record.
    static func parseRecord(_ text: String) -> Record? {
        let parts = text.split(separator: "-").map { Int($0.trimmingCharacters(in: .whitespaces)) }
        guard parts.count >= 2, let w = parts[0], let l = parts[1] else { return nil }
        let t = parts.count > 2 ? (parts[2] ?? 0) : 0
        return Record(wins: w, losses: l, ties: t)
    }

    /// ".597" — three decimals, no leading zero, as the standings print it.
    static func winPct(_ r: Record) -> String {
        let games = r.wins + r.losses + r.ties
        guard games > 0 else { return "—" }
        let pct = (Double(r.wins) + Double(r.ties) / 2) / Double(games)
        let text = String(format: "%.3f", pct)
        return text.hasPrefix("0") ? String(text.dropFirst()) : text
    }

    struct Streak: Sendable {
        let label: String
        let result: Outcome
    }

    /// "W3" from the form list, which arrives most-recent first.
    static func currentStreak(_ form: [FormEntry]) -> Streak? {
        guard let first = form.first else { return nil }
        let run = form.prefix { $0.result == first.result }.count
        return Streak(label: "\(first.result.rawValue)\(run)", result: first.result)
    }

    static func mean(_ xs: [Int]) -> Double {
        xs.isEmpty ? 0 : Double(xs.reduce(0, +)) / Double(xs.count)
    }
}
