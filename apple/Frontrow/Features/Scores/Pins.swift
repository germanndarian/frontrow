import SwiftUI
import Observation

/// Games you've pinned to the top of a league's list.
///
/// Deliberately local to the device rather than synced with the account: a pin
/// is about the next few hours — the game you're half-watching while the list
/// refreshes around it — and it stops meaning anything once the game is over.
/// Syncing it would need a column, a migration and a merge rule for something
/// nobody will miss on their other phone.
///
/// Ids of finished games are swept on load, so a season's worth doesn't
/// accumulate in the defaults.
@MainActor
@Observable
final class Pins {
    private(set) var ids: Set<String> = []

    private let key = "frontrow.pinnedGames"
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        // The UI tests launch the app repeatedly against the same simulator,
        // and pins outlive a launch — so a run would inherit whatever the
        // last one pinned. Sample mode starts with a clean board.
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("-ui-testing-sample") || arguments.contains("-ui-testing-reset") {
            defaults.removeObject(forKey: key)
            ids = []
            return
        }
        ids = Set(defaults.stringArray(forKey: key) ?? [])
    }

    func contains(_ game: Game) -> Bool { ids.contains(game.id) }

    func toggle(_ game: Game) {
        if ids.contains(game.id) {
            ids.remove(game.id)
        } else {
            ids.insert(game.id)
        }
        save()
    }

    /// Drop pins for games that are no longer on the board. Called with each
    /// load: a pinned game that has finished has nothing left to say, and the
    /// list it was pinned to the top of has moved on.
    func forget(finishedIn games: [Game]) {
        let done = Set(games.filter { $0.state == .post }.map(\.id))
        guard !done.isEmpty, !ids.isDisjoint(with: done) else { return }
        ids.subtract(done)
        save()
    }

    private func save() {
        defaults.set(Array(ids), forKey: key)
    }
}

/// Pin or unpin a game. The same control in the card's context menu and in
/// the game sheet, so the wording can't drift between them.
struct PinButton: View {
    let game: Game
    let pins: Pins

    var body: some View {
        let on = pins.contains(game)
        Button {
            withAnimation(.snappy(duration: 0.25)) { pins.toggle(game) }
        } label: {
            Label(on ? "Unpin" : "Pin to top", systemImage: on ? "pin.slash" : "pin")
        }
    }
}
