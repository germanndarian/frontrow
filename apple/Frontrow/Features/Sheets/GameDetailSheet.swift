import SwiftUI

/// One game in full: the score, the line score period by period, where it is
/// up to, and the details around it. A game that hasn't started counts down
/// to first pitch instead.
struct GameDetailSheet: View {
    let game: Game
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header
                    if game.state == .pre {
                        Countdown(startsAt: game.startsAt)
                            .padding(.top, 18)
                    } else if game.hasLineScore {
                        LineScore(game: game)
                            .padding(.top, 18)
                    }
                    details
                        .padding(.top, 18)
                    Color.clear.frame(height: 20)
                }
                .padding(.horizontal, 18)
                .padding(.top, 6)
            }
            .background(Theme.background)
            .navigationTitle(game.league.name)
            .navigationSubtitle(Text(StatusLine.text(for: game)))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        // Up from the bottom, full height, and swipe it away — the same sheet
        // the front door's sign-up uses.
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // ── The two teams and the score ──────────────────────────────────────

    private var header: some View {
        VStack(spacing: 12) {
            HStack {
                if game.state == .in {
                    LiveDot()
                    Text(game.shortDetail.isEmpty ? "LIVE" : game.shortDetail.uppercased())
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(Theme.live)
                } else {
                    Text(game.state == .post ? "FINAL" : "SCHEDULED")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(Theme.faint)
                }
                Spacer(minLength: 8)
                if let week = game.week {
                    Text("WEEK \(week)")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.muted)
                }
            }
            side(game.away)
            side(game.home)
        }
        .padding(16)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1)
        }
    }

    private func side(_ s: GameSide) -> some View {
        let leads = self.leads(s)
        return HStack(spacing: 12) {
            TeamMark(logo: s.logo, abbreviation: s.abbreviation, color: s.color, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(s.displayName)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(leads ? Theme.ink : Theme.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                if let record = s.record, !record.isEmpty {
                    Text(record)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.faint)
                }
            }
            Spacer(minLength: 8)
            Text(game.state == .pre ? "–" : "\(s.score ?? 0)")
                .font(.system(size: 30, weight: .bold, design: .monospaced))
                .foregroundStyle(leads ? Theme.ink : Theme.muted)
        }
    }

    private func leads(_ s: GameSide) -> Bool {
        guard game.state != .pre else { return true }
        let other = s.teamId == game.home.teamId ? game.away : game.home
        return (s.score ?? 0) >= (other.score ?? 0)
    }

    // ── Everything else the feed knows ───────────────────────────────────

    private var details: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let play = game.lastPlay ?? game.situation, !play.isEmpty {
                detail("Last play", play)
            }
            if let venue = game.venue, !venue.isEmpty { detail("Venue", venue) }
            if let broadcast = game.broadcast, !broadcast.isEmpty { detail("TV", broadcast) }
            if let odds = game.odds {
                if let line = odds.details, !line.isEmpty { detail("Line", line) }
                if let total = odds.overUnder { detail("Over/under", total.formatted()) }
            }
            if let start = game.startsAt {
                detail("Start", start.formatted(date: .abbreviated, time: .shortened))
            }
            if !game.statusDetail.isEmpty { detail("Status", game.statusDetail) }
        }
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1)
        }
    }

    private func detail(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Text(label)
                .font(.system(size: 12.5))
                .foregroundStyle(Theme.faint)
                .frame(width: 96, alignment: .leading)
            Text(value)
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 11)
        .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft).frame(height: 1) }
    }
}

/// The line score: a column per period and the running total.
struct LineScore: View {
    let game: Game

    var body: some View {
        let periods = game.periodCount
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 0) {
                Text("")
                    .frame(width: 52, alignment: .leading)
                ForEach(0..<periods, id: \.self) { index in
                    Text(game.league.periodLabel(index, of: periods))
                        .frame(maxWidth: .infinity)
                }
                Text(game.league.totalLabel)
                    .frame(width: 38)
            }
            .font(.system(size: 10.5, weight: .bold, design: .monospaced))
            .tracking(0.5)
            .foregroundStyle(Theme.faint)
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 8)

            row(game.away, periods: periods)
            row(game.home, periods: periods)
            Color.clear.frame(height: 6)
        }
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1)
        }
    }

    private func row(_ s: GameSide, periods: Int) -> some View {
        HStack(spacing: 0) {
            Text(s.abbreviation)
                .font(.system(size: 12.5, weight: .bold, design: .monospaced))
                .foregroundStyle(Theme.ink)
                .frame(width: 52, alignment: .leading)
            ForEach(0..<periods, id: \.self) { index in
                Text(value(s, at: index))
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundStyle(Theme.muted)
                    .frame(maxWidth: .infinity)
            }
            Text("\(s.score ?? 0)")
                .font(.system(size: 13.5, weight: .bold, design: .monospaced))
                .foregroundStyle(Theme.ink)
                .frame(width: 38)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 9)
        .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft).frame(height: 1) }
    }

    /// A period a side hasn't reached yet reads as a dash, not a zero.
    private func value(_ s: GameSide, at index: Int) -> String {
        guard let scores = s.linescores, index < scores.count else { return "–" }
        return "\(Int(scores[index]))"
    }
}

/// Time until first pitch, ticking down.
struct Countdown: View {
    let startsAt: Date?

    var body: some View {
        VStack(spacing: 8) {
            Eyebrow("Starts in")
            if let startsAt {
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    Text(Self.remaining(until: startsAt, now: context.date))
                        .font(.system(size: 40, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.ink)
                        .contentTransition(.numericText(countsDown: true))
                        .monospacedDigit()
                }
                Text(startsAt.formatted(date: .complete, time: .shortened))
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.faint)
                    .multilineTextAlignment(.center)
            } else {
                Text("Not scheduled yet")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.muted)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 22)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1)
        }
    }

    /// "2d 04:31:09", "04:31:09" or "31:09" — as much as is left and no more.
    static func remaining(until date: Date, now: Date = .now) -> String {
        let seconds = Int(date.timeIntervalSince(now).rounded())
        guard seconds > 0 else { return "Any moment" }
        let days = seconds / 86_400
        let hours = (seconds % 86_400) / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60
        if days > 0 { return String(format: "%dd %02d:%02d:%02d", days, hours, minutes, secs) }
        if hours > 0 { return String(format: "%02d:%02d:%02d", hours, minutes, secs) }
        return String(format: "%02d:%02d", minutes, secs)
    }
}

/// When more than one of your games is on at once, pick which to watch.
struct LiveGamesSheet: View {
    let games: [Game]
    let open: (Game) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(games) { game in
                        Button {
                            open(game)
                        } label: {
                            GameCard(game: game, followed: false)
                                .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                    Color.clear.frame(height: 20)
                }
                .padding(.horizontal, 18)
                .padding(.top, 6)
            }
            .background(Theme.background)
            .navigationTitle("Live now")
            .navigationSubtitle(Text("\(games.count) games"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }
}
