import XCTest

/// The scoreboard leads with the teams you follow: "Your teams" is the default
/// view, a league shows that league in full with your games first and marked,
/// and the mark is meant to be visible at a glance.
final class FavouritesTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testMyTeamsIsTheDefaultAndALeagueShowsEverything() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 20))
        let mine = app.buttons["Your teams"]
        XCTAssertTrue(mine.waitForExistence(timeout: 10), "the first chip is your teams, not everything")

        let group = app.staticTexts.matching(
            NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
        ).firstMatch
        XCTAssertTrue(group.waitForExistence(timeout: 30), "your teams' games load")
        // Exactly the marker's own label: "Your teams" is also the first
        // chip, and CONTAINS would count the chip as a marked game.
        let marked = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label == 'Your team'"))
        XCTAssertEqual(marked.count, 0,
                       "nothing is marked here — every game already belongs to you")
        attach(app, "1-my-teams")

        // A league shows the whole league, says how many are yours, and marks
        // them so they carry across a long list.
        app.buttons["MLB"].tap()
        let rule = app.staticTexts.matching(
            NSPredicate(format: "label ENDSWITH ' yours'")
        ).firstMatch
        XCTAssertTrue(rule.waitForExistence(timeout: 30),
                      "a league's groups count your games inside the full slate")
        XCTAssertTrue(
            app.descendants(matching: .any)
                .matching(NSPredicate(format: "label == 'Your team'")).firstMatch
                .waitForExistence(timeout: 10),
            "and your games are marked among the rest"
        )
        attach(app, "2-mlb-full-slate")

        // Back to yours.
        mine.tap()
        XCTAssertTrue(app.staticTexts.matching(
            NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
        ).firstMatch.waitForExistence(timeout: 30))
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
