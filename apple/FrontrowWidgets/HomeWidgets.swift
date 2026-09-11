import WidgetKit
import SwiftUI

/// The home-screen widget, in the three sizes the design calls for. The
/// material is the system's own — `containerBackground` is what gives a
/// widget the glass it shares with the rest of the home screen — with the
/// app's tint laid over it so a Frontrow tile still reads as Frontrow.
struct ScoresWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "frontrow.scores", provider: ScoreProvider()) { entry in
            ScoresWidgetView(entry: entry)
                .containerBackground(for: .widget) { WidgetGround(accent: entry.accent) }
                .widgetURL(URL(string: "frontrow://scores"))
        }
        .configurationDisplayName("Live & Next")
        .description("The game your teams are playing, and what's next.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

/// Glass in light mode, the midnight wash from the mockup in dark — the same
/// two grounds the app itself paints.
struct WidgetGround: View {
    let accent: AccentId
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        if scheme == .dark {
            Rectangle()
                .fill(Color(hex: 0x0F1622))
                .overlay {
                    RadialGradient(
                        colors: [accent.color.opacity(0.38), .clear],
                        center: .init(x: 0.85, y: 0.05), startRadius: 0, endRadius: 240
                    )
                }
                .overlay {
                    RadialGradient(
                        colors: [Color(hex: 0x7A5CE0).opacity(0.26), .clear],
                        center: .init(x: 0.05, y: 0.95), startRadius: 0, endRadius: 220
                    )
                }
        } else {
            Rectangle()
                .fill(Theme.surface)
                .overlay {
                    LinearGradient(
                        colors: [accent.color.opacity(0.16), .clear],
                        startPoint: .topTrailing, endPoint: .bottomLeading
                    )
                }
        }
    }
}

struct ScoresWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: ScoreEntry

    var body: some View {
        switch family {
        case .systemMedium: MediumWidget(entry: entry)
        case .systemLarge: LargeWidget(entry: entry)
        default: SmallWidget(entry: entry)
        }
    }
}

// ── Small · 2×2 ─────────────────────────────────────────────────────────────

struct SmallWidget: View {
    let entry: ScoreEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            WidgetHeader(live: entry.live != nil, compact: true)
            Spacer(minLength: 6)
            if let game = entry.headline {
                VStack(spacing: 7) {
                    TeamLine(side: game.away, state: game.state, lead: leads(game, game.away), size: .small)
                    TeamLine(side: game.home, state: game.state, lead: leads(game, game.home), size: .small)
                }
            } else {
                EmptyLine(isSample: entry.isSample)
            }
            Spacer(minLength: 6)
            if let game = entry.headline {
                Divider().overlay(WidgetInk.hairline)
                Text(StatusLine.text(for: game))
                    .font(.system(size: 9.5))
                    .foregroundStyle(WidgetInk.faint)
                    .lineLimit(1)
                    .padding(.top, 6)
            }
        }
    }

    private func leads(_ game: Game, _ side: GameSide) -> Bool {
        guard game.state != .pre else { return true }
        let other = side.teamId == game.home.teamId ? game.away : game.home
        return (side.score ?? 0) >= (other.score ?? 0)
    }
}

// ── Medium · 4×2 ────────────────────────────────────────────────────────────

