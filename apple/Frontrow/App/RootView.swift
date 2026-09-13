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
    /// Set when a widget asks for one game in particular.
    @State private var openGame: GameRequest?

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
                    TabShell(openScores: openScores, openGame: openGame)
                        .transition(.opacity)
                }
            }
            }
        }
        .environment(account)
        // No scroll bars anywhere in the app. This reaches every scroll view
        // under it, but a sheet is presented outside this tree and doesn't
        // inherit it — so each sheet root repeats the line.
        .scrollIndicators(.hidden)
        .tint(account.settings.accent.color)
        .preferredColorScheme(colorScheme)
        .animation(.snappy(duration: 0.2), value: account.status)
        .animation(.snappy(duration: 0.2), value: needsOnboarding)
        .sheet(item: $signIn) { mode in
            SignInSheet(mode: mode)
                .environment(account)
                .scrollIndicators(.hidden)
        }
        .task { await account.start() }
        .onOpenURL { url in follow(url) }
        .task {
            // A UI test can't hand the app a URL the way the home screen
            // does, so it passes one as a launch argument. Same door.
            if let url = DeepLink.testingURL { follow(url) }
        }
        .onChange(of: account.settings.accent) { _, accent in Theme.accent = accent.color }
    }

    /// A widget asks for the scoreboard or for one game. The auth callback
    /// comes through the same door and is the Supabase SDK's business, not
    /// ours, so anything we don't recognise is left alone.
    private func follow(_ url: URL) {
        switch DeepLink.destination(of: url) {
        case .scores:
            openScores = UUID()
        case .game(let id):
            openGame = GameRequest(id: id)
            openScores = UUID()
        case nil:
            break
        }
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
    let openGame: GameRequest?
    @State private var selection: Area = .scores
    @State private var sheet: AppSheet?
    /// The Scores tab's last poll, so an open sheet follows it.
    @State private var feed = LiveFeed()
    /// Games pinned to the top of a league's list.
    @State private var pins = Pins()
    /// A game a widget asked for, held until the scoreboard has loaded it.
    @State private var awaiting: String?

    enum Area: String, CaseIterable, Identifiable {
        case scores, teams, players, table, settings
        var id: String { rawValue }
    }

    var body: some View {
        TabView(selection: $selection) {
            Tab("Scores", systemImage: "sportscourt", value: .scores) {
                ScoresScreen(preferences: account.preferences, sheet: $sheet)
                    .environment(feed)
                    .environment(pins)
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
        // A widget names a game by id; the game itself arrives with the next
        // scoreboard load, which may be after the app has finished launching.
        // Hold the request until the board can answer it.
        // `initial` matters: a link that arrives during launch sets this
        // before the shell exists, so waiting for a *change* would miss the
        // only one there is.
        .onChange(of: openGame, initial: true) { _, request in
            awaiting = request?.id
            open(awaiting)
        }
        .onChange(of: feed.games) { _, _ in open(awaiting) }
        .sheet(item: $sheet) { which in
            Group {
                switch which {
                case .schedule(let team): ScheduleSheet(team: team)
                case .bracket(let team): BracketSheet(team: team)
                case .player(let player): PlayerSheet(follow: player)
                case .game(let game): GameDetailSheet(game: game).environment(feed)
                case .liveGames(let games):
                    // Picking one swaps this sheet for that game's, which is
                    // the same sheet a tap on its card opens.
                    LiveGamesSheet(games: games) { game in
                        sheet = .game(game)
                    }
                    .environment(feed)
                }
            }
            .scrollIndicators(.hidden)
        }
        .environment(pins)
    }

    /// Opens the awaited game once the board has it, and stops waiting.
    private func open(_ id: String?) {
        guard let id, let game = feed.games.first(where: { $0.id == id }) else { return }
        sheet = .game(game)
        awaiting = nil
    }
}

/// A widget's request for one game. The token makes a second tap on the same
/// game a new request rather than a no-op.
struct GameRequest: Equatable {
    let id: String
    let token = UUID()
}
