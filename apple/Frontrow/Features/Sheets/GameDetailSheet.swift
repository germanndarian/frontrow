import SwiftUI

/// One game in full: the score, the line score period by period, where it is
/// up to, and the details around it. A game that hasn't started counts down
/// to first pitch instead.
struct GameDetailSheet: View {
    let game: Game
    @Environment(\.dismiss) private var dismiss
    @Environment(LiveFeed.self) private var feed: LiveFeed?
    @Environment(Pins.self) private var pins: Pins?
    @Environment(GameTracker.self) private var tracker: GameTracker?

    /// The freshest copy of this game the Scores tab has polled, falling back
    /// to the one the sheet was opened with.
    private var live: Game { feed?.fresh(game) ?? game }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header
                    if live.state == .pre {
                        Countdown(startsAt: live.startsAt)
                            .padding(.top, 18)
                    } else {
                        trackButton
                        // Football's own graphic: where the ball is and what
                        // it will take to keep it. There is none for the other
                        // sports, nor for a game that isn't under way.
                        if let field = live.field {
                            FieldPosition(game: live, field: field)
                                .padding(.top, 18)
                        }
                        if live.hasLineScore {
                            LineScore(game: live)
                                .padding(.top, 18)
                        }
                    }
                    details
                        .padding(.top, 18)
                    Color.clear.frame(height: 20)
                }
                .padding(.horizontal, 18)
                .padding(.top, 6)
            }
            .background(Theme.background)
            .navigationTitle(live.league.name)
            .navigationSubtitle(Text(StatusLine.text(for: live)))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if let pins {
                    ToolbarItem(placement: .topBarLeading) {
                        PinButton(game: live, pins: pins)
                            .labelStyle(.iconOnly)
                    }
                }
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

    /// Put the game on the Lock Screen. Only while it's on, and only for the
    /// sports with something that moves between pitches or plays — a game
    /// with nothing but a score would be a card that never changes.
    @ViewBuilder
    private var trackButton: some View {
        if let tracker, tracker.canTrack(live) || tracker.isTracking(live) {
            let on = tracker.isTracking(live)
            Button {
                withAnimation(.snappy(duration: 0.2)) {
                    if on { tracker.stop() } else { tracker.start(live) }
                }
            } label: {
                HStack(spacing: 7) {
                    Image(systemName: on ? "bell.badge.slash" : "lock.iphone")
                        .font(.system(size: 13, weight: .semibold))
                    Text(on ? "Stop tracking" : "Track on Lock Screen")
                        .font(.system(size: 14, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .contentShape(Rectangle())
            }
            .buttonStyle(.glass)
            .tint(on ? Theme.live : Theme.accent)
            .padding(.top, 18)
        }
    }

    // ── The two teams and the score ──────────────────────────────────────

    private var header: some View {
        VStack(spacing: 12) {
            HStack {
                if live.state == .in {
                    LiveDot()
                    Text(live.shortDetail.isEmpty ? "LIVE" : live.shortDetail.uppercased())
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(Theme.live)
                } else {
                    Text(live.state == .post ? "FINAL" : "SCHEDULED")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(Theme.faint)
                }
                Spacer(minLength: 8)
                if let week = live.week {
                    Text("WEEK \(week)")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.muted)
                }
            }
            side(live.away)
            side(live.home)
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
            Text(live.state == .pre ? "–" : "\(s.score ?? 0)")
                .font(.system(size: 30, weight: .bold, design: .monospaced))
                .foregroundStyle(leads ? Theme.ink : Theme.muted)
        }
    }

    private func leads(_ s: GameSide) -> Bool {
        guard live.state != .pre else { return true }
        let other = s.teamId == live.home.teamId ? live.away : live.home
        return (s.score ?? 0) >= (other.score ?? 0)
    }

    // ── Everything else the feed knows ───────────────────────────────────

    private var details: some View {
        VStack(alignment: .leading, spacing: 0) {
            if live.field == nil, let play = live.lastPlay ?? live.situation, !play.isEmpty {
                detail("Last play", play)
            }
            if let venue = live.venue, !venue.isEmpty { detail("Venue", venue) }
            if let broadcast = live.broadcast, !broadcast.isEmpty { detail("TV", broadcast) }
            if let odds = live.odds {
                if let line = odds.details, !line.isEmpty { detail("Line", line) }
                if let total = odds.overUnder { detail("Over/under", total.formatted()) }
            }
            if let start = live.startsAt {
                detail("Start", start.formatted(date: .abbreviated, time: .shortened))
            }
            if !live.statusDetail.isEmpty { detail("Status", live.statusDetail) }
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
    @Environment(LiveFeed.self) private var feed: LiveFeed?

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(games.map { feed?.fresh($0) ?? $0 }) { game in
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
