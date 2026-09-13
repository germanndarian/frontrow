import XCTest

/// The Lock Screen tracker's card. A Live Activity can't be put on a
/// simulator's Lock Screen and looked at, so the gallery draws the same views
/// the activity ships and the test reads them there.
final class LiveActivityTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testTheCardDrawsBothSportsAndTheBases() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-widget-gallery"]
        app.launch()

        XCTAssertTrue(app.staticTexts["LIVE ACTIVITY"].waitForExistence(timeout: 20))
        let list = app.scrollViews.firstMatch
        for _ in 0..<6 { list.swipeUp(velocity: .fast) }

        // The diamond says out loud what it is drawing, which is both how
        // VoiceOver reads it and how this test can tell the states apart.
        XCTAssertTrue(app.descendants(matching: .any)
            .matching(NSPredicate(format: "label == 'Bases loaded'")).firstMatch
            .waitForExistence(timeout: 10), "a loaded diamond")
        XCTAssertTrue(app.descendants(matching: .any)
            .matching(NSPredicate(format: "label == 'Bases empty'")).firstMatch
            .exists, "and an empty one")

        // The count and the outs, the inning, and football's own line.
        XCTAssertTrue(app.staticTexts["1-2, 1 out"].exists, "the count and outs")
        XCTAssertTrue(app.staticTexts["Bot 1st"].exists, "the inning")
        XCTAssertTrue(app.staticTexts["2nd & 9 at PHI 48"].exists, "football's down and distance")
        XCTAssertTrue(app.staticTexts["3rd · 09:32"].exists, "and its quarter and clock")
        attach(app, "1-activity-cards")
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
