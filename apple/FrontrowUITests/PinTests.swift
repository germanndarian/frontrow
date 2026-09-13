import XCTest

/// Pinning holds a game at the top of its group inside a league's list — the
/// live game stays with the live games, so a pin lifts it above its own
/// neighbours rather than above the whole board. Under "Your teams" it does
/// nothing at all: that list is already yours and ordered the way you asked.
final class PinTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testPinningLiftsAGameUpItsLeagueList() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 25))
        app.buttons["MLB"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
            ).firstMatch.waitForExistence(timeout: 30),
            "the league's slate loads"
        )
        XCTAssertNil(pinnedIndex(in: app), "nothing is pinned yet")

        // A card that isn't already the first of its group, since pinning one
        // that is would look like nothing happening. Which card that is
        // depends on the day's slate, so find one rather than assume an index.
        let labels = cardLabels(in: app)
        XCTAssertGreaterThan(labels.count, 1, "a league has games to reorder")
        guard let target = labels.indices.first(where: { i in
            labels[..<i].contains { group($0) == group(labels[i]) }
        }) else {
            throw XCTSkip("every game on today's slate is alone in its group")
        }

        let cards = app.buttons.matching(NSPredicate(format: "label CONTAINS 'MLB'"))
        let card = cards.element(boundBy: target)
        let list = app.scrollViews.firstMatch
        for _ in 0..<8 where !card.isHittable { list.swipeUp(velocity: .fast) }
        XCTAssertTrue(card.isHittable, "the card is on screen to press")
        card.press(forDuration: 1.1)

        let pin = app.buttons["Pin to top"]
        XCTAssertTrue(pin.waitForExistence(timeout: 5), "the card offers a pin")
        pin.tap()

        // The pinned game is now the first of its own group — above its
        // neighbours, not above the whole board.
        let after = cardLabels(in: app)
        let pinnedAt = try XCTUnwrap(after.firstIndex { $0.contains("Pinned") },
                                     "the pinned game says so on its card")
        let ahead = after[..<pinnedAt].filter { group($0) == group(after[pinnedAt]) }
        XCTAssertTrue(ahead.isEmpty, "nothing from its group is still above it")
        attach(app, "1-pinned")

        // Unpinning releases it.
        let top = app.buttons.matching(NSPredicate(format: "label CONTAINS 'MLB'"))
            .element(boundBy: pinnedAt)
        for _ in 0..<8 where !top.isHittable { list.swipeUp(velocity: .fast) }
        top.press(forDuration: 1.1)
        let unpin = app.buttons["Unpin"]
        XCTAssertTrue(unpin.waitForExistence(timeout: 5))
        unpin.tap()
        XCTAssertNil(pinnedIndex(in: app), "unpinning releases it")
    }

    /// Which group a card belongs to, read off the status its label carries.
    private func group(_ label: String) -> String {
        if label.contains("SCHEDULED") { return "upcoming" }
        if label.contains("FINAL") { return "results" }
        return "live"
    }

    @MainActor
    private func cardLabels(in app: XCUIApplication) -> [String] {
        app.buttons.matching(NSPredicate(format: "label CONTAINS 'MLB'"))
            .allElementsBoundByIndex.map(\.label)
    }

    @MainActor
    func testAPinChangesNothingUnderYourTeams() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 25))
        // "Your teams" is the default view; don't tap a league.
        XCTAssertTrue(app.buttons["Your teams"].waitForExistence(timeout: 10))
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
            ).firstMatch.waitForExistence(timeout: 30),
            "your teams' games load"
        )

        // A pin belongs to the game, so it can be set from the game's own
        // sheet anywhere. What it must not do is mark or reorder this list.
        let mlb = app.buttons.matching(NSPredicate(format: "label CONTAINS 'MLB'"))
        XCTAssertTrue(mlb.firstMatch.waitForExistence(timeout: 10))
        let before = mlb.firstMatch.label
        mlb.firstMatch.tap()
        XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout: 10))
        app.buttons["Pin to top"].tap()
        app.buttons["Done"].tap()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 10))
        let first = app.buttons.matching(NSPredicate(format: "label CONTAINS 'MLB'")).firstMatch
        XCTAssertTrue(first.waitForExistence(timeout: 10))
        XCTAssertNil(pinnedIndex(in: app), "no pin marking under your teams")
        XCTAssertEqual(first.label, before, "and no reordering either")
        attach(app, "2-your-teams-unchanged")

        // The same pin does hold inside the league, which is where it means
        // something.
        app.buttons["MLB"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
            ).firstMatch.waitForExistence(timeout: 30)
        )
        var found: Int?
        for _ in 0..<10 where found == nil {
            found = pinnedIndex(in: app)
            if found == nil { usleep(300_000) }
        }
        XCTAssertNotNil(found, "the league list honours it")
        attach(app, "3-league-honours-it")
    }

    /// Where the pinned card sits among the league's cards, or nil when none
    /// is pinned.
    @MainActor
    private func pinnedIndex(in app: XCUIApplication) -> Int? {
        let labels = app.buttons.matching(NSPredicate(format: "label CONTAINS 'MLB'"))
            .allElementsBoundByIndex.map(\.label)
        let marked = labels.enumerated().filter { $0.element.contains("Pinned") }
        XCTAssertLessThanOrEqual(marked.count, 1, "one pin at a time in this test")
        return marked.first?.offset
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
