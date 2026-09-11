import Foundation

/// The slice of the account the widgets need, handed across the app-group
/// boundary. Widgets run in their own process and can't see the keychain
/// session, so the app writes what it knows here whenever it changes and the
/// widget reads the last thing written.
enum SharedStore {
    static let appGroup = "group.com.germanndarian.frontrow"

    /// What a widget needs to draw: who you follow and which accent to use.
    struct Snapshot: Codable, Sendable, Hashable {
        var leagues: [League]
        var teams: [FollowedTeam]
        var accent: AccentId
        var updatedAt: Date

        static let sample = Snapshot(
            leagues: [.mlb, .nhl, .nfl, .collegeFootball],
            teams: DefaultLineup.teams,
            accent: .cobalt,
            updatedAt: .distantPast
        )
    }

    private static let key = "frontrow.snapshot"

    private static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    /// Writes the snapshot for the widgets. Silently does nothing when the
    /// app group isn't available — a missing entitlement shouldn't take the
    /// app down, it should just leave the widgets on their last good data.
    static func write(_ snapshot: Snapshot) {
        guard let defaults, let data = try? JSONEncoder().encode(snapshot) else { return }
        defaults.set(data, forKey: key)
    }

    /// The last snapshot the app wrote, or the sample lineup when there is
    /// none — a widget added before signing in still shows something real.
    static func read() -> Snapshot {
        guard let data = defaults?.data(forKey: key),
              let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data)
        else { return .sample }
        return snapshot
    }

    /// True when the app has actually written follows, as opposed to the
    /// sample lineup standing in.
    static var hasAccountData: Bool {
        defaults?.data(forKey: key) != nil
    }
}
