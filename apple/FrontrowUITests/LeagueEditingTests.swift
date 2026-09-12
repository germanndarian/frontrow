import XCTest

/// Leagues are a setup-time choice you can revisit: Settings lists what you
/// follow at the top level and opens the same pickers onboarding used.
final class LeagueEditingTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testLeaguesCanBeChangedFromSettings() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 20))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 10))

        // One panel, one Edit: leagues, teams and players are all the same
        // question, and two buttons opened the same sheet.
        XCTAssertTrue(app.staticTexts["What you follow"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons.matching(identifier: "Edit").count, 1,
                       "one Edit button, not one per kind of thing")
        XCTAssertTrue(app.staticTexts["Major League Baseball"].exists)
        XCTAssertTrue(app.staticTexts["College Football"].exists)
        XCTAssertTrue(app.staticTexts["New York Yankees"].exists, "and the teams are in the same panel")
        attach(app, "1-settings-follows")

        app.buttons["Edit"].tap()
        XCTAssertTrue(app.navigationBars["Edit follows"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Sports"].exists, "sports are editable too")
        XCTAssertTrue(app.buttons["Leagues"].exists, "and leagues, since football is followed")

        app.buttons["Leagues"].tap()
        let collegeRow = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'College Football'")
        ).firstMatch
        XCTAssertTrue(collegeRow.waitForExistence(timeout: 10))
        collegeRow.tap()
        attach(app, "2-editing-leagues")
        app.buttons["Done"].tap()

        // The panel reflects the change, and so does the scoreboard's chips.
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["College Football"].exists, "dropping a league sticks")
        attach(app, "3-league-dropped")

        app.tabBars.buttons["Scores"].tap()
        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["NCAAF"].exists, "and the scoreboard stops offering it")
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
