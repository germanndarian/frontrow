import XCTest

/// Opening a player shows the player: the sheet leads with their face, not
/// with their team's initials.
final class PlayerPictureTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testAPlayerSheetLeadsWithTheirPicture() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        app.tabBars.buttons["Players"].tap()
        XCTAssertTrue(app.navigationBars["Your Players"].waitForExistence(timeout: 30))

        let judge = app.staticTexts["Aaron Judge"]
        XCTAssertTrue(judge.waitForExistence(timeout: 25), "the cards have loaded")
        // The cards carry a headshot each; the sheet adds one more.
        let onCards = app.images.matching(identifier: "headshot").count
        XCTAssertGreaterThan(onCards, 0)

        judge.tap()
        XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout: 15), "the sheet opened")
        XCTAssertTrue(app.staticTexts["Aaron Judge"].waitForExistence(timeout: 10))

        var inSheet = 0
        for _ in 0..<10 where inSheet <= onCards {
            inSheet = app.images.matching(identifier: "headshot").count
            if inSheet <= onCards { usleep(300_000) }
        }
        XCTAssertGreaterThan(inSheet, onCards, "the sheet shows the player's picture")
        attach(app, "1-player-sheet")

        app.buttons["Done"].tap()
        XCTAssertTrue(app.navigationBars["Your Players"].waitForExistence(timeout: 10))
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
