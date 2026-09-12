import SwiftUI

/// The detail sheets the tabs open. Native sheets, so they come up from the
/// bottom with a grabber and swipe away for free.
enum AppSheet: Identifiable {
    case schedule(FollowedTeam)
    case bracket(FollowedTeam)
    case player(FollowedPlayer)
    case game(Game)
    /// More than one game on at once: pick which to watch.
    case liveGames([Game])

    var id: String {
        switch self {
        case .schedule(let t): "schedule:\(t.id)"
        case .bracket(let t): "bracket:\(t.id)"
        case .player(let p): "player:\(p.id)"
        case .game(let g): "game:\(g.id)"
        case .liveGames(let games): "live:\(games.map(\.id).joined(separator: ","))"
        }
    }
}

/// Shared sheet chrome: a tinted mark, the title and a subtitle, with Done
/// on the right. No navigation bar — the header is the bar, which keeps the
/// sheet as short as what it holds.
struct SheetScaffold<Content: View>: View {
    let mark: String
    let color: String
    let title: String
    let subtitle: String
    @ViewBuilder var content: Content
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                content
                Color.clear.frame(height: 24)
            }
        }
        .background(Theme.background)
        .safeAreaInset(edge: .top, spacing: 0) {
            HStack(spacing: 12) {
                TeamMark(logo: "", abbreviation: mark, color: color, size: 38)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    Text(subtitle)
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                Button("Done") { dismiss() }
                    .font(.system(size: 15, weight: .semibold))
                    .buttonStyle(.glass)
            }
            .padding(.horizontal, 18)
            .padding(.top, 16)
            .padding(.bottom, 12)
            .background(.bar)
        }
        .presentationDragIndicator(.visible)
    }
}

/// A label between groups of rows inside a sheet.
struct SheetGroupLabel: View {
    let text: String

    var body: some View {
        Eyebrow(text)
            .padding(.horizontal, 18)
            .padding(.top, 18)
            .padding(.bottom, 8)
    }
}
