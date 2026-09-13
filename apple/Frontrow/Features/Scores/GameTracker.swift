import ActivityKit
import SwiftUI

/// Runs the Lock Screen and Dynamic Island tracker for one game.
///
/// One at a time, deliberately: the tracker is for the game you're actually
/// watching, and a Lock Screen stacked with them is worse than useless.
/// Starting a second one ends the first.
///
/// Updates come from the Scores tab's own poll — the same thirty seconds the
/// rest of the app runs on — which means they arrive while the app is awake.
/// A tracker that keeps pace with a locked phone needs the activity's push
/// token and a server to push to it; until then `staleDate` tells the system
/// to dim what it's showing rather than let it quietly go wrong.
@MainActor
@Observable
final class GameTracker {
    private(set) var trackedGameId: String?
    /// The running activity's id rather than the activity itself. `Activity`
    /// isn't sendable, and every call that ends or updates one is async — so
    /// the id crosses the boundary and the activity is looked up on the far
    /// side, where it already lives.
    private var activityId: String?

    /// How long a shown state is worth trusting. Past this the system greys
    /// the activity out, which is the honest look for data we can't refresh.
    private let freshFor: TimeInterval = 4 * 60
    /// How long a finished game lingers before the system clears it.
    private let lingerAfterFinal: TimeInterval = 5 * 60

    init() {
        // The app may have been relaunched while an activity is still running.
        if let running = Activity<GameActivity>.activities.first {
            activityId = running.id
            trackedGameId = running.attributes.gameId
        }
    }

    /// Whether the system will let us start one at all — a user can turn Live
    /// Activities off for the app in Settings.
    var isAvailable: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

    func isTracking(_ game: Game) -> Bool { trackedGameId == game.id }

    /// True when there is something moving to put on the Lock Screen. A
    /// finished game or one that hasn't started has nothing to say.
    func canTrack(_ game: Game) -> Bool { isAvailable && GameActivity.canTrack(game) }

    func start(_ game: Game) {
        guard canTrack(game) else { return }
        let previous = activityId
        do {
            activityId = try Activity.request(
                attributes: GameActivity(game),
                content: content(for: game),
                pushType: nil
            ).id
            trackedGameId = game.id
        } catch {
            // Turned off in Settings between the check and the request, or too
            // many activities running. Nothing to tell the user that the
            // absent Lock Screen card won't say more plainly.
            activityId = nil
            trackedGameId = nil
        }
        if let previous, previous != activityId { end(previous, with: nil, after: .immediate) }
    }

    func stop() {
        guard let id = activityId else { return }
        activityId = nil
        trackedGameId = nil
        end(id, with: nil, after: .immediate)
    }

    /// Push the latest scoreboard into the running activity. Called with each
    /// poll; does nothing when the tracked game isn't in the batch, which is
    /// what happens when the user walks to another week.
    func update(from games: [Game]) {
        guard let id = activityId, let gameId = trackedGameId,
              let game = games.first(where: { $0.id == gameId }) else { return }

        let content = content(for: game)
        if game.state == .post {
            // Let the final score stand for a few minutes, then let it go.
            activityId = nil
            trackedGameId = nil
            end(id, with: content, after: .after(.now.addingTimeInterval(lingerAfterFinal)))
        } else {
            push(id, content)
        }
    }

    /* Both of these are nonisolated on purpose. `Activity` isn't sendable and
       its calls are async, so a Task started on the main actor would have to
       hand the activity across an isolation boundary to reach them. Off the
       main actor the activity is fetched and used in the same place, and only
       the id and the content — both sendable — make the trip. */

    nonisolated private func push(
        _ id: String,
        _ content: ActivityContent<GameActivity.ContentState>
    ) {
        Task {
            await Activity<GameActivity>.activities
                .first { $0.id == id }?
                .update(content)
        }
    }

    nonisolated private func end(
        _ id: String,
        with content: ActivityContent<GameActivity.ContentState>?,
        after policy: ActivityUIDismissalPolicy
    ) {
        Task {
            await Activity<GameActivity>.activities
                .first { $0.id == id }?
                .end(content, dismissalPolicy: policy)
        }
    }

    private func content(for game: Game) -> ActivityContent<GameActivity.ContentState> {
        ActivityContent(
            state: GameActivity.ContentState(game),
            staleDate: .now.addingTimeInterval(freshFor)
        )
    }
}
