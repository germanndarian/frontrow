import SwiftUI

/// Four steps — sports, leagues, teams, players — then a Done screen. The
/// steps sit in a paged TabView, so they can be swiped as well as tapped
/// through, which is where swiping belongs now the tabs don't use it.
struct OnboardingFlow: View {
    @Environment(Account.self) private var account
    @State private var step: Step = .sports
    /// The furthest step reached, which is as far as the pager goes. It moves
    /// on Continue and never on its own: a page list that grows while a search
    /// field is focused makes UIKit assert its way out of the app, and "only
    /// where you have already been" is the behaviour we want anyway.
    @State private var unlocked: Step = .sports
    @State private var done = false

    /// The steps are a type, not positions in an array. A paged TabView drives
    /// this binding, and an index into a fixed list of titles is one stray
    /// value away from a crash; a case can only ever be one of four things.
    enum Step: Int, CaseIterable, Identifiable, Hashable {
        case sports, leagues, teams, players

        var id: Int { rawValue }
        var isLast: Bool { self == .players }
        var next: Step? { Step(rawValue: rawValue + 1) }
        var previous: Step? { Step(rawValue: rawValue - 1) }

        var title: String {
            switch self {
            case .sports: "Pick your sports"
            case .leagues: "Choose your leagues"
            case .teams: "Follow your teams"
            case .players: "Star your players"
            }
        }

        var subtitle: String {
            switch self {
            case .sports: "Choose everything you follow. You can add more later."
            case .leagues: "We pre-select the obvious ones — adjust as you like."
            case .teams: "Search and tap the teams you want on your dashboard."
            case .players: "Optional. Add the names you tune in for."
            }
        }
    }

    /// The steps this run actually has. Choosing a league only means anything
    /// when a sport offers more than one — football does, the rest don't — so
    /// for everyone else that step isn't shown at all.
    private var steps: [Step] {
        var steps: [Step] = [.sports]
        if account.sports.contains(where: { $0.leagues.count > 1 }) { steps.append(.leagues) }
        steps += [.teams, .players]
        return steps
    }

    /// How far the pager reaches: back through everything visited, forward no
    /// further than the last step Continue has opened.
    private var reachable: [Step] {
        let limit = steps.firstIndex(of: unlocked) ?? 0
        return Array(steps.prefix(limit + 1))
    }

    var body: some View {
        if done {
            OnboardingDone { account.finishOnboarding() }
        } else {
            VStack(spacing: 0) {
                header
                TabView(selection: $step) {
                    ForEach(reachable) { step in
                        page(step).tag(step)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                footer
            }
            .background(Theme.background)
            .onChange(of: steps) { _, _ in clampStep() }
            // The keyboard covers the bottom of the list; it doesn't get to
            // push the whole flow up, which left the footer stranded halfway
            // up the screen. Picking or scrolling puts the keyboard away.
            .ignoresSafeArea(.keyboard, edges: .bottom)
        }
    }

    @ViewBuilder
    private func page(_ step: Step) -> some View {
        switch step {
        case .sports: SportStep()
        case .leagues: LeagueStep()
        case .teams: TeamStep()
        case .players: PlayerStep()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                ForEach(steps) { bar in
                    Capsule()
                        .fill(bar.rawValue <= step.rawValue ? Theme.accent : Theme.line)
                        .frame(height: 4)
                }
            }
            Text(step.title)
                .font(.system(size: 26, weight: .black))
                .tracking(-0.6)
                .foregroundStyle(Theme.ink)
            Text(step.subtitle)
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
            Button(action: back) {
                HStack(spacing: 5) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 13, weight: .bold))
                    Text("Back")
                        .font(.system(size: 14, weight: .semibold))
                }
                .foregroundStyle(Theme.muted)
                .padding(.horizontal, 15)
                .frame(height: 46)
                .contentShape(Capsule())
            }
            .buttonStyle(.glass)
            .accessibilityIdentifier("Back")
            .opacity(canGoBack ? 1 : 0)
            .disabled(!canGoBack)
            Text(count)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(Theme.faint)
            Spacer(minLength: 0)
            Button(action: advance) {
                Text(nextStep == nil ? "Finish" : "Continue")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 26)
                    .padding(.vertical, 14)
                    .background(Theme.accent.opacity(canAdvance ? 1 : 0.4), in: Capsule())
                    .contentShape(Capsule())
            }
            .buttonStyle(PressableButtonStyle())
            .disabled(!canAdvance)
        }
        .padding(.horizontal, 18)
        .padding(.top, 10)
        .padding(.bottom, 6)
        .background(.bar)
    }

    private var count: String {
        switch step {
        case .sports: "\(account.sports.count) selected"
        case .leagues: "\(account.preferences.leagues.count) selected"
        case .teams: "\(account.preferences.teams.count) followed"
        case .players: "\(account.preferences.players.count) starred"
        }
    }

    private var canAdvance: Bool {
        switch step {
        case .sports: !account.sports.isEmpty
        case .leagues: !account.preferences.leagues.isEmpty
        case .teams: !account.preferences.teams.isEmpty
        case .players: true
        }
    }

    /// Back walks the steps down; from the first one it leaves the flow
    /// altogether, which a guest needs — they arrived here from the front door
    /// and would otherwise be stuck in it.
    private var canGoBack: Bool {
        previousStep != nil || account.isGuest
    }

    private var previousStep: Step? {
        guard let index = steps.firstIndex(of: step), index > 0 else { return nil }
        return steps[index - 1]
    }

    private var nextStep: Step? {
        guard let index = steps.firstIndex(of: step), index + 1 < steps.count else { return nil }
        return steps[index + 1]
    }

    private func back() {
        dismissKeyboard()
        guard let previous = previousStep else {
            account.leaveOnboarding()
            return
        }
        withAnimation(.snappy(duration: 0.25)) { step = previous }
    }

    private func advance() {
        dismissKeyboard()
        guard let next = nextStep else {
            withAnimation(.snappy(duration: 0.2)) { done = true }
            return
        }
        // Open the page first, then move to it: inserting a page and selecting
        // it in one animation is what UIKit's pager dislikes.
        if (steps.firstIndex(of: next) ?? 0) > (steps.firstIndex(of: unlocked) ?? 0) {
            unlocked = next
        }
        withAnimation(.snappy(duration: 0.25)) { step = next }
    }

    /// Deselecting a sport can take the leagues step away underneath the
    /// pager — land somewhere that still exists.
    private func clampStep() {
        if !steps.contains(unlocked) { unlocked = steps.last ?? .sports }
        if !steps.contains(step) { step = steps.last ?? .sports }
        // Dropping a sport can leave the flow further along than it has any
        // right to be — walk it back to the last step still answered.
        if let stepIndex = steps.firstIndex(of: step),
           let limit = steps.firstIndex(of: unlocked),
           stepIndex > limit {
            step = unlocked
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
