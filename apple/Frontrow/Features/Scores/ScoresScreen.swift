import SwiftUI

/// Live & Upcoming: league chips, then games grouped LIVE NOW / UPCOMING /
/// RESULTS. Followed teams' games get the accent border, as on the web.
struct ScoresScreen: View {
    let preferences: Preferences
    @Binding var sheet: AppSheet?
    @Environment(LiveFeed.self) private var feed: LiveFeed?
    @Environment(Pins.self) private var pins: Pins?
    @Environment(GameTracker.self) private var tracker: GameTracker?
    @State private var model: ScoresModel

    init(preferences: Preferences, sheet: Binding<AppSheet?>) {
        self.preferences = preferences
        _sheet = sheet
        _model = State(initialValue: ScoresModel(preferences: preferences))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    WeekStrip(weeks: model.weeks, selected: model.week) { window in
                        Task { await model.select(window) }
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 6)

                    if let note = model.weekNote {
                        Text(note)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                            .padding(.horizontal, 18)
                            .padding(.top, 6)
                            .transition(.opacity)
                    }

                    chips
                        .padding(.horizontal, 18)
                        .padding(.top, 4)
                        .padding(.bottom, 4)

                    switch model.phase {
                    case .idle, .loading:
                        VStack(spacing: 12) {
                            ForEach(0..<3, id: \.self) { _ in GameCardSkeleton() }
                        }
                        .padding(.horizontal, 18)
                        .padding(.top, 18)
                    case .failed(let message):
                        ContentUnavailableView {
                            Label("Couldn't reach the scoreboard", systemImage: "wifi.exclamationmark")
                        } description: {
                            Text(message)
                        } actions: {
                            Button("Try again") { Task { await model.load() } }
                                .buttonStyle(.glass)
                        }
                        .padding(.top, 40)
                    case .loaded:
                        if model.groups.isEmpty {
                            ContentUnavailableView(
                                model.league == nil && !model.showingEverything ? "None of your teams play" : "Nothing on the slate",
                                systemImage: "calendar.badge.clock",
                                description: Text(
                                    model.league == nil && !model.showingEverything
                                        ? "Your teams have no games in \(model.week.range). Pick a league to see everything that's on."
                                        : "No games for the leagues you follow in \(model.week.range)."
                                )
                            )
                            .padding(.top, 40)
                        } else {
                            ForEach(model.groups) { group in
                                SectionRule(
                                    title: group.title,
                                    detail: model.league == nil
                                        ? "\(group.games.count)"
                                        : "\(group.games.count) · \(model.followedCount(in: group.games)) yours",
                                    accent: model.followedCount(in: group.games) > 0 ? Theme.accent : nil
                                )
                                    .padding(.horizontal, 18)
                                    .padding(.top, 22)
                                    .padding(.bottom, 12)
                                VStack(spacing: 12) {
                                    ForEach(group.games) { game in
                                        Button {
                                            sheet = .game(game)
                                        } label: {
                                            GameCard(
                                                game: game,
                                                followed: model.marksFollowed && model.isFollowed(game),
                                                pinned: model.pinsApply && pins?.contains(game) == true
                                            )
                                            .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                                        }
                                        .buttonStyle(.plain)
                                        // Press and hold to pin. Only inside a
                                        // league, since that is the only list
                                        // a pin reorders.
                                        .contextMenu {
                                            if model.pinsApply, let pins {
                                                PinButton(game: game, pins: pins)
                                            }
                                        }
                                    }
                                }
                                .padding(.horizontal, 18)
                            }
                            if model.liveCount > 0 {
                                HStack(spacing: 8) {
                                    LiveDot()
                                    Text("Auto-refreshing \(model.liveCount) live \(model.liveCount == 1 ? "game" : "games")")
                                }
                                .font(.footnote)
                                .foregroundStyle(Theme.faint)
                                .padding(.horizontal, 18)
                                .padding(.top, 18)
                            }
                        }
                    }
                    Color.clear.frame(height: 24)
                }
            }
            .background(Theme.background)
            .refreshable { await model.load() }
            .navigationTitle("Live & Upcoming")
            .navigationSubtitle(Text("\(model.week.label) · \(model.week.range)"))
            .toolbar {
                if model.liveCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            let live = model.visible.filter { $0.state == .in }
                            sheet = live.count == 1 ? .game(live[0]) : .liveGames(live)
                        } label: {
                            HStack(spacing: 6) {
                                LiveDot()
                                Text("\(model.liveCount) LIVE")
                                    .font(.caption.weight(.bold))
                                    .tracking(0.8)
                            }
                            .foregroundStyle(Theme.live)
                            .contentShape(Capsule())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(model.liveCount) live games")
                    }
                }
            }
        }
        .task { await model.load() }
        .task(id: preferences) { await model.apply(preferences) }
        // Hand every poll to the sheets stacked above this screen, so an open
        // game follows the same refresh rather than freezing on the score it
        // was opened with.
        .onChange(of: model.games, initial: true) { _, games in
            feed?.publish(games)
            // A pinned game that has finished has nothing left to say.
            pins?.forget(finishedIn: games)
            // The Lock Screen rides on this poll rather than one of its own.
            tracker?.update(from: games)
        }
        .onChange(of: pins?.ids ?? [], initial: true) { _, ids in model.pinned = ids }
    }

    /// League filter chips, with "All" in front of the followed leagues.
    private var chips: some View {
        ChipRow {
            Chip(label: model.showingEverything ? "All" : "Your teams", on: model.league == nil) { model.league = nil }
            ForEach(model.leagues) { league in
                Chip(label: league.name, on: model.league == league) { model.league = league }
            }
        }
    }
}

struct LiveDot: View {
    @State private var pulse = false

    var body: some View {
        Circle()
            .fill(Theme.live)
            .frame(width: 7, height: 7)
            .overlay {
                Circle()
                    .stroke(Theme.live.opacity(pulse ? 0 : 0.55), lineWidth: pulse ? 8 : 0)
                    .scaleEffect(pulse ? 2.2 : 1)
            }
            .onAppear {
                withAnimation(.easeOut(duration: 1.8).repeatForever(autoreverses: false)) { pulse = true }
            }
            .accessibilityHidden(true)
    }
}
