import XCTest

/// The week view on the Scores tab: the strip runs from last week into the
/// season ahead, picking a week retitles the screen and reloads the slate,
/// and football games say which week of the season they belong to.
///
/// Pass `-api-base http://localhost:3000/api` to run it against a dev server.
final class WeekTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testWeekStripSelectsAndRetitles() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"] + apiBase()
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 20))
        for label in ["Last week", "This week", "Next week"] {
            XCTAssertTrue(app.buttons[label].waitForExistence(timeout: 10), "\(label) chip")
        }
        // Games have to arrive before the week is worth changing.
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
            ).firstMatch.waitForExistence(timeout: 30),
            "this week's slate loads"
        )
        attach(app, "1-this-week")

        app.buttons["Next week"].tap()
        // The subtitle names the week on screen, so it is the honest signal
        // that the selection took rather than a count that might not change.
        let subtitle = app.staticTexts.matching(
            NSPredicate(format: "label BEGINSWITH 'Next week · '")
        ).firstMatch
        XCTAssertTrue(subtitle.waitForExistence(timeout: 15), "the title follows the selected week")
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label IN {'UPCOMING', 'LIVE NOW', 'RESULTS'}")
            ).firstMatch.waitForExistence(timeout: 30),
            "next week's slate loads"
        )
        attach(app, "2-next-week")

        app.buttons["Last week"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'Last week · '")).firstMatch
                .waitForExistence(timeout: 15),
            "and back the other way"
        )
        XCTAssertTrue(app.staticTexts["RESULTS"].waitForExistence(timeout: 30),
                      "a week that has been played is all results")
        attach(app, "3-last-week")
    }

    @MainActor
    func testFootballGamesNameTheirSeasonWeek() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"] + apiBase()
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 20))
        app.buttons["NFL"].tap()
        // A card combines its children into one element, so the week shows up
        // inside the card's own label rather than as a text of its own.
        let card = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS 'WEEK '")).firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 30), "NFL cards carry their season week")
        let note = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'NFL Week '")).firstMatch
        XCTAssertTrue(note.waitForExistence(timeout: 10), "and the header says where the season is")
        attach(app, "4-nfl-week")
    }

    /// Lets a run be aimed at a dev server without hard-coding one. xcodebuild
    /// only forwards TEST_RUNNER_-prefixed variables into the simulator, so
    /// accept either spelling:
    /// `xcodebuild test TEST_RUNNER_FRONTROW_API_BASE=http://localhost:3000/api`
    private func apiBase() -> [String] {
        let environment = ProcessInfo.processInfo.environment
        let base = environment["FRONTROW_API_BASE"] ?? environment["TEST_RUNNER_FRONTROW_API_BASE"]
        guard let base, !base.isEmpty else { return [] }
        return ["-api-base", base]
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
