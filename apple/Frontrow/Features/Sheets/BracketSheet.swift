import SwiftUI

/// The league's postseason, round by round, scrolling sideways — your team's
/// matchup outlined in the accent.
struct BracketSheet: View {
    let team: FollowedTeam
    @State private var state: Loadable<PlayoffBracket> = .loading

    var body: some View {
        SheetScaffold(
            mark: team.abbreviation,
            color: team.color,
            title: state.value?.name ?? team.league.fullName,
            subtitle: "\(team.displayName) on the path"
        ) {
            switch state {
            case .loading:
                SkeletonBlock(height: 260).padding(18)
            case .failed(let message):
                FailedState(title: "Couldn't load the bracket", message: message, retry: { Task { await load() } })
                    .padding(.top, 40)
            case .loaded(let bracket):
                if bracket.rounds.isEmpty {
                    ContentUnavailableView(
                        "No active bracket",
                        systemImage: "trophy",
                        description: Text("The postseason picture appears here once it starts.")
                    )
                    .padding(.top, 40)
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(alignment: .top, spacing: 16) {
                            ForEach(bracket.rounds) { round in
                                VStack(alignment: .leading, spacing: 12) {
                                    Text(round.isLive ? "● \(round.name)" : round.name)
                                        .font(.system(size: 10, weight: .bold))
                                        .tracking(1.2)
                                        .foregroundStyle(round.isLive ? Theme.live : Theme.faint)
                                    ForEach(round.matchups) { matchup in
                                        MatchupCard(matchup: matchup, mine: matchup.involves(team.teamId))
                                    }
                                }
                                .frame(width: 186)
                            }
                        }
                        .padding(.horizontal, 18)
                        .padding(.vertical, 16)
                    }
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        state = .loading
        do {
            state = .loaded(try await APIClient.shared.get("playoffs/\(team.league.rawValue)"))
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct MatchupCard: View {
    let matchup: PlayoffMatchup
    let mine: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            side(matchup.home)
            side(matchup.away)
            if !matchup.summary.isEmpty {
                Text(matchup.summary)
                    .font(.system(size: 11))
                    .foregroundStyle(matchup.state == .in ? Theme.live : Theme.faint)
                    .padding(.top, 7)
                    .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft).frame(height: 1) }
                    .padding(.top, 7)
            }
        }
        .padding(11)
        .background(background, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(border, lineWidth: 1)
        }
    }

    private var background: Color {
        if matchup.state == .in { return Theme.live.opacity(0.05) }
        if mine { return Theme.accent.opacity(0.06) }
        return Theme.surface
    }

    private var border: Color {
        if matchup.state == .in { return Theme.live.opacity(0.45) }
        if mine { return Theme.accent.opacity(0.5) }
        return Theme.line
    }

    private func side(_ s: PlayoffSide) -> some View {
        let dim = matchup.dims(s)
        return HStack(spacing: 8) {
            TeamMark(logo: s.logo, abbreviation: s.abbreviation, color: s.color, size: 22)
            Text("\(s.seed.map { "(\($0)) " } ?? "")\(s.displayName)")
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(dim ? Theme.faint : Theme.ink)
                .lineLimit(1)
            Spacer(minLength: 4)
            Text(s.score.map(String.init) ?? "–")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundStyle(dim ? Theme.faint : Theme.ink)
        }
        .padding(.vertical, 3)
    }
}
