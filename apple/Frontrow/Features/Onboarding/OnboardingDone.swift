import SwiftUI

/// The Done screen: what you picked, drawn back to you before the app opens.
struct OnboardingDone: View {
    @Environment(Account.self) private var account
    let onContinue: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 20)

            DrawnCheck(size: 108)

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
            .buttonStyle(PressableButtonStyle())
            .foregroundStyle(.white)
            .background(Theme.accent, in: Capsule())
            .padding(.horizontal, 24)
            .padding(.bottom, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background)
        .task {
            // Fetch the first screen's games while this one is being read.
            Prefetch.warm(
                leagues: account.preferences.orderedLeagues.map(\.rawValue).joined(separator: ","),
                dates: (WeekWindow.make(offset: 0) ?? WeekWindow.all()[0]).query
            )
        }
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

/// A check that draws itself: the ring sweeps round, then the tick is stroked
/// on, the way a native "done" confirmation builds up rather than popping in.
struct DrawnCheck: View {
    var size: CGFloat = 108

    @State private var ring: CGFloat = 0
    @State private var tick: CGFloat = 0
    @State private var settle = false

    var body: some View {
        ZStack {
            Circle()
                .fill(Theme.accent.opacity(0.12))
                .frame(width: size, height: size)
                .scaleEffect(settle ? 1 : 0.82)

            Circle()
                .trim(from: 0, to: ring)
                .stroke(Theme.accent.opacity(0.55), style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .frame(width: size, height: size)

            Tick()
                .trim(from: 0, to: tick)
                .stroke(Theme.accent, style: StrokeStyle(lineWidth: size * 0.09, lineCap: .round, lineJoin: .round))
                .frame(width: size * 0.46, height: size * 0.36)
        }
        .onAppear(perform: draw)
        .accessibilityLabel("Setup complete")
    }

    private func draw() {
        withAnimation(.easeOut(duration: 0.45)) { ring = 1 }
        withAnimation(.easeOut(duration: 0.38).delay(0.22)) { tick = 1 }
        withAnimation(.spring(response: 0.4, dampingFraction: 0.55).delay(0.24)) { settle = true }
    }
}

/// The two strokes of a tick, drawn left to right so `trim` builds it up.
private struct Tick: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.minX + rect.width * 0.38, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        return path
    }
}
