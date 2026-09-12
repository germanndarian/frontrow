import XCTest

/// A game card opens the game: the score, the line score period by period,
/// and the detail around it — or a countdown when it hasn't started. The LIVE
/// pill opens the same sheet for whatever is on now.
final class GameDetailTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testTappingAGameOpensItsDetail() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 20))
        // A whole league gives the widest choice of game states.
        app.buttons["MLB"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
            ).firstMatch.waitForExistence(timeout: 30)
        )

        // The card is the target, not just the words on it.
        let card = app.buttons.matching(
            NSPredicate(format: "label CONTAINS 'MLB'")
        ).firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        open(card, in: app)

        XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout: 10), "a sheet came up")
        XCTAssertTrue(app.navigationBars["MLB"].exists, "titled with the league")
        attach(app, "1-game-detail")

        // Whatever the game's state, the sheet says when it starts and where
        // it stands — the two rows ESPN fills for every game. (The line score
        // needs a game that has begun, so it is left to the unit tests.)
        XCTAssertTrue(app.staticTexts["Start"].exists, "the sheet carries the detail rows")
        XCTAssertTrue(app.staticTexts["Status"].exists)

        app.buttons["Done"].tap()
        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testAnUpcomingGameCountsDown() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 20))
        app.buttons["MLB"].tap()
        XCTAssertTrue(app.staticTexts["UPCOMING"].waitForExistence(timeout: 30),
                      "there are games still to come")

        // A card that hasn't started. Which one depends on the day's slate, so
        // take the first and scroll it up if the live games pushed it down.
        let scheduled = app.buttons.matching(
            NSPredicate(format: "label CONTAINS 'SCHEDULED'")
        ).firstMatch
        XCTAssertTrue(scheduled.waitForExistence(timeout: 10))
        open(scheduled, in: app)

        XCTAssertTrue(app.staticTexts["STARTS IN"].waitForExistence(timeout: 10))
        // The clock has to actually run. Match only the countdown's own shape
        // — "04:31:09", "31:09", "2d 04:31:09" — so a kick-off time like
        // "Today · 10:05 PM" on a card behind the sheet can't stand in for it.
        let clock = app.staticTexts.matching(
            NSPredicate(format: "label MATCHES '^([0-9]+d )?[0-9]{2}:[0-9]{2}(:[0-9]{2})?$'")
        ).firstMatch
        XCTAssertTrue(clock.waitForExistence(timeout: 5))
        let first = clock.label
        attach(app, "2-countdown")
        sleep(3)
        XCTAssertNotEqual(clock.label, first, "the countdown ticks")
    }

    /// Tap a card's trailing edge, away from the team names, after bringing it
    /// on screen — an off-screen element still has a frame, and tapping that
    /// frame's coordinate hits whatever happens to be there instead.
    @MainActor
    private func open(_ card: XCUIElement, in app: XCUIApplication) {
        let list = app.scrollViews.firstMatch
        for _ in 0..<8 where !card.isHittable {
            list.swipeUp(velocity: .fast)
        }
        XCTAssertTrue(card.isHittable, "the card is on screen")
        card.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5)).tap()
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
