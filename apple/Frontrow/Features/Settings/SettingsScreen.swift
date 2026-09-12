import SwiftUI

/// Settings: the account, how the app looks, and everything you follow.
/// Signing out lives here and only here — there is no other way out, which is
/// what keeps you signed in between launches.
struct SettingsScreen: View {
    @Environment(Account.self) private var account
    @State private var name = ""
    @State private var editing: FollowEditor.Tab?
    @State private var confirmingDelete = false
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 14) {
                    accountPanel
                    appearancePanel
                    leaguesPanel
                    followsPanel
                    actions
                    Color.clear.frame(height: 24)
                }
                .padding(.horizontal, 18)
                .padding(.top, 6)
            }
            .background(Theme.background)
            .navigationTitle("Settings")
            .navigationSubtitle(Text(account.isGuest ? "Guest session" : account.email))
        }
        .sheet(item: $editing) { tab in
            FollowEditor(tab: tab)
        }
        .alert("Delete your account?", isPresented: $confirmingDelete) {
            Button("Delete", role: .destructive) { delete() }
            Button("Keep it", role: .cancel) {}
        } message: {
            Text("This removes your account and everything you follow. It can't be undone.")
        }
        .onAppear { name = account.profile?.displayName ?? "" }
    }

    // ── Account ──────────────────────────────────────────────────────────

    private var accountPanel: some View {
        Panel {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 14) {
                    Text(account.profile?.avatarEmoji ?? "⚾️")
                        .font(.system(size: 27))
                        .frame(width: 58, height: 58)
                        .background(Theme.background2, in: Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text(account.isGuest ? "Guest" : (account.profile?.displayName.isEmpty == false ? account.profile!.displayName : "Your account"))
                            .font(.system(size: 19, weight: .heavy))
                            .foregroundStyle(Theme.ink)
                            .lineLimit(1)
                        Text(account.isGuest ? "Nothing saves in guest mode" : account.email)
                            .font(.system(size: 12.5))
                            .foregroundStyle(Theme.faint)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                }
                .padding(18)

                if !account.isGuest {
                    Divider().overlay(Theme.lineSoft)
                    VStack(alignment: .leading, spacing: 10) {
                        Eyebrow("Avatar")
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 7), count: 7), spacing: 7) {
                            ForEach(ProfileRow.emojis, id: \.self) { emoji in
                                Button {
                                    Task { await account.updateProfile(avatarEmoji: emoji) }
                                } label: {
                                    Text(emoji)
                                        .font(.system(size: 19))
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 42)
                                        .background(
                                            account.profile?.avatarEmoji == emoji ? Theme.accent.opacity(0.12) : Theme.background2.opacity(0.6),
                                            in: RoundedRectangle(cornerRadius: 13, style: .continuous)
                                        )
                                        .overlay {
                                            RoundedRectangle(cornerRadius: 13, style: .continuous)
                                                .stroke(account.profile?.avatarEmoji == emoji ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: 1)
                                        }
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        Eyebrow("Display name")
                        TextField("How should we greet you?", text: $name)
                            .font(.system(size: 16))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(Theme.background2.opacity(0.6), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.line, lineWidth: 1)
                            }
                            .onSubmit { save() }
                            .submitLabel(.done)
                    }
                    .padding(18)
                }
            }
        }
    }

    private func save() {
        guard name != account.profile?.displayName else { return }
        Task { await account.updateProfile(displayName: name) }
    }

    // ── Appearance ───────────────────────────────────────────────────────

    private var appearancePanel: some View {
        Panel {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Appearance")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.ink)
                    Text("Changes apply instantly, here and on the website.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.muted)
                }

                VStack(alignment: .leading, spacing: 7) {
                    Eyebrow("Theme")
                    Picker("Theme", selection: Binding(
                        get: { account.settings.appearance },
                        set: { account.update(\.appearance, to: $0) }
                    )) {
                        ForEach(Appearance.allCases) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    Text("System follows your device.")
                        .font(.system(size: 11.5))
                        .foregroundStyle(Theme.faint)
                }

                VStack(alignment: .leading, spacing: 9) {
                    Eyebrow("Accent colour")
                    HStack(spacing: 10) {
                        ForEach(AccentId.allCases) { accent in
                            Button {
                                withAnimation(.snappy(duration: 0.2)) { account.update(\.accent, to: accent) }
                            } label: {
                                Circle()
                                    .fill(accent.color)
                                    .frame(width: 34, height: 34)
                                    .overlay {
                                        Circle().stroke(Theme.ink, lineWidth: account.settings.accent == accent ? 2 : 0)
                                    }
                                    .overlay {
                                        if account.settings.accent == accent {
                                            Image(systemName: "checkmark")
                                                .font(.system(size: 13, weight: .bold))
                                                .foregroundStyle(.white)
                                        }
                                    }
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(accent.name)
                        }
                    }
                }

                Toggle(isOn: Binding(
                    get: { account.settings.reduceMotion },
                    set: { account.update(\.reduceMotion, to: $0) }
                )) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Reduce motion")
                            .font(.system(size: 13.5, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Text("Minimise animations and transitions.")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.faint)
                    }
                }
                .tint(Theme.accent)

                VStack(alignment: .leading, spacing: 7) {
                    Eyebrow("Greeting name")
                    TextField(account.profile?.displayName ?? "Your name", text: Binding(
                        get: { account.settings.greetingName },
                        set: { account.update(\.greetingName, to: $0) }
                    ))
                    .font(.system(size: 16))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(Theme.background2.opacity(0.6), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.line, lineWidth: 1)
                    }
                }
            }
            .padding(18)
        }
    }

    // ── Sports & leagues ─────────────────────────────────────────────────

    private var leaguesPanel: some View {
        Panel {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Eyebrow("What you follow at the top level")
                        Text("Sports & leagues")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Theme.ink)
                    }
                    Spacer(minLength: 8)
                    Button("Edit") { editing = .sports }
                        .font(.system(size: 12.5, weight: .semibold))
                        .buttonStyle(.glass)
                }
                .padding(.horizontal, 18)
                .padding(.top, 16)
                .padding(.bottom, 12)

                if account.preferences.leagues.isEmpty {
                    Text("Nothing followed yet.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.faint)
                        .padding(.horizontal, 18)
                        .padding(.bottom, 16)
                } else {
                    FlowingChips(labels: account.preferences.orderedLeagues.map(\.fullName))
                        .padding(.horizontal, 18)
                        .padding(.bottom, 16)
                }
            }
        }
    }

    // ── Follows ──────────────────────────────────────────────────────────

    private var followsPanel: some View {
        Panel {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Eyebrow("\(account.preferences.teams.count) followed · \(account.preferences.players.count) starred")
                        Text("Teams & players")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Theme.ink)
                    }
                    Spacer(minLength: 8)
                    Button("Edit") { editing = .teams }
                        .font(.system(size: 12.5, weight: .semibold))
                        .buttonStyle(.glass)
                }
                .padding(.horizontal, 18)
                .padding(.top, 16)
                .padding(.bottom, 12)

                ForEach(account.preferences.teams) { team in
                    row(logo: team.logo, abbr: team.abbreviation, color: team.color,
                        title: team.displayName, detail: team.league.name) {
                        withAnimation(.snappy(duration: 0.2)) { account.toggleTeam(team) }
                    }
                }
                ForEach(account.preferences.players) { player in
                    row(logo: player.headshot, abbr: player.teamAbbr, color: "#8C8C86",
                        title: player.fullName, detail: "\(player.teamAbbr) · \(player.position)", circular: true) {
                        withAnimation(.snappy(duration: 0.2)) { account.togglePlayer(player) }
                    }
                }
                if account.preferences.teams.isEmpty && account.preferences.players.isEmpty {
                    Text("Nothing followed yet.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.faint)
                        .padding(.horizontal, 18)
                        .padding(.bottom, 16)
                }
            }
        }
    }

    private func row(logo: String, abbr: String, color: String, title: String, detail: String, circular: Bool = false, remove: @escaping () -> Void) -> some View {
        HStack(spacing: 12) {
            if circular {
                Headshot(url: logo, name: title, color: color, size: 32)
            } else {
                TeamMark(logo: logo, abbreviation: abbr, color: color, size: 32)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)
                Text(detail)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.faint)
            }
            Spacer(minLength: 8)
            Button(role: .destructive, action: remove) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.faint)
                    .frame(width: 34, height: 34)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Remove \(title)")
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
        .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft.opacity(0.7)).frame(height: 1) }
    }

    // ── Sign out / delete ────────────────────────────────────────────────

    private var actions: some View {
        VStack(spacing: 10) {
            if let error {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Theme.loss)
            }
            Button {
                busy = true
                Task { await account.signOut() }
            } label: {
                Text(account.isGuest ? "Exit guest mode" : "Sign out")
                    .font(.system(size: 15, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.glass)
            .disabled(busy)

            if !account.isGuest {
                Button(role: .destructive) {
                    confirmingDelete = true
                } label: {
                    Text("Delete account")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.loss)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.glass)
                .disabled(busy)
            }

            Text("Frontrow · live scores and stats via ESPN's public endpoints. Unofficial data, refreshed as games unfold.")
                .font(.system(size: 11.5))
                .foregroundStyle(Theme.faint)
                .multilineTextAlignment(.center)
                .padding(.top, 6)
                .padding(.horizontal, 10)
        }
        .padding(.top, 4)
    }

    private func delete() {
        busy = true
        Task {
            error = await account.deleteAccount()
            busy = false
        }
    }
}

/// Changing what you follow, after setup, with the same pickers setup used.
struct FollowEditor: View {
    enum Tab: String, Identifiable, CaseIterable {
        case sports, leagues, teams, players
        var id: String { rawValue }
        var label: String { rawValue.capitalized }
    }

    @Environment(Account.self) private var account
    @Environment(\.dismiss) private var dismiss
    @State var tab: Tab

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("What to edit", selection: $tab) {
                    ForEach(tabs) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 18)
                .padding(.bottom, 10)

                switch tab {
                case .sports: SportStep()
                case .leagues: LeagueStep()
                case .teams: TeamStep()
                case .players: PlayerStep()
                }
            }
            .background(Theme.background)
            .navigationTitle("Edit follows")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .onChange(of: tabs) { _, available in
                if !available.contains(tab) { tab = .sports }
            }
        }
    }

    /// Leagues are only worth a tab when a followed sport has more than one —
    /// the same rule onboarding uses.
    private var tabs: [Tab] {
        Tab.allCases.filter { tab in
            tab != .leagues || account.sports.contains { $0.leagues.count > 1 }
        }
    }
}
