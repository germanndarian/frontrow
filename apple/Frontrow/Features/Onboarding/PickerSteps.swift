import SwiftUI

/// Every team in the followed leagues, searchable — straight from
/// `/api/teams`, so it is whatever ESPN currently lists.
struct TeamStep: View {
    @Environment(Account.self) private var account
    @State private var state: Loadable<[CatalogTeam]> = .loading
    @State private var search = ""
    @FocusState private var searching: Bool

    var body: some View {
        VStack(spacing: 0) {
            SearchField(text: $search, placeholder: "Search teams", focused: $searching)
                .padding(.horizontal, 18)
                .padding(.bottom, 10)
            ScrollView {
                LazyVStack(spacing: 10) {
                    switch state {
                    case .loading:
                        ForEach(0..<6, id: \.self) { _ in SkeletonBlock(height: 74, radius: 18) }
                    case .failed(let message):
                        FailedState(title: "Couldn't load teams", message: message, retry: { Task { await load() } })
                            .padding(.top, 30)
                    case .loaded(let teams):
                        let sections = sections(filtered(teams))
                        if sections.isEmpty {
                            ContentUnavailableView.search(text: search).padding(.top, 30)
                        } else {
                            ForEach(sections) { section in
                                SectionRule(title: section.league.name, detail: "\(section.teams.count)")
                                    .padding(.top, section.league == sections.first?.league ? 0 : 10)
                                    .padding(.bottom, 2)
                                ForEach(section.teams) { team in
                                    let follow = team.follow
                                    PickRow(
                                        name: team.displayName,
                                        detail: followedDetail(team),
                                        active: account.preferences.teams.contains { $0.id == follow.id }
                                    ) {
                                        TeamMark(logo: team.logo, abbreviation: team.abbreviation, color: team.color, size: 44)
                                    } toggle: {
                                        // A pick is the end of a search: give
                                        // the list back the screen.
                                        searching = false
                                        withAnimation(.snappy(duration: 0.18)) { account.toggleTeam(follow) }
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 20)
            }
            .scrollDismissesKeyboard(.immediately)
        }
        .task(id: account.preferences.leagues) { await load() }
    }

    /// One block per league, in the league order the rest of the app uses, so
    /// a long list of teams reads as "MLB, then NHL, then NFL".
    private func sections(_ teams: [CatalogTeam]) -> [LeagueSection] {
        League.displayOrder.compactMap { league in
            let inLeague = teams.filter { $0.league == league }
            return inLeague.isEmpty ? nil : LeagueSection(league: league, teams: inLeague)
        }
    }

    /// The league is the section header now, so the row shows the short code
    /// instead of repeating it.
    private func followedDetail(_ team: CatalogTeam) -> String {
        team.abbreviation
    }

    private func filtered(_ teams: [CatalogTeam]) -> [CatalogTeam] {
        let query = search.trimmed.lowercased()
        guard !query.isEmpty else { return teams }
        return teams.filter {
            $0.displayName.lowercased().contains(query) || $0.abbreviation.lowercased().contains(query)
        }
    }

    private func load() async {
        let leagues = account.preferences.orderedLeagues
        guard !leagues.isEmpty else {
            state = .loaded([])
            return
        }
        state = .loading
        do {
            let teams: [CatalogTeam] = try await APIClient.shared.get(
                "teams", query: ["leagues": leagues.map(\.rawValue).joined(separator: ",")]
            )
            state = .loaded(teams.sorted { $0.displayName < $1.displayName })
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

/// The rosters of the teams you just followed, so the names on offer are the
/// ones you'd actually star.
struct PlayerStep: View {
    @Environment(Account.self) private var account
    @State private var rosters: [String: Loadable<[RosterPlayer]>] = [:]
    @State private var search = ""
    @FocusState private var searching: Bool

    var body: some View {
        VStack(spacing: 0) {
            SearchField(text: $search, placeholder: "Search your teams' rosters", focused: $searching)
                .padding(.horizontal, 18)
                .padding(.bottom, 10)
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 10) {
                    if account.preferences.teams.isEmpty {
                        ContentUnavailableView(
                            "No teams yet",
                            systemImage: "person.crop.circle",
                            description: Text("Go back a step and follow a team first.")
                        )
                        .padding(.top, 30)
                    } else {
                        ForEach(account.preferences.teams) { team in
                            SectionRule(title: team.displayName.uppercased(), detail: team.abbreviation, accent: Color(cssHex: team.color))
                                .padding(.top, 6)
                            switch rosters[team.id] ?? .loading {
                            case .loading:
                                ForEach(0..<3, id: \.self) { _ in SkeletonBlock(height: 74, radius: 18) }
                            case .failed(let message):
                                Text(message)
                                    .font(.footnote)
                                    .foregroundStyle(Theme.faint)
                            case .loaded(let players):
                                let shown = filtered(players)
                                if shown.isEmpty {
                                    Text(search.isEmpty ? "No roster listed yet." : "No match on this roster.")
                                        .font(.system(size: 12.5))
                                        .foregroundStyle(Theme.faint)
                                } else {
                                    ForEach(shown) { player in
                                        let follow = player.follow
                                        PickRow(
                                            name: player.fullName,
                                            detail: "\(player.teamAbbr) · \(player.position)",
                                            active: account.preferences.players.contains { $0.id == follow.id }
                                        ) {
                                            Headshot(url: player.headshot, name: player.fullName, color: team.color, size: 44)
                                        } toggle: {
                                            searching = false
                                            withAnimation(.snappy(duration: 0.18)) { account.togglePlayer(follow) }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 20)
            }
            .scrollDismissesKeyboard(.immediately)
        }
        .task(id: account.preferences.teams) { await load() }
    }

    private func filtered(_ players: [RosterPlayer]) -> [RosterPlayer] {
        let query = search.trimmed.lowercased()
        guard !query.isEmpty else { return players }
        return players.filter { $0.fullName.lowercased().contains(query) }
    }

    private func load() async {
        for team in account.preferences.teams where rosters[team.id]?.value == nil {
            do {
                let players: [RosterPlayer] = try await APIClient.shared.get(
                    "roster", query: ["league": team.league.rawValue, "teamId": team.teamId]
                )
                rosters[team.id] = .loaded(players)
            } catch {
                rosters[team.id] = .failed(error.localizedDescription)
            }
        }
    }
}

/// A plain rounded search box — `.searchable` belongs to a navigation stack,
/// and these steps live inside a pager.
struct SearchField: View {
    @Binding var text: String
    let placeholder: String
    var focused: FocusState<Bool>.Binding

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.faint)
            TextField(placeholder, text: $text)
                .font(.system(size: 15))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .focused(focused)
                .submitLabel(.done)
                .onSubmit { focused.wrappedValue = false }
            if !text.isEmpty {
                Button { text = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.faint)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .glassEffect(.regular)
    }
}

/// A league's teams, for the picker's section headers.
struct LeagueSection: Identifiable {
    let league: League
    let teams: [CatalogTeam]
    var id: String { league.rawValue }
}

/// What `/api/teams` returns — the same fields as a follow, plus the
/// nickname the picker doesn't need but the website does.
struct CatalogTeam: Codable, Sendable, Hashable, Identifiable {
    let league: League
    let teamId: String
    let abbreviation: String
    let displayName: String
    let name: String?
    let logo: String
    let color: String

    var id: String { "\(league.rawValue):\(teamId)" }

    var follow: FollowedTeam {
        FollowedTeam(
            league: league, teamId: teamId, displayName: displayName,
            abbreviation: abbreviation, logo: logo, color: color
        )
    }
}

/// What `/api/roster` returns.
struct RosterPlayer: Codable, Sendable, Hashable, Identifiable {
    let league: League
    let id: String
    let fullName: String
    let teamId: String
    let teamAbbr: String
    let position: String
    let headshot: String

    var follow: FollowedPlayer {
        FollowedPlayer(
            league: league, playerId: id, fullName: fullName,
            teamAbbr: teamAbbr, headshot: headshot, position: position
        )
    }
}
