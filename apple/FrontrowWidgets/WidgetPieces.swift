import WidgetKit
import SwiftUI

/// Widget text colours. A widget sits on the wallpaper, so it takes the
/// system's own foreground styles rather than the app's fixed ink — that is
/// what keeps it legible in both appearances and on any background.
enum WidgetInk {
    static let primary = Color.primary
    static let muted = Color.primary.opacity(0.72)
    static let faint = Color.secondary
    static let hairline = Color.primary.opacity(0.12)
}

/// The app's name, its icon, and the live pill — the line every size opens
/// with in the design.
struct WidgetHeader: View {
    let live: Bool
    var compact: Bool

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "sportscourt.fill")
                .font(.system(size: compact ? 9 : 10, weight: .bold))
                .foregroundStyle(.tint)
            Text("FRONTROW")
                .font(.system(size: compact ? 8.5 : 9.5, weight: .heavy))
                .tracking(1.1)
                .foregroundStyle(WidgetInk.faint)
            Spacer(minLength: 4)
            if live {
                HStack(spacing: 3) {
                    Circle()
                        .fill(Theme.live)
                        .frame(width: compact ? 5 : 6, height: compact ? 5 : 6)
                    Text("LIVE")
                        .font(.system(size: compact ? 8.5 : 9.5, weight: .bold))
                        .foregroundStyle(Theme.live)
                }
            }
        }
    }
}

/// One team: colour tile, name, score. Sizes match the three widget sizes.
struct TeamLine: View {
    enum Size { case small, medium, large }

    let side: GameSide
    let state: GameState
    let lead: Bool
    let size: Size

    var body: some View {
        HStack(spacing: gap) {
            Text(side.abbreviation)
                .font(.system(size: tile * 0.3, weight: .bold, design: .monospaced))
                .foregroundStyle(.white)
                .frame(width: tile, height: tile)
                .background(
                    Color(cssHex: side.color) ?? .gray,
                    in: RoundedRectangle(cornerRadius: tile * 0.28, style: .continuous)
                )
            Text(name)
                .font(.system(size: nameSize, weight: .bold))
                .foregroundStyle(lead ? WidgetInk.primary : WidgetInk.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Spacer(minLength: 4)
            Text(state == .pre ? "–" : "\(side.score ?? 0)")
                .font(.system(size: scoreSize, weight: .bold, design: .monospaced))
                .foregroundStyle(lead ? WidgetInk.primary : WidgetInk.muted)
        }
    }

    /// The small size has no room for "Panthers" next to a score, so it uses
    /// the abbreviation the tile already shows — as the mockup does.
    private var name: String {
        switch size {
        case .small: side.abbreviation
        case .medium, .large: side.shortName.isEmpty ? side.displayName : side.shortName
        }
    }

    private var tile: CGFloat {
        switch size {
        case .small: 18
        case .medium: 22
        case .large: 28
        }
    }

    private var gap: CGFloat { size == .large ? 10 : 8 }

    private var nameSize: CGFloat {
        switch size {
        case .small: 11
        case .medium: 13
        case .large: 15
        }
    }

    private var scoreSize: CGFloat {
        switch size {
        case .small: 17
        case .medium: 18
        case .large: 24
        }
    }
}

/// Shown when no followed team has a game in the week.
struct EmptyLine: View {
    let isSample: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("No games this week")
                .font(.system(size: 12.5, weight: .bold))
                .foregroundStyle(WidgetInk.primary)
            Text(isSample ? "Open Frontrow to pick your teams." : "Your teams are off.")
                .font(.system(size: 10.5))
                .foregroundStyle(WidgetInk.faint)
                .lineLimit(2)
        }
    }
}

/// "2nd · 07:34", "Today · 7:05 PM", "Final".
enum StatusLine {
    static func text(for game: Game) -> String {
        switch game.state {
        case .in:
            return game.shortDetail.isEmpty ? "Live" : game.shortDetail
        case .pre:
            return StartTime.text(for: game)
        case .post:
            return game.shortDetail.isEmpty ? "Final" : game.shortDetail
        }
    }
}

/// "NYY @ TEX" — away at home, the way a fixture is written.
enum Matchup {
    static func text(for game: Game) -> String {
        "\(game.away.abbreviation) @ \(game.home.abbreviation)"
    }
}

/// "Today · 7:05 PM", "Tomorrow · 1:00 PM", "Sat · 7:05 PM".
enum StartTime {
    static func text(for game: Game) -> String {
        guard let date = game.startsAt else { return game.shortDetail }
        let time = date.formatted(date: .omitted, time: .shortened)
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today · \(time)" }
        if calendar.isDateInTomorrow(date) { return "Tomorrow · \(time)" }
        return "\(date.formatted(.dateTime.weekday(.abbreviated))) · \(time)"
    }
}
