import SwiftUI

/// The Done screen: what you picked, drawn back to you before the app opens.
struct OnboardingDone: View {
    @Environment(Account.self) private var account
    let onContinue: () -> Void
    @State private var checked = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 20)

            ZStack {
                Circle()
                    .fill(Theme.accent.opacity(0.12))
                    .frame(width: 108, height: 108)
                    .scaleEffect(checked ? 1 : 0.6)
                Image(systemName: "checkmark")
                    .font(.system(size: 44, weight: .bold))
                    .foregroundStyle(Theme.accent)
                    .scaleEffect(checked ? 1 : 0.3)
                    .opacity(checked ? 1 : 0)
            }
            .onAppear {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) { checked = true }
            }

            Text("You're all set")
                .font(.system(size: 30, weight: .black))
                .tracking(-0.8)
                .foregroundStyle(Theme.ink)
                .padding(.top, 26)

            Text(summary)
                .font(.system(size: 14.5))
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
                .padding(.top, 8)
                .padding(.horizontal, 34)

            if !account.preferences.teams.isEmpty {
                HStack(spacing: -10) {
                    ForEach(account.preferences.teams.prefix(6)) { team in
                        TeamMark(logo: team.logo, abbreviation: team.abbreviation, color: team.color, size: 46)
                            .overlay {
                                RoundedRectangle(cornerRadius: 13, style: .continuous)
                                    .stroke(Theme.background, lineWidth: 3)
                            }
                    }
                }
                .padding(.top, 28)
            }

            Spacer(minLength: 20)

            Button(action: onContinue) {
                Text("Open Frontrow")
                    .font(.system(size: 15, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .background(Theme.accent, in: Capsule())
            .padding(.horizontal, 24)
            .padding(.bottom, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background)
    }

    private var summary: String {
        let teams = account.preferences.teams.count
        let players = account.preferences.players.count
        let leagues = account.preferences.leagues.count
        var parts = ["\(teams) team\(teams == 1 ? "" : "s")"]
        if players > 0 { parts.append("\(players) player\(players == 1 ? "" : "s")") }
        parts.append("across \(leagues) league\(leagues == 1 ? "" : "s")")
        return parts.joined(separator: ", ") + ". Scores, stats and standings — only for these."
    }
}
