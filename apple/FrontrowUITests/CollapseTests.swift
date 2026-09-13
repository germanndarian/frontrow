import XCTest

/// Two ways the app stops being a wall of cards: a team's players fold away,
/// and Settings previews what you follow rather than listing all of it.
final class CollapseTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testAPlayerSectionFoldsAway() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        app.tabBars.buttons["Players"].tap()
        XCTAssertTrue(app.navigationBars["Your Players"].waitForExistence(timeout: 25))

        let header = app.staticTexts["NEW YORK YANKEES"]
        XCTAssertTrue(header.waitForExistence(timeout: 25))
        let judge = app.staticTexts["Aaron Judge"]
        XCTAssertTrue(judge.waitForExistence(timeout: 25), "the section starts open")

        header.tap()
        XCTAssertFalse(judge.waitForExistence(timeout: 3), "folding hides the cards")
        // Folded, the header says how many it is holding.
        XCTAssertTrue(app.staticTexts["NYY · 1"].exists, "and counts what it hid")
        attach(app, "1-folded")

        header.tap()
        XCTAssertTrue(judge.waitForExistence(timeout: 10), "and it comes back")
    }

    @MainActor
    func testSettingsPreviewsFollowsAndOpensTheFullList() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 10))

        // Four teams and four players are followed; the panel shows three of
        // each, so the fourth of each is only in the full list.
        XCTAssertTrue(app.staticTexts["New York Yankees"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Texas Longhorns"].exists, "the panel stops at three")
        XCTAssertFalse(app.staticTexts["Arch Manning"].exists)

        let viewAll = app.buttons.matching(
            NSPredicate(format: "label CONTAINS 'View all'")
        ).firstMatch
        XCTAssertTrue(viewAll.waitForExistence(timeout: 10), "and offers the rest")
        viewAll.tap()

        XCTAssertTrue(app.navigationBars["What you follow"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Texas Longhorns"].waitForExistence(timeout: 5),
                      "the full list holds everything")
        XCTAssertTrue(app.staticTexts["Arch Manning"].exists)
        attach(app, "2-full-list")
        app.buttons["Done"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
