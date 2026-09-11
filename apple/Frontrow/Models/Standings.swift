import Foundation

struct StandingRow: Codable, Sendable, Hashable, Identifiable {
    let teamId: String
    let abbreviation: String
    let displayName: String
    let name: String?
    let logo: String
    let position: Int
    let stats: [String: String]
    let followed: Bool
    let clinched: String?

    var id: String { teamId }
    var shortName: String { name ?? displayName }

    func value(_ key: String) -> String {
        let v = stats[key] ?? ""
        return v.isEmpty ? "–" : v
    }
}

/// What `/api/standings/<league>?teamId=` returns: the followed team's
/// division or conference, not the whole league.
struct StandingsGroup: Codable, Sendable, Hashable {
    let id: String
    let name: String
    let rows: [StandingRow]

    /// The clinch letters actually present, spelled out for the footnote.
    var clinchNote: String? {
        let markers = rows.compactMap(\.clinched).filter { !$0.isEmpty }
        guard !markers.isEmpty else { return nil }
        var seen: [String] = []
        for m in markers where !seen.contains(m) { seen.append(m) }
        return seen.map { "\($0) — \(Clinch.meaning($0))" }.joined(separator: ". ") + "."
    }
}
