import SwiftUI

/// Season stats for the featured team: record and win %, the current streak,
/// per-game tiles, and the scoring stretch drawn large.
struct SeasonPanel: View {
    let follow: FollowedTeam
    let state: Loadable<TeamCard>

    var body: some View {
        switch state {
        case .loading:
            CardSkeleton(height: 260)
        case .failed:
            EmptyView()
        case .loaded(let card):
            loaded(card)
        }
    }

    private func loaded(_ card: TeamCard) -> some View {
        let record = TeamStats.parseRecord(card.team.record)
        let streak = TeamStats.currentStreak(card.form)
        return Panel {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 1) {
                        Eyebrow("Season")
                        Text("Record & form")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Theme.ink)
                    }
                    Spacer(minLength: 8)
                    Text(card.team.standingSummary)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)

                HStack(alignment: .bottom, spacing: 20) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(card.team.record.isEmpty ? "—" : card.team.record)
                            .font(.system(size: 32, weight: .black, design: .monospaced))
                            .foregroundStyle(Theme.ink)
                        Eyebrow("Record")
                    }
                    VStack(alignment: .leading, spacing: 7) {
                        Text(record.map(TeamStats.winPct) ?? "—")
                            .font(.system(size: 21, weight: .semibold, design: .monospaced))
                            .foregroundStyle(Theme.ink)
                        Eyebrow("Win %")
                    }
                    Spacer(minLength: 0)
                    if let streak {
                        Text(streak.label)
                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                            .foregroundStyle(tint(streak.result))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(tint(streak.result).opacity(0.15), in: Capsule())
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 16)

                Divider().overlay(Theme.lineSoft)

                VStack(alignment: .leading, spacing: 10) {
                    Eyebrow(card.scoring.isEmpty ? "Season" : "Per game")
                    let tiles = tiles(card, record: record, streak: streak)
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                        ForEach(tiles, id: \.label) { t in
                            StatTile(value: t.value, label: t.label, ink: t.ink)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)

                if !card.scoring.isEmpty {
                    Divider().overlay(Theme.lineSoft)
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(alignment: .firstTextBaseline) {
                            Eyebrow("\(follow.league.scoreNoun) scored · last \(card.scoring.count)")
                            Spacer(minLength: 8)
                            Text("high \(card.scoring.max() ?? 0) · low \(card.scoring.min() ?? 0)")
                                .font(.system(size: 11.5))
                                .foregroundStyle(Theme.faint)
                        }
                        Bars(values: card.scoring, color: Color(cssHex: follow.color) ?? Theme.accent, height: 74, gap: 5, radius: 4)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 14)
                    .padding(.bottom, 18)
                }
            }
        }
    }

    private struct Tile {
        let value: String, label: String
        var ink: Color? = nil
    }

    /// With a scoring stretch we show per-game numbers; without one, the
    /// season line is all there is to say.
    private func tiles(_ card: TeamCard, record: TeamStats.Record?, streak: TeamStats.Streak?) -> [Tile] {
        guard !card.scoring.isEmpty else {
            return [
                Tile(value: card.team.record.isEmpty ? "—" : card.team.record, label: "Record"),
                Tile(value: record.map(TeamStats.winPct) ?? "—", label: "Win %"),
                Tile(value: streak?.label ?? "—", label: "Streak"),
            ]
        }
        let forAvg = TeamStats.mean(card.scoring)
        var tiles = [Tile(value: String(format: "%.1f", forAvg), label: "\(follow.league.scoreNoun)/G")]
        if let allowed = card.allowed {
            let againstAvg = TeamStats.mean(allowed)
            let diff = forAvg - againstAvg
            tiles.append(Tile(value: String(format: "%.1f", againstAvg), label: "Allowed/G"))
            tiles.append(Tile(
                value: String(format: "%@%.1f", diff >= 0 ? "+" : "", diff),
                label: "Diff",
                ink: diff >= 0 ? Theme.win : Theme.loss
            ))
            tiles.append(Tile(value: "\(card.scoring.max() ?? 0)", label: "High"))
        } else {
            tiles.append(Tile(value: "\(card.scoring.max() ?? 0)", label: "High"))
            tiles.append(Tile(value: "\(card.scoring.min() ?? 0)", label: "Low"))
        }
        tiles.append(Tile(value: "\(card.scoring.reduce(0, +))", label: "Total"))
        return tiles
    }

    private func tint(_ r: Outcome) -> Color {
        switch r {
        case .win: Theme.win
        case .loss: Theme.loss
        case .tie: Theme.muted
        }
    }
}
