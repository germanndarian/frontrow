import Foundation
import Observation
import Supabase
import WidgetKit

/// The signed-in account: session, profile, who you follow and how the app
/// looks. Supabase keeps the session in the keychain, so signing in once is
/// enough — the app comes back signed in until you sign out.
///
/// Row-Level Security scopes every query to the current user, so no user id is
/// ever trusted from here; the JWT decides what a query can see.
@MainActor
@Observable
final class Account {
    enum Status: Equatable {
        /// Restoring a session from the keychain.
        case loading
        /// Signed in, with follows and settings loaded.
        case authed
        /// Looking around without an account — nothing is saved.
        case guest
        case signedOut
    }

    private(set) var status: Status = .loading
    private(set) var email: String = ""
    private(set) var profile: ProfileRow?
    private(set) var preferences = Preferences.empty
    private(set) var settings = SettingsRow.defaults(userId: "")
    private(set) var sports: [Sport] = []
    private(set) var onboarded = false

    private let client: SupabaseClient
    private var userId: String?
    private var pushTask: Task<Void, Never>?
    private var watchTask: Task<Void, Never>?

    init(client: SupabaseClient = Account.makeClient()) {
        self.client = client
    }

    /// `emitLocalSessionAsInitialSession` hands us the stored session straight
    /// away instead of holding it back behind a token refresh. The old
    /// behaviour meant a cold start on a slow network sat on the launch screen
    /// waiting for the network before it would admit it had a session at all —
    /// and the SDK warns that it is going away in the next major version.
    /// An expired session still arrives; the SDK refreshes it underneath us.
    static func makeClient() -> SupabaseClient {
        SupabaseClient(
            supabaseURL: SupabaseConfig.url,
            supabaseKey: SupabaseConfig.anonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    storage: AuthClient.Configuration.defaultLocalStorage,
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }

    /// Whether the app should show the tabs rather than the front door.
    var isInside: Bool { status == .authed || status == .guest }
    var isGuest: Bool { status == .guest }

    var greeting: String {
        if !settings.greetingName.isEmpty { return settings.greetingName }
        if let name = profile?.displayName, !name.isEmpty { return name }
        return isGuest ? "Guest" : ""
    }

    // ── Session ──────────────────────────────────────────────────────────

    /// Restores a stored session, then follows auth changes for the app's life.
    func start() async {
        guard watchTask == nil else { return }
        // UI tests need a predictable starting point, not whatever session the
        // simulator's keychain happens to be holding: -ui-testing-reset opens
        // the front door, -ui-testing-sample opens the app on the sample
        // lineup so a test can go straight to the screen it cares about.
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("-ui-testing-reset") || arguments.contains("-ui-testing-sample") {
            try? await client.auth.signOut()
        }
        if arguments.contains("-ui-testing-sample") {
            continueAsGuest()
            useSampleLineup()
            onboarded = true
            return
        }
        watchTask = Task { [weak self] in
            guard let self else { return }
            for await (event, session) in self.client.auth.authStateChanges {
                await self.handle(event: event, session: session)
            }
        }

        // Belt and braces: the SDK emits an initial session immediately now,
        // but a launch screen that waits forever is the worst possible way to
        // find out otherwise.
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(5))
            guard let self, self.status == .loading else { return }
            self.status = .signedOut
        }
    }

    private func handle(event: AuthChangeEvent, session: Session?) async {
        guard let user = session?.user else {
            if event == .signedOut { reset() }
            if status != .guest { status = .signedOut }
            return
        }
        email = user.email ?? ""
        let id = user.id.uuidString.lowercased()
        // A token refresh is the same user and normally needs no re-read — but
        // if the session that opened the app was expired, those reads came back
        // empty, and the refreshed token is the moment to try them again.
        let isNewUser = userId != id
        userId = id
        guard isNewUser || status != .authed || preferences.teams.isEmpty else { return }
        await hydrate()
    }

    /// Reads the profile, follows and settings, then opens the app.
    private func hydrate() async {
        guard let userId else { return }
        async let profileRow: ProfileRow? = first(from: "profiles", column: "id")
        async let prefsRow: PreferencesRow? = first(from: "preferences", column: "user_id")
        async let settingsRow: SettingsRow? = first(from: "settings", column: "user_id")

        profile = await profileRow
        if let row = await prefsRow {
            preferences = Preferences(leagues: row.leagues, teams: row.teams, players: row.players)
            sports = row.sports
            onboarded = row.onboarded
        } else {
            preferences = .empty
            sports = []
            onboarded = false
        }
        settings = await settingsRow ?? .defaults(userId: userId)
        status = .authed
        publishToWidgets()
    }

    /// The user's own row from a table, or nil when the seed trigger hasn't
    /// written one yet.
    private func first<Row: Decodable & Sendable>(from table: String, column: String) async -> Row? {
        guard let userId else { return nil }
        let rows: [Row]? = try? await client.from(table)
            .select()
            .eq(column, value: userId)
            .limit(1)
            .execute()
            .value
        return rows?.first
    }

    // ── Sign in / up / out ───────────────────────────────────────────────

    func signIn(email: String, password: String) async -> String? {
        do {
            _ = try await client.auth.signIn(email: email.trimmed, password: password)
            return nil
        } catch {
            return message(error)
        }
    }

    /// Returns nil on success, or a message. With email confirmation switched
    /// on there is no session yet, which the caller reports as "check your
    /// inbox" rather than an error.
    func signUp(email: String, password: String, displayName: String) async -> (error: String?, needsConfirmation: Bool) {
        do {
            let response = try await client.auth.signUp(
                email: email.trimmed,
                password: password,
                data: displayName.trimmed.isEmpty ? nil : ["display_name": .string(displayName.trimmed)]
            )
            return (nil, response.session == nil)
        } catch {
            return (message(error), false)
        }
    }

    /// Google, through ASWebAuthenticationSession: a real Safari view, which
    /// is the only kind of browser Google will complete a sign-in in. The
    /// callback comes back to the app's own URL scheme.
    func signInWithGoogle() async -> String? {
        do {
            _ = try await client.auth.signInWithOAuth(
                provider: .google,
                redirectTo: URL(string: "frontrow://auth-callback")
            ) { session in
                session.prefersEphemeralWebBrowserSession = false
            }
            return nil
        } catch {
            // Closing the sheet is a decision, not a failure to report.
            if error is AuthError, "\(error)".contains("canceled") { return nil }
            return message(error)
        }
    }

    func signOut() async {
        try? await client.auth.signOut()
        reset()
        status = .signedOut
    }

    /// Leaving the setup flow: a guest goes back to the front door, and a
    /// signed-in account stays signed in — there is nothing before onboarding
    /// for them to go back to.
    func leaveOnboarding() {
        guard status == .guest else { return }
        reset()
        status = .signedOut
    }

    func continueAsGuest() {
        preferences = Preferences(leagues: [], teams: [], players: [])
        sports = []
        onboarded = false
        status = .guest
    }

    private func reset() {
        userId = nil
        profile = nil
        email = ""
        preferences = .empty
        sports = []
        onboarded = false
        settings = .defaults(userId: "")
    }

    private func message(_ error: Error) -> String {
        if let authError = error as? AuthError { return authError.message }
        return error.localizedDescription
    }

    // ── Edits ────────────────────────────────────────────────────────────

    func setSports(_ next: [Sport]) {
        sports = next
        // Drop leagues whose sport is gone, and offer the new sports' leagues.
        let allowed = Set(next.flatMap(\.leagues))
        var leagues = preferences.leagues.filter { allowed.contains($0) }
        for league in League.displayOrder where allowed.contains(league) && !leagues.contains(league) {
            leagues.append(league)
        }
        preferences.leagues = leagues
        schedulePush()
    }

    func toggleLeague(_ league: League) {
        if let index = preferences.leagues.firstIndex(of: league) {
            preferences.leagues.remove(at: index)
        } else {
            preferences.leagues.append(league)
        }
        schedulePush()
    }

    func toggleTeam(_ team: FollowedTeam) {
        if let index = preferences.teams.firstIndex(where: { $0.id == team.id }) {
            preferences.teams.remove(at: index)
        } else {
            preferences.teams.append(team)
        }
        schedulePush()
    }

    func togglePlayer(_ player: FollowedPlayer) {
        if let index = preferences.players.firstIndex(where: { $0.id == player.id }) {
            preferences.players.remove(at: index)
        } else {
            preferences.players.append(player)
        }
        schedulePush()
    }

    func useSampleLineup() {
        sports = [.baseball, .hockey, .football]
        preferences = Preferences(
            leagues: [.mlb, .nhl, .nfl, .collegeFootball],
            teams: DefaultLineup.teams,
            players: DefaultLineup.players
        )
        schedulePush()
    }

    func finishOnboarding() {
        onboarded = true
        schedulePush()
    }

    func update<Value>(_ keyPath: WritableKeyPath<SettingsRow, Value>, to value: Value) {
        settings[keyPath: keyPath] = value
        schedulePush()
    }

    func updateProfile(displayName: String? = nil, avatarEmoji: String? = nil) async {
        guard var profile, let userId else { return }
        if let displayName { profile.displayName = displayName }
        if let avatarEmoji { profile.avatarEmoji = avatarEmoji }
        self.profile = profile
        var row = profile
        row.id = userId
        _ = try? await client.from("profiles").upsert(row, onConflict: "id").execute()
    }

    /// Deletes the account through the site's admin route — dropping an auth
    /// user needs the service-role key, which only the server has.
    func deleteAccount() async -> String? {
        guard let token = try? await client.auth.session.accessToken else {
            return "You're not signed in."
        }
        do {
            var request = URLRequest(url: APIClient.shared.baseURL.appending(path: "account"))
            request.httpMethod = "DELETE"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else {
                let body = try? JSONDecoder().decode([String: String].self, from: data)
                return body?["error"] ?? "Couldn't delete the account."
            }
            await signOut()
            return nil
        } catch {
            return error.localizedDescription
        }
    }

    // ── Write-through ────────────────────────────────────────────────────

    /// Mirrors the local state back to Postgres, coalescing a burst of taps
    /// into one write. Guests have nowhere to save to.
    private func schedulePush() {
        // The widgets follow the local state, signed in or not.
        publishToWidgets()
        guard status == .authed, userId != nil else { return }
        pushTask?.cancel()
        pushTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(400))
            guard !Task.isCancelled else { return }
            await self?.push()
        }
    }

    /// Widgets run in their own process with no keychain session, so the app
    /// leaves them what they need to draw and tells WidgetKit to redraw.
    private func publishToWidgets() {
        SharedStore.write(
            SharedStore.Snapshot(
                leagues: preferences.orderedLeagues,
                teams: preferences.teams,
                accent: settings.accent,
                updatedAt: .now
            )
        )
        WidgetCenter.shared.reloadAllTimelines()
    }

    private func push() async {
        guard let userId else { return }
        let prefs = PreferencesRow(
            userId: userId,
            sports: sports,
            leagues: preferences.leagues,
            teams: preferences.teams,
            players: preferences.players,
            onboarded: onboarded
        )
        var settingsRow = settings
        settingsRow.userId = userId
        _ = try? await client.from("preferences").upsert(prefs, onConflict: "user_id").execute()
        _ = try? await client.from("settings").upsert(settingsRow, onConflict: "user_id").execute()
    }
}

extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}
