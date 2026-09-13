import SwiftUI

/// The gate: restore the session, then show the front door, onboarding, or
/// the app. A returning user goes straight to the tabs — the session lives in
/// the keychain, so signing in once is enough.
struct RootView: View {
    @State private var account = Account()
    @State private var signIn: SignInSheet.Mode?
    @State private var googleError: String?
    /// Changes when a widget asks for the scoreboard, so the shell can switch.
    @State private var openScores = UUID()

    var body: some View {
        Group {
            if ProcessInfo.processInfo.arguments.contains("-widget-gallery") {
                WidgetGallery(entry: .placeholder())
            } else {
            switch account.status {
            case .loading:
                LaunchScreen()
            case .signedOut:
                WelcomeScreen(
                    onSignUp: { signIn = .signUp },
                    onSignIn: { signIn = .signIn },
                    onGoogle: { Task { googleError = await account.signInWithGoogle() } },
                    onGuest: { account.continueAsGuest() }
                )
                .alert("Couldn't sign in with Google", isPresented: showingGoogleError) {
                    Button("OK") { googleError = nil }
                } message: {
                    Text(googleError ?? "")
                }
            case .authed, .guest:
                if needsOnboarding {
                    OnboardingFlow()
                        .transition(.opacity)
                } else {
                    TabShell(openScores: openScores)
                        .transition(.opacity)
                }
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
        .onOpenURL { url in
            // frontrow://scores comes from a widget; the auth callback is the
            // Supabase SDK's business and needs nothing from us here.
            if url.host == "scores" { openScores = UUID() }
        }
        .onChange(of: account.settings.accent) { _, accent in Theme.accent = accent.color }
    }

    private var showingGoogleError: Binding<Bool> {
        Binding(get: { googleError != nil }, set: { if !$0 { googleError = nil } })
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
    let openScores: UUID
    @State private var selection: Area = .scores
    @State private var sheet: AppSheet?
    /// The Scores tab's last poll, so an open sheet follows it.
    @State private var feed = LiveFeed()

    enum Area: String, CaseIterable, Identifiable {
        case scores, teams, players, table, settings
        var id: String { rawValue }
    }

    var body: some View {
        TabView(selection: $selection) {
            Tab("Scores", systemImage: "sportscourt", value: .scores) {
                ScoresScreen(preferences: account.preferences, sheet: $sheet)
                    .environment(feed)
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
        .onChange(of: openScores) { _, _ in
            withAnimation(.snappy(duration: 0.2)) { selection = .scores }
        }
        .sheet(item: $sheet) { which in
            switch which {
            case .schedule(let team): ScheduleSheet(team: team)
            case .bracket(let team): BracketSheet(team: team)
            case .player(let player): PlayerSheet(follow: player)
            case .game(let game): GameDetailSheet(game: game).environment(feed)
            case .liveGames(let games):
                // Picking one swaps this sheet for that game's, which is the
                // same sheet a tap on its card opens.
                LiveGamesSheet(games: games) { game in
                    sheet = .game(game)
                }
                .environment(feed)
            }
        }
    }
}
