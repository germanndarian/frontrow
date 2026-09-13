import WidgetKit
import SwiftUI

/// The lock screen family. These render into a monochrome, vibrant layer, so
/// they carry no colour of their own — legibility over branding, which is
/// what the system wants there.
struct LockScoreWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "frontrow.lock", provider: ScoreProvider()) { entry in
            LockScoreView(entry: entry)
                .containerBackground(.clear, for: .widget)
                .widgetURL(entry.headline.map { DeepLink.game($0.id) } ?? DeepLink.scores)
        }
        .configurationDisplayName("Frontrow score")
        .description("Your team's game, on the lock screen.")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryInline])
    }
}

struct LockScoreView: View {
    @Environment(\.widgetFamily) private var family
    let entry: ScoreEntry

    var body: some View {
        switch family {
        case .accessoryCircular: LockCircular(entry: entry)
        case .accessoryInline: LockInline(entry: entry)
        default: LockRectangular(entry: entry)
        }
    }
}

struct LockRectangular: View {
    let entry: ScoreEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let game = entry.headline {
                HStack(spacing: 4) {
                    if game.state == .in {
                        Image(systemName: "dot.radiowaves.left.and.right")
                            .font(.system(size: 9, weight: .bold))
                    }
                    Text(game.league.name)
                        .font(.system(size: 10, weight: .bold))
                        .widgetAccentable()
                    Spacer(minLength: 0)
                }
                HStack(spacing: 6) {
                    Text(Matchup.text(for: game))
                        .font(.system(size: 14, weight: .bold))
                        .lineLimit(1)
                    Spacer(minLength: 2)
                    if game.state != .pre {
                        Text("\(game.away.score ?? 0)–\(game.home.score ?? 0)")
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                    }
                }
                Text(StatusLine.text(for: game))
                    .font(.system(size: 11))
                    .lineLimit(1)
            } else {
                Text("Frontrow")
                    .font(.system(size: 12, weight: .bold))
                    .widgetAccentable()
                Text("No games this week")
                    .font(.system(size: 11))
            }
        }
    }

}

struct LockCircular: View {
    let entry: ScoreEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            if let game = entry.headline, game.state != .pre {
                VStack(spacing: 0) {
                    Text(game.away.abbreviation)
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                    Text("\(game.away.score ?? 0)–\(game.home.score ?? 0)")
                        .font(.system(size: 13, weight: .heavy, design: .monospaced))
                    Text(game.home.abbreviation)
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                }
                .minimumScaleFactor(0.6)
            } else if let game = entry.headline {
                VStack(spacing: 1) {
                    Text(game.away.abbreviation)
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                    Text("@")
                        .font(.system(size: 9, weight: .bold))
                    Text(game.home.abbreviation)
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                }
                .minimumScaleFactor(0.6)
            } else {
                Image(systemName: "sportscourt.fill").font(.system(size: 16, weight: .bold))
            }
        }
    }

}

struct LockInline: View {
    let entry: ScoreEntry

    @ViewBuilder
    var body: some View {
        if let game = entry.headline {
            switch game.state {
            case .pre:
                Text("\(Matchup.text(for: game)) · \(StartTime.text(for: game))")
            default:
                Text("\(game.away.abbreviation) \(game.away.score ?? 0)–\(game.home.score ?? 0) \(game.home.abbreviation) · \(StatusLine.text(for: game))")
            }
        } else {
            Text("Frontrow · no games this week")
        }
    }
}
