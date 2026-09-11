import SwiftUI

/// The five tabs. The tab bar is native Liquid Glass on iOS 26 and, like
/// Apple Music, shrinks to its icons when you scroll down and comes back
/// when you scroll up or tap it.
struct RootView: View {
    @State private var selection: Area = .scores
    @State private var sheet: AppSheet?

    enum Area: String, CaseIterable, Identifiable {
        case scores, teams, players, table, settings
        var id: String { rawValue }
    }

    var body: some View {
        TabView(selection: $selection) {
            Tab("Scores", systemImage: "sportscourt", value: .scores) {
                ScoresScreen()
            }
            Tab("Teams", systemImage: "shield.checkered", value: .teams) {
                TeamsScreen(sheet: $sheet)
            }
            Tab("Players", systemImage: "person.crop.circle", value: .players) {
                PlayersScreen(sheet: $sheet)
            }
            Tab("Table", systemImage: "tablecells", value: .table) {
                TableScreen()
            }
            Tab("Settings", systemImage: "gearshape", value: .settings) {
                PlaceholderScreen(title: "Settings", phase: 3)
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .sheet(item: $sheet) { which in
            switch which {
            case .schedule(let team): ScheduleSheet(team: team)
            case .bracket(let team): BracketSheet(team: team)
            case .player(let player): PlayerSheet(follow: player)
            }
        }
    }
}

/// Stand-in for the tabs that arrive in later phases.
struct PlaceholderScreen: View {
    let title: String
    let phase: Int

    var body: some View {
        NavigationStack {
            ScrollView {
                ContentUnavailableView(
                    title,
                    systemImage: "hourglass",
                    description: Text("Coming in Phase \(phase) of the native app.")
                )
                .padding(.top, 120)
            }
            .background(Theme.background)
            .navigationTitle(title)
        }
    }
}
