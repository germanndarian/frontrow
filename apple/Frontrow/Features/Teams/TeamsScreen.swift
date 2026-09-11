import SwiftUI

/// Your Teams: a card per followed team, and a season panel underneath for
/// whichever one you tap.
struct TeamsScreen: View {
    @State private var model = TeamsModel()
    @Binding var sheet: AppSheet?

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    if model.teams.isEmpty {
                        ContentUnavailableView(
                            "No teams yet",
                            systemImage: "shield.checkered",
                            description: Text("Add the teams you follow in Settings and they'll show up here.")
                        )
                        .padding(.top, 60)
                    } else {
                        Text("Tap a team to feature it in Season Stats below.")
                            .font(.system(size: 12.5))
                            .foregroundStyle(Theme.faint)
                            .padding(.horizontal, 18)
                            .padding(.bottom, 14)

                        VStack(spacing: 14) {
                            ForEach(model.teams) { team in
                                TeamCardView(
                                    follow: team,
                                    state: model.cards[team],
                                    selected: team.id == model.spotlight?.id,
                                    onSelect: { select(team) },
                                    onSheet: { sheet = $0 },
                                    onRetry: { Task { await model.cards.fetch(team, force: true) } }
                                )
                            }
                        }
                        .padding(.horizontal, 18)

                        if let spot = model.spotlight {
                            SectionRule(title: "SEASON STATS", detail: spot.abbreviation, accent: Color(cssHex: spot.color))
                                .padding(.horizontal, 18)
                                .padding(.top, 30)
                                .padding(.bottom, 12)
                            SeasonPanel(follow: spot, state: model.cards[spot])
                                .padding(.horizontal, 18)
                        }
                    }
                    Color.clear.frame(height: 24)
                }
                .padding(.top, 6)
            }
            .background(Theme.background)
            .refreshable { await model.load(force: true) }
            .navigationTitle("Your Teams")
            .navigationSubtitle(Text("\(model.teams.count) followed"))
        }
        .task { await model.load() }
    }

    private func select(_ team: FollowedTeam) {
        withAnimation(.snappy(duration: 0.22)) { model.selectedID = team.id }
    }
}