struct MediumWidget: View {
    let entry: ScoreEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 0) {
                WidgetHeader(live: entry.live != nil, compact: false)
                Spacer(minLength: 8)
                if let game = entry.headline {
                    VStack(spacing: 8) {
                        TeamLine(side: game.away, state: game.state, lead: leads(game, game.away), size: .medium)
                        TeamLine(side: game.home, state: game.state, lead: leads(game, game.home), size: .medium)
                    }
                    Spacer(minLength: 8)
                    Text(StatusLine.text(for: game))
                        .font(.system(size: 10))
                        .foregroundStyle(WidgetInk.faint)
                        .lineLimit(1)
                } else {
                    EmptyLine(isSample: entry.isSample)
                    Spacer(minLength: 0)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Rectangle().fill(WidgetInk.hairline).frame(width: 1)

            VStack(alignment: .leading, spacing: 8) {
                Text("NEXT")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.2)
                    .foregroundStyle(WidgetInk.faint)
                if let next = nextAfterHeadline {
                    Text(Matchup.text(for: next))
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(WidgetInk.primary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    Text(StartTime.text(for: next))
                        .font(.system(size: 10))
                        .foregroundStyle(WidgetInk.faint)
                        .lineLimit(2)
                } else {
                    Text("Nothing scheduled")
                        .font(.system(size: 11.5, weight: .semibold))
                        .foregroundStyle(WidgetInk.faint)
                }
                Spacer(minLength: 0)
            }
            .frame(width: 108, alignment: .leading)
        }
    }

    /// The headline already shows one game; "next" is the one after it.
    private var nextAfterHeadline: Game? {
        guard let headline = entry.headline else { return entry.upcoming.first }
        return entry.upcoming.first { $0.id != headline.id }
    }

    private func leads(_ game: Game, _ side: GameSide) -> Bool {
        guard game.state != .pre else { return true }
        let other = side.teamId == game.home.teamId ? game.away : game.home
        return (side.score ?? 0) >= (other.score ?? 0)
    }
}

// ── Large · 4×4 ─────────────────────────────────────────────────────────────

struct LargeWidget: View {
    let entry: ScoreEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            WidgetHeader(live: entry.live != nil, compact: false)
                .padding(.bottom, 14)

            if let game = entry.headline {
                VStack(spacing: 10) {
                    TeamLine(side: game.away, state: game.state, lead: leads(game, game.away), size: .large)
                    TeamLine(side: game.home, state: game.state, lead: leads(game, game.home), size: .large)
                }
                .padding(.bottom, 12)
                Divider().overlay(WidgetInk.hairline)
                Text(StatusLine.text(for: game))
                    .font(.system(size: 11))
                    .foregroundStyle(WidgetInk.muted)
                    .padding(.top, 10)
                    .padding(.bottom, 14)
            } else {
                EmptyLine(isSample: entry.isSample)
                    .padding(.bottom, 14)
            }

            Text("UP NEXT")
                .font(.system(size: 9, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(WidgetInk.faint)
                .padding(.bottom, 6)

            ForEach(rest) { game in
                HStack {
                    Text(Matchup.text(for: game))
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(WidgetInk.primary)
                        .lineLimit(1)
                    Spacer(minLength: 8)
                    Text(StartTime.text(for: game))
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(WidgetInk.faint)
                        .lineLimit(1)
                }
                .padding(.vertical, 8)
                .overlay(alignment: .top) { Rectangle().fill(WidgetInk.hairline).frame(height: 1) }
            }
            if rest.isEmpty {
                Text("Nothing else scheduled this week.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(WidgetInk.faint)
                    .padding(.top, 4)
            }

            Spacer(minLength: 0)

            if let footer {
                Text(footer)
                    .font(.system(size: 10.5))
                    .foregroundStyle(WidgetInk.faint)
                    .lineLimit(1)
                    .padding(.top, 10)
                    .overlay(alignment: .top) { Rectangle().fill(WidgetInk.hairline).frame(height: 1) }
            }
        }
    }

    private var rest: [Game] {
        guard let headline = entry.headline else { return entry.upcoming }
        return Array(entry.upcoming.filter { $0.id != headline.id }.prefix(3))
    }

    private var footer: String? {
        guard let game = entry.headline else { return nil }
        if let venue = game.venue, !venue.isEmpty { return "\(game.league.name) · \(venue)" }
        return game.league.name
    }

    private func leads(_ game: Game, _ side: GameSide) -> Bool {
        guard game.state != .pre else { return true }
        let other = side.teamId == game.home.teamId ? game.away : game.home
        return (side.score ?? 0) >= (other.score ?? 0)
    }
}
