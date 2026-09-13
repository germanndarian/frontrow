import Foundation

/// The URLs a widget opens the app with. Both targets compile this, so the
/// widget can't spell a link the app doesn't understand.
enum DeepLink {
    static let scheme = "frontrow"

    /// The scoreboard, with nothing particular in mind.
    static let scores = URL(string: "\(scheme)://scores")!

    /// One game's detail, opened straight from the home screen.
    static func game(_ id: String) -> URL {
        URL(string: "\(scheme)://game/\(id)") ?? scores
    }

    enum Destination: Equatable {
        case scores
        case game(String)
    }

    /// What a URL asks for, or nil when it isn't ours to act on — the OAuth
    /// callback comes back through the same door and belongs to the Supabase
    /// SDK, not to us.
    static func destination(of url: URL) -> Destination? {
        guard url.scheme == scheme else { return nil }
        switch url.host {
        case "scores":
            return .scores
        case "game":
            // frontrow://game/401856683 — the id is the whole path.
            let id = url.pathComponents.filter { $0 != "/" }.joined()
            return id.isEmpty ? .scores : .game(id)
        default:
            return nil
        }
    }

    /// The URL a UI test asked the app to open with, via
    /// `-ui-testing-url frontrow://game/123`. Nil in every other launch.
    static var testingURL: URL? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let flag = arguments.firstIndex(of: "-ui-testing-url"),
              arguments.index(after: flag) < arguments.endIndex else { return nil }
        return URL(string: arguments[arguments.index(after: flag)])
    }
}
