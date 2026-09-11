import Foundation

/// The `profiles` row: who you are, plus the emoji and colour the app greets
/// you with.
struct ProfileRow: Codable, Sendable, Hashable {
    var id: String
    var displayName: String
    var avatarEmoji: String
    var avatarColor: String

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case avatarEmoji = "avatar_emoji"
        case avatarColor = "avatar_color"
    }

    static let emojis = ["🏈", "🏀", "⚾️", "🏒", "🥎", "🔥", "⚡️", "🦅", "🐂", "🦈", "🐺", "🐉", "👑"]
}

/// The `preferences` row: who you follow. The same JSON the website writes,
/// so a change on either side shows up on the other.
struct PreferencesRow: Codable, Sendable, Hashable {
    var userId: String
    var sports: [Sport]
    var leagues: [League]
    var teams: [FollowedTeam]
    var players: [FollowedPlayer]
    var onboarded: Bool

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case sports, leagues, teams, players, onboarded
    }
}

/// The `settings` row. The app edits theme, accent, reduced motion and the
/// greeting; the rest belongs to the web dashboard's layout and is carried
/// through untouched rather than dropped on write.
struct SettingsRow: Codable, Sendable, Hashable {
    var userId: String
    var appearance: Appearance
    var accent: AccentId
    var radius: String
    var density: String
    var reduceMotion: Bool
    var backgroundGlow: Bool
    var greetingName: String
    var defaultLeague: String
    var hiddenSections: [String]

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case appearance, accent, radius, density
        case reduceMotion = "reduce_motion"
        case backgroundGlow = "background_glow"
        case greetingName = "greeting_name"
        case defaultLeague = "default_league"
        case hiddenSections = "hidden_sections"
    }

    static func defaults(userId: String) -> SettingsRow {
        SettingsRow(
            userId: userId, appearance: .system, accent: .cobalt, radius: "default",
            density: "comfortable", reduceMotion: false, backgroundGlow: true,
            greetingName: "", defaultLeague: "all", hiddenSections: []
        )
    }
}

/// Light, dark, or whatever the phone is set to.
enum Appearance: String, Codable, Sendable, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }

    var label: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }
}

/// The sports the leagues belong to, keyed as the website keys them.
enum Sport: String, Codable, Sendable, CaseIterable, Identifiable {
    case football, basketball, baseball, hockey
    var id: String { rawValue }

    var name: String {
        switch self {
        case .football: "Football"
        case .basketball: "Basketball"
        case .baseball: "Baseball"
        case .hockey: "Hockey"
        }
    }

    var leagues: [League] {
        switch self {
        case .football: [.nfl, .collegeFootball]
        case .basketball: [.nba]
        case .baseball: [.mlb]
        case .hockey: [.nhl]
        }
    }

    var symbol: String {
        switch self {
        case .football: "football"
        case .basketball: "basketball"
        case .baseball: "baseball"
        case .hockey: "hockey.puck"
        }
    }
}

extension League {
    var sport: Sport {
        switch self {
        case .nfl, .collegeFootball: .football
        case .nba: .basketball
        case .mlb: .baseball
        case .nhl: .hockey
        }
    }

    /// Display order, matching the website's LEAGUE_ORDER.
    static let displayOrder: [League] = [.nba, .mlb, .nhl, .nfl, .collegeFootball]
}
