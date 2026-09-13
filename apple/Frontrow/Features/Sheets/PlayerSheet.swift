import SwiftUI

/// Everything the feed has on one player: the full stat grid with labels and
/// the complete game log.
struct PlayerSheet: View {
    let follow: FollowedPlayer
    @State private var state: Loadable<Player> = .loading

    var body: some View {
        SheetScaffold(
            mark: follow.teamAbbr,
            color: state.value?.color ?? "#8C8C86",
            title: follow.fullName,
            subtitle: state.value.map { "\($0.subtitle) · \($0.seasonLabel)" } ?? follow.teamAbbr,
            // The follow carries the headshot, so the face is there from the
            // first frame rather than waiting on the stats to land.
            headshot: state.value?.headshot ?? follow.headshot
        ) {
            switch state {
            case .loading:
                SkeletonBlock(height: 260).padding(18)
            case .failed(let message):
                FailedState(title: "Couldn't load \(follow.fullName)", message: message, retry: { Task { await load() } })
                    .padding(.top, 40)
            case .loaded(let player):
                if player.isEmpty {
                    ContentUnavailableView(
                        "No stats yet",
                        systemImage: "chart.bar",
                        description: Text("Season stats and recent games appear here once the feed has them.")
                    )
                    .padding(.top, 40)
                } else {
                    StatGrid(stats: player.stats, labelled: true)
                        .padding(.horizontal, 18)
                        .padding(.top, 16)
                    if !player.recent.entries.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Eyebrow("Last \(player.recent.entries.count) · \(player.recent.label)")
                            GameLogRows(entries: player.recent.entries, league: player.league)
                        }
                        .padding(.horizontal, 18)
                        .padding(.top, 18)
                    }
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        state = .loading
        do {
            state = .loaded(try await APIClient.shared.get(
                "player/\(follow.playerId)", query: ["league": follow.league.rawValue]
            ))
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}
