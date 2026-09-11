import SwiftUI

/// The five tabs. The tab bar is native Liquid Glass on iOS 26 and, like
/// Apple Music, shrinks to its icons when you scroll down and comes back
/// when you scroll up or tap it.
struct RootView: View {
    @State private var selection: Area = .scores

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
                PlaceholderScreen(title: "Your Teams", phase: 2)
            }
            Tab("Players", systemImage: "person.crop.circle", value: .players) {
                PlaceholderScreen(title: "Your Players", phase: 2)
            }
            Tab("Table", systemImage: "tablecells", value: .table) {
                PlaceholderScreen(title: "Around the League", phase: 2)
            }
            Tab("Settings", systemImage: "gearshape", value: .settings) {
                PlaceholderScreen(title: "Settings", phase: 3)
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
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
