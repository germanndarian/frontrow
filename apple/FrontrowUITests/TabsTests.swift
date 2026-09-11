import XCTest

/// Walks the tabs that arrived in phase 2 — Teams, Players and Table — and
/// opens each of the three sheets, asserting the live data actually rendered.
/// Screenshots are attached at every step.
final class TabsTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testTeamsPlayersAndTableRenderLiveData() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 15), "tab bar should exist")

        // ── Teams ────────────────────────────────────────────────────────
        go(app, "Teams")
        XCTAssertTrue(app.navigationBars["Your Teams"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["New York Yankees"].waitForExistence(timeout: 30),
                      "the followed team's card should load from the API")
        XCTAssertTrue(app.staticTexts["RECENT FORM"].firstMatch.waitForExistence(timeout: 10),
                      "each card shows recent form")
        attach(app, "1-teams")

        // ── Schedule sheet ───────────────────────────────────────────────
        app.buttons["Full schedule"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Full schedule"].waitForExistence(timeout: 10))
        let hasGames = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'RESULTS ·' OR label BEGINSWITH 'UPCOMING ·'")).firstMatch
        XCTAssertTrue(hasGames.waitForExistence(timeout: 30), "the schedule sheet lists games")
        attach(app, "3-schedule-sheet")
        app.buttons["Done"].firstMatch.tap()

        // The season panel sits below the cards, so scroll down to it.
        let teamList = app.scrollViews.firstMatch
        for _ in 0..<8 where !app.staticTexts["Record & form"].exists {
            teamList.swipeUp(velocity: .fast)
        }
        XCTAssertTrue(app.staticTexts["Record & form"].waitForExistence(timeout: 10),
                      "the season panel features the first team")
        XCTAssertTrue(app.staticTexts["RECORD"].exists, "with its record and win %")
        attach(app, "2-season-stats")

        // ── Players ──────────────────────────────────────────────────────
        go(app, "Players")
        XCTAssertTrue(app.navigationBars["Your Players"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Aaron Judge"].waitForExistence(timeout: 30),
                      "the starred player's card should load from the API")
        XCTAssertTrue(app.staticTexts["AVG"].waitForExistence(timeout: 10),
                      "season stats render with their abbreviations")
        attach(app, "4-players")

        // ── Player sheet ─────────────────────────────────────────────────
        app.staticTexts["Aaron Judge"].tap()
        XCTAssertTrue(app.staticTexts["Batting Average"].waitForExistence(timeout: 20),
                      "the sheet labels each stat in full")
        attach(app, "5-player-sheet")
        app.buttons["Done"].firstMatch.tap()

        // ── Table ────────────────────────────────────────────────────────
        go(app, "Table")
        XCTAssertTrue(app.navigationBars["Around the League"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["AL East"].waitForExistence(timeout: 30),
                      "the followed team's division loads")
        XCTAssertTrue(app.staticTexts["Yankees"].waitForExistence(timeout: 10),
                      "and the followed team is in it")
        attach(app, "6-table-mlb")

        app.buttons["NHL"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Oilers"].waitForExistence(timeout: 30),
                      "switching league switches the table")
        attach(app, "7-table-nhl")
    }

    /// Switches tabs, expanding the bar first when scrolling has minimised it
    /// to the selected tab's icon.
    @MainActor
    private func go(_ app: XCUIApplication, _ title: String) {
        let bar = app.tabBars.firstMatch
        let target = bar.buttons[title]
        if !target.isHittable {
            bar.buttons.allElementsBoundByIndex.first { $0.isHittable }?.tap()
        }
        XCTAssertTrue(target.waitForExistence(timeout: 5))
        target.tap()
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
