import SwiftUI

/// A team's full season: what's left, then what's already happened.
struct ScheduleSheet: View {
    let team: FollowedTeam
    @State private var state: Loadable<[ScheduleGame]> = .loading

    var body: some View {
        SheetScaffold(
            mark: team.abbreviation,
            color: team.color,
            title: team.displayName,
            subtitle: "Full schedule"
        ) {
            switch state {
            case .loading:
                SkeletonBlock(height: 260).padding(18)
            case .failed(let message):
                FailedState(title: "Couldn't load the schedule", message: message, retry: { Task { await load() } })
                    .padding(.top, 40)
            case .loaded(let games):
                let upcoming = games.filter { $0.state != .post }
                let results = games.filter { $0.state == .post }.reversed()
                if games.isEmpty {
                    ContentUnavailableView(
                        "No games listed",
                        systemImage: "calendar",
                        description: Text("The schedule hasn't been published yet.")
                    )
                    .padding(.top, 40)
                } else {
                    if !upcoming.isEmpty {
                        SheetGroupLabel(text: "Upcoming · \(upcoming.count)")
                        ForEach(upcoming) { ScheduleRow(game: $0) }
                    }
                    if !results.isEmpty {
                        SheetGroupLabel(text: "Results · \(results.count)")
                        ForEach(Array(results)) { ScheduleRow(game: $0) }
                    }
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        state = .loading
        do {
            let games: [ScheduleGame] = try await APIClient.shared.get(
                "schedule", query: ["league": team.league.rawValue, "teamId": team.teamId]
            )
            state = .loaded(games)
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct ScheduleRow: View {
    let game: ScheduleGame

    var body: some View {
        let done = game.state == .post
        HStack(spacing: 11) {
            Text(game.startsAt.map(Self.day) ?? "")
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(Theme.faint)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .frame(width: 72, alignment: .leading)
            Text(game.atVs)
                .font(.system(size: 11.5))
                .foregroundStyle(Theme.faint)
                .frame(width: 16)
            TeamMark(logo: game.opponentLogo, abbreviation: game.opponentAbbr, color: "#8C8C86", size: 26)
            Text(game.opponentName)
                .font(.system(size: 13.5, weight: .semibold))
                .foregroundStyle(Theme.ink)
                .lineLimit(1)
            Spacer(minLength: 6)
            VStack(alignment: .trailing, spacing: 2) {
                Text(done ? (game.score ?? "") : (game.startsAt.map(Self.time) ?? ""))
                    .font(.system(size: 12.5, weight: .semibold, design: .monospaced))
                    .foregroundStyle(resultColor(done))
                Text(done ? (game.result?.rawValue ?? "") : (game.broadcast ?? ""))
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.faint)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
        .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft.opacity(0.7)).frame(height: 1) }
    }

    private func resultColor(_ done: Bool) -> Color {
        guard done else { return Theme.ink }
        switch game.result {
        case .win: return Theme.win
        case .loss: return Theme.loss
        default: return Theme.muted
        }
    }

    /// "Sat 9/12"
    static func day(_ date: Date) -> String {
        date.formatted(.dateTime.weekday(.abbreviated)) + " " + date.formatted(.dateTime.month(.defaultDigits).day())
    }

    static func time(_ date: Date) -> String {
        date.formatted(date: .omitted, time: .shortened)
    }
}
