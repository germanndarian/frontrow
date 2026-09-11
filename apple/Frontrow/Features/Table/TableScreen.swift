import SwiftUI

/// Around the League: one league's table, your team's row highlighted.
struct TableScreen: View {
    let preferences: Preferences
    @State private var model: TableModel

    init(preferences: Preferences) {
        self.preferences = preferences
        _model = State(initialValue: TableModel(preferences: preferences))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    if let active = model.active, let key = model.activeKey {
                        ChipRow {
                            ForEach(model.leagues) { league in
                                Chip(label: league.name, on: league == active) { select(league) }
                            }
                        }
                        .padding(.horizontal, 18)

                        Group {
                            switch model.standings[key] {
                            case .loading:
                                CardSkeleton(height: 320)
                            case .failed(let message):
                                FailedState(
                                    title: "Couldn't load \(active.name) standings",
                                    message: message,
                                    retry: { Task { await model.standings.fetch(key, force: true) } }
                                )
                                .padding(.top, 30)
                            case .loaded(let group):
                                if group.rows.isEmpty {
                                    ContentUnavailableView(
                                        "No standings yet",
                                        systemImage: "tablecells",
                                        description: Text("Check back once games are underway.")
                                    )
                                    .padding(.top, 30)
                                } else {
                                    StandingsTable(league: active, group: group)
                                }
                            }
                        }
                        .padding(.horizontal, 18)
                        .padding(.top, 16)
                    } else {
                        ContentUnavailableView(
                            "No leagues followed",
                            systemImage: "tablecells",
                            description: Text("Pick your leagues in Settings to see standings.")
                        )
                        .padding(.top, 60)
                    }
                    Color.clear.frame(height: 24)
                }
                .padding(.top, 2)
            }
            .background(Theme.background)
            .refreshable { await model.load(force: true) }
            .navigationTitle("Around the League")
            .navigationSubtitle(Text(model.active.map { "\($0.name) · \($0.groupNoun)" } ?? ""))
        }
        .task(id: model.active) { await model.load() }
        .task(id: preferences) { await model.apply(preferences) }
    }

    private func select(_ league: League) {
        withAnimation(.snappy(duration: 0.2)) { model.league = league }
    }
}

struct StandingsTable: View {
    let league: League
    let group: StandingsGroup

    var body: some View {
        let columns = league.standingsColumns
        Panel {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 2) {
                    Eyebrow("\(league.name) · \(league.groupNoun)")
                    Text(group.name)
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(Theme.ink)
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 12)

                HStack(spacing: 6) {
                    Text("#").frame(width: 14, alignment: .leading)
                    Text("TEAM").frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(columns) { column in
                        Text(column.label).frame(width: 34, alignment: .trailing)
                    }
                }
                .font(.system(size: 10, weight: .semibold))
                .tracking(0.8)
                .foregroundStyle(Theme.faint)
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
                .overlay(alignment: .bottom) { Rectangle().fill(Theme.lineSoft).frame(height: 1) }

                ForEach(group.rows) { row in
                    HStack(spacing: 6) {
                        Text("\(row.position)")
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundStyle(row.followed ? Theme.accent : Theme.faint)
                            .frame(width: 14, alignment: .leading)
                        HStack(spacing: 7) {
                            TeamMark(logo: row.logo, abbreviation: row.abbreviation, color: "#8C8C86", size: 22)
                            Text(row.shortName)
                                .font(.system(size: 13.5, weight: .semibold))
                                .foregroundStyle(row.followed ? Theme.ink : Theme.muted)
                                .lineLimit(1)
                                .minimumScaleFactor(0.75)
                            if let clinched = row.clinched, !clinched.isEmpty {
                                Text(clinched)
                                    .font(.system(size: 9))
                                    .foregroundStyle(Theme.faint)
                                    .baselineOffset(6)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        ForEach(columns) { column in
                            Text(row.value(column.key))
                                .font(.system(size: column.emphasis ? 13 : 12.5,
                                              weight: column.emphasis ? .bold : .medium,
                                              design: .monospaced))
                                .foregroundStyle(column.emphasis ? Theme.ink : Theme.muted)
                                .frame(width: 34, alignment: .trailing)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 11)
                    .background(row.followed ? Theme.accent.opacity(0.07) : .clear)
                    .overlay(alignment: .bottom) { Rectangle().fill(Theme.lineSoft.opacity(0.7)).frame(height: 1) }
                }

                Text(group.clinchNote ?? "Your team highlighted. Updated as games finish.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.faint)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 13)
            }
        }
    }
}
