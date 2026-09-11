import SwiftUI

/// Four steps — sports, leagues, teams, players — then a Done screen. The
/// steps sit in a paged TabView, so they can be swiped as well as tapped
/// through, which is where swiping belongs now the tabs don't use it.
struct OnboardingFlow: View {
    @Environment(Account.self) private var account
    @State private var step = 0
    @State private var done = false

    private static let titles = [
        ("Pick your sports", "Choose everything you follow. You can add more later."),
        ("Choose your leagues", "We pre-select the obvious ones — adjust as you like."),
        ("Follow your teams", "Search and tap the teams you want on your dashboard."),
        ("Star your players", "Optional. Add the names you tune in for."),
    ]

    var body: some View {
        if done {
            OnboardingDone { account.finishOnboarding() }
        } else {
            VStack(spacing: 0) {
                header
                TabView(selection: $step) {
                    SportStep().tag(0)
                    LeagueStep().tag(1)
                    TeamStep().tag(2)
                    PlayerStep().tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                footer
            }
            .background(Theme.background)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                ForEach(0..<4, id: \.self) { index in
                    Capsule()
                        .fill(index <= step ? Theme.accent : Theme.line)
                        .frame(height: 4)
                }
            }
            Text(Self.titles[step].0)
                .font(.system(size: 26, weight: .black))
                .tracking(-0.6)
                .foregroundStyle(Theme.ink)
            Text(Self.titles[step].1)
                .font(.system(size: 13.5))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 18)
        .padding(.top, 12)
        .padding(.bottom, 14)
    }

    private var footer: some View {
        HStack(spacing: 12) {
            if step > 0 {
                Button {
                    withAnimation(.snappy(duration: 0.25)) { step -= 1 }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .semibold))
                        .frame(width: 46, height: 46)
                }
                .buttonStyle(.glass)
            }
            Text(count)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(Theme.faint)
            Spacer(minLength: 0)
            Button(action: advance) {
                Text(step == 3 ? "Finish" : "Continue")
                    .font(.system(size: 15, weight: .bold))
                    .padding(.horizontal, 26)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .background(Theme.accent.opacity(canAdvance ? 1 : 0.4), in: Capsule())
            .disabled(!canAdvance)
        }
        .padding(.horizontal, 18)
        .padding(.top, 10)
        .padding(.bottom, 6)
        .background(.bar)
    }

    private var count: String {
        switch step {
        case 0: "\(account.sports.count) selected"
        case 1: "\(account.preferences.leagues.count) selected"
        case 2: "\(account.preferences.teams.count) followed"
        default: "\(account.preferences.players.count) starred"
        }
    }

    private var canAdvance: Bool {
        switch step {
        case 0: !account.sports.isEmpty
        case 1: !account.preferences.leagues.isEmpty
        case 2: !account.preferences.teams.isEmpty
        default: true
        }
    }

    private func advance() {
        if step == 3 {
            withAnimation(.snappy) { done = true }
        } else {
            withAnimation(.snappy(duration: 0.25)) { step += 1 }
        }
    }
}

/// A tappable row: mark, name, a line under it, and a check.
struct PickRow<Mark: View>: View {
    let name: String
    let detail: String
    let active: Bool
    @ViewBuilder var mark: Mark
    let toggle: () -> Void

    var body: some View {
        Button(action: toggle) {
            HStack(spacing: 14) {
                mark
                VStack(alignment: .leading, spacing: 2) {
                    Text(name)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                    Text(detail)
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.faint)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                Image(systemName: active ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 21))
                    .foregroundStyle(active ? Theme.accent : Theme.line)
                    .contentTransition(.symbolEffect(.replace))
            }
            .padding(15)
            .background(active ? Theme.accent.opacity(0.08) : Theme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(active ? Theme.accent.opacity(0.55) : Theme.line, lineWidth: 1)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(active ? [.isButton, .isSelected] : .isButton)
    }
}

struct SportStep: View {
    @Environment(Account.self) private var account

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                ForEach(Sport.allCases) { sport in
                    PickRow(
                        name: sport.name,
                        detail: sport.leagues.map(\.name).joined(separator: " · "),
                        active: account.sports.contains(sport)
                    ) {
                        Image(systemName: sport.symbol)
                            .font(.system(size: 19, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .background(Theme.accent.opacity(0.85), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    } toggle: {
                        var next = account.sports
                        if let index = next.firstIndex(of: sport) { next.remove(at: index) } else { next.append(sport) }
                        withAnimation(.snappy(duration: 0.18)) { account.setSports(next) }
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 20)
        }
    }
}

struct LeagueStep: View {
    @Environment(Account.self) private var account

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                ForEach(offered) { league in
                    PickRow(
                        name: league.fullName,
                        detail: league.name,
                        active: account.preferences.leagues.contains(league)
                    ) {
                        Text(league.name)
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .background(Theme.accent.opacity(0.85), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    } toggle: {
                        withAnimation(.snappy(duration: 0.18)) { account.toggleLeague(league) }
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 20)
        }
    }

    private var offered: [League] {
        let allowed = Set(account.sports.flatMap(\.leagues))
        return League.displayOrder.filter { allowed.contains($0) }
    }
}
