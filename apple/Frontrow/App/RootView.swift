import SwiftUI

/// The gate: restore the session, then show the front door, onboarding, or
/// the app. A returning user goes straight to the tabs — the session lives in
/// the keychain, so signing in once is enough.
struct RootView: View {
    @State private var account = Account()
    @State private var signIn: SignInSheet.Mode?

    var body: some View {
        Group {
            switch account.status {
            case .loading:
                LaunchScreen()
            case .signedOut:
                WelcomeScreen(
                    onSignUp: { signIn = .signUp },
                    onSignIn: { signIn = .signIn },
                    onGuest: { account.continueAsGuest() }
                )
            case .authed, .guest:
                if needsOnboarding {
                    OnboardingFlow()
                        .transition(.opacity)
                } else {
                    TabShell()
                        .transition(.opacity)
                }
            }
        }
        .environment(account)
        .tint(account.settings.accent.color)
        .preferredColorScheme(colorScheme)
        .animation(.snappy(duration: 0.2), value: account.status)
        .animation(.snappy(duration: 0.2), value: needsOnboarding)
        .sheet(item: $signIn) { mode in
            SignInSheet(mode: mode).environment(account)
        }
        .task { await account.start() }
        .onChange(of: account.settings.accent) { _, accent in Theme.accent = accent.color }
    }

    /// A guest has no saved follows, so the flow is where they pick some.
    private var needsOnboarding: Bool {
        !account.onboarded || account.preferences.teams.isEmpty
    }

    private var colorScheme: ColorScheme? {
        switch account.settings.appearance {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

extension SignInSheet.Mode: Identifiable {
    public var id: Int { self == .signIn ? 0 : 1 }
}

/// Shown for the moment it takes to read the keychain.
struct LaunchScreen: View {
    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 14) {
                Image(systemName: "sportscourt.fill")
                    .font(.system(size: 34, weight: .bold))
                    .foregroundStyle(Theme.accent)
                ProgressView().tint(Theme.faint)
            }
        }
    }
}

/// The five tabs. The tab bar is native Liquid Glass on iOS 26 and, like
/// Apple Music, shrinks to its icons when you scroll down and comes back
/// when you scroll up or tap it.
struct TabShell: View {
    @Environment(Account.self) private var account
    @State private var selection: Area = .scores
    @State private var sheet: AppSheet?

    enum Area: String, CaseIterable, Identifiable {
        case scores, teams, players, table, settings
        var id: String { rawValue }
    }

    var body: some View {
        TabView(selection: $selection) {
            Tab("Scores", systemImage: "sportscourt", value: .scores) {
                ScoresScreen(preferences: account.preferences)
            }
            Tab("Teams", systemImage: "shield.checkered", value: .teams) {
                TeamsScreen(preferences: account.preferences, sheet: $sheet)
            }
            Tab("Players", systemImage: "person.crop.circle", value: .players) {
                PlayersScreen(preferences: account.preferences, sheet: $sheet)
            }
            Tab("Table", systemImage: "tablecells", value: .table) {
                TableScreen(preferences: account.preferences)
            }
            Tab("Settings", systemImage: "gearshape", value: .settings) {
                SettingsScreen()
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
