import SwiftUI

/// Live & Upcoming: league chips, then games grouped LIVE NOW / UPCOMING /
/// RESULTS. Followed teams' games get the accent border, as on the web.
struct ScoresScreen: View {
    let preferences: Preferences
    @State private var model: ScoresModel

    init(preferences: Preferences) {
        self.preferences = preferences
        _model = State(initialValue: ScoresModel(preferences: preferences))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    chips
                        .padding(.horizontal, 18)
                        .padding(.top, 6)
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
                                "Nothing on the slate",
                                systemImage: "calendar.badge.clock",
                                description: Text("No games in the leagues you follow right now.")
                            )
                            .padding(.top, 40)
                        } else {
                            ForEach(model.groups) { group in
                                SectionRule(title: group.title, detail: "\(group.games.count)")
                                    .padding(.horizontal, 18)
                                    .padding(.top, 22)
                                    .padding(.bottom, 12)
                                VStack(spacing: 12) {
                                    ForEach(group.games) { game in
                                        GameCard(game: game, followed: model.isFollowed(game))
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
            .navigationSubtitle(Text(Date.now, format: .dateTime.weekday(.wide).month(.abbreviated).day()))
            .toolbar {
                if model.liveCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        HStack(spacing: 6) {
                            LiveDot()
                            Text("\(model.liveCount) LIVE")
                                .font(.caption.weight(.bold))
                                .tracking(0.8)
                        }
                        .foregroundStyle(Theme.live)
                    }
                }
            }
        }
        .task { await model.load() }
        .task(id: preferences) { await model.apply(preferences) }
    }

    /// League filter chips, with "All" in front of the followed leagues.
    private var chips: some View {
        ChipRow {
            Chip(label: "All", on: model.league == nil) { model.league = nil }
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
