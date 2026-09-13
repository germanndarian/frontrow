import SwiftUI

/// Your Players: a card per starred name — headshot, season stats with
/// league ranks, a sparkline and the last few games. Tap for the full sheet.
struct PlayersScreen: View {
    let preferences: Preferences
    @Binding var sheet: AppSheet?
    @State private var model: PlayersModel
    /// Teams folded away, by abbreviation. Kept for the session only — a fold
    /// is how you're reading the screen now, not a setting.
    @State private var collapsed: Set<String> = []

    init(preferences: Preferences, sheet: Binding<AppSheet?>) {
        self.preferences = preferences
        _sheet = sheet
        _model = State(initialValue: PlayersModel(preferences: preferences))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    if model.followed.isEmpty {
                        ContentUnavailableView(
                            "No players starred",
                            systemImage: "person.crop.circle",
                            description: Text("Star the names you tune in for in Settings.")
                        )
                        .padding(.top, 60)
                    } else {
                        ForEach(model.sections) { section in
                            let folded = collapsed.contains(section.id)
                            SectionRule(
                                title: section.title.uppercased(),
                                // Folded away, the count stands in for the
                                // cards you can no longer see.
                                detail: folded
                                    ? "\(section.teamAbbr) · \(section.players.count)"
                                    : section.teamAbbr,
                                accent: Color(cssHex: section.color),
                                collapsed: folded,
                                toggle: { toggle(section.id) }
                            )
                            .padding(.top, section.id == model.sections.first?.id ? 0 : 10)
                            if !folded {
                                ForEach(section.players) { follow in
                                    PlayerCardView(
                                        follow: follow,
                                        state: model.players[follow],
                                        onOpen: { sheet = .player(follow) },
                                        onRetry: { Task { await model.players.fetch(follow, force: true) } }
                                    )
                                    .transition(.opacity.combined(with: .scale(scale: 0.98, anchor: .top)))
                                }
                            }
                        }
                    }
                    Color.clear.frame(height: 24)
                }
                .padding(.horizontal, 18)
                .padding(.top, 6)
            }
            .background(Theme.background)
            .refreshable { await model.load(force: true) }
            .navigationTitle("Your Players")
            .navigationSubtitle(Text("\(model.followed.count) starred"))
        }
        .task { await model.load() }
        .task(id: preferences) { await model.apply(preferences) }
    }

    private func toggle(_ team: String) {
        withAnimation(.snappy(duration: 0.25)) {
            if collapsed.contains(team) {
                collapsed.remove(team)
            } else {
                collapsed.insert(team)
            }
        }
    }
}

struct PlayerCardView: View {
    let follow: FollowedPlayer
    let state: Loadable<Player>
    let onOpen: () -> Void
    let onRetry: () -> Void

    var body: some View {
        switch state {
        case .loading:
            CardSkeleton(height: 210)
        case .failed(let message):
            Panel {
                VStack(spacing: 10) {
                    Text(follow.fullName)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.ink)
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(Theme.faint)
                        .multilineTextAlignment(.center)
                    Button("Try again", action: onRetry).buttonStyle(.glass)
                }
                .frame(maxWidth: .infinity)
                .padding(20)
            }
        case .loaded(let player):
            loaded(player)
        }
    }

    private func loaded(_ player: Player) -> some View {
        Panel(radius: 22) {
            VStack(alignment: .leading, spacing: 0) {
                Button(action: onOpen) {
                    HStack(spacing: 13) {
                        Headshot(url: player.headshot, name: player.fullName, color: player.color)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(player.fullName)
                                .font(.system(size: 17.5, weight: .heavy))
                                .foregroundStyle(Theme.ink)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                            Text(player.subtitle)
                                .font(.system(size: 12.5))
                                .foregroundStyle(Theme.muted)
                        }
                        Spacer(minLength: 6)
                        Text(player.seasonChip)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Theme.faint)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Theme.background2.opacity(0.6), in: Capsule())
                            .overlay { Capsule().stroke(Theme.line, lineWidth: 1) }
                    }
                    .padding(16)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if player.isEmpty {
                    Text("Season stats and recent games appear here once the feed has them.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.faint)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 16)
                } else {
                    StatGrid(stats: player.stats)
                        .padding(.horizontal, 16)

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Eyebrow("Last \(player.recent.entries.count) · \(player.recent.label)")
                            Spacer(minLength: 8)
                            Bars(
                                values: player.recent.entries.reversed().map { Int($0.primary.rounded()) },
                                color: Color(cssHex: player.color) ?? Theme.accent,
                                height: 22
                            )
                            .frame(width: 90)
                        }
                        GameLogRows(entries: Array(player.recent.entries.prefix(4)), league: player.league)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 14)
                    .padding(.bottom, 16)
                }
            }
        }
    }
}

/// Season stats in a three-wide grid; leading the league turns the cell gold.
struct StatGrid: View {
    let stats: [PlayerSeasonStat]
    var labelled = false

    var body: some View {
        let shown = Array(stats.prefix(6))
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: labelled ? 8 : 0), count: 3), spacing: labelled ? 8 : 0) {
            ForEach(Array(shown.enumerated()), id: \.element.id) { index, stat in
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 6) {
                        Text(stat.abbr)
                            .font(.system(size: 10.5, weight: .semibold))
                            .tracking(0.8)
                            .foregroundStyle(Theme.faint)
                        Spacer(minLength: 0)
                        Text(stat.rankText)
                            .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                            .foregroundStyle(stat.leads ? Theme.gold : Theme.faint)
                            .lineLimit(1)
                    }
                    Text(stat.value)
                        .font(.system(size: 19, weight: .semibold, design: .monospaced))
                        .foregroundStyle(stat.leads ? Theme.gold : Theme.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    if labelled {
                        Text(stat.label)
                            .font(.system(size: 10.5))
                            .foregroundStyle(Theme.faint)
                            .lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.vertical, 11)
                .background {
                    if labelled {
                        RoundedRectangle(cornerRadius: 13, style: .continuous)
                            .fill(Theme.background2.opacity(0.6))
                            .overlay {
                                RoundedRectangle(cornerRadius: 13, style: .continuous).stroke(Theme.lineSoft, lineWidth: 1)
                            }
                    }
                }
                .overlay(alignment: .leading) {
                    if !labelled && index % 3 != 0 {
                        Rectangle().fill(Theme.lineSoft).frame(width: 1)
                    }
                }
                .overlay(alignment: .top) {
                    if !labelled && index >= 3 {
                        Rectangle().fill(Theme.lineSoft).frame(height: 1)
                    }
                }
            }
        }
        .background {
            if !labelled {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Theme.background2.opacity(0.6))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.lineSoft, lineWidth: 1)
                    }
            }
        }
    }
}

/// The game log: outcome, opponent, and the three headline numbers.
struct GameLogRows: View {
    let entries: [GameLogEntry]
    let league: League

    var body: some View {
        VStack(spacing: 0) {
            ForEach(entries) { entry in
                HStack(spacing: 9) {
                    OutcomeMark(result: entry.result, size: 11.5)
                        .frame(width: 16)
                    TeamMark(logo: entry.opponentLogo, abbreviation: entry.opponentAbbr, color: "#8C8C86", size: 20)
                    Text("\(entry.atVs) \(entry.opponentAbbr)")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.faint)
                        .frame(width: 58, alignment: .leading)
                    Spacer(minLength: 6)
                    Text(entry.headline(league))
                        .font(.system(size: 11.5, design: .monospaced))
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
                .padding(.vertical, 7)
                .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft.opacity(0.7)).frame(height: 1) }
            }
        }
    }
}
