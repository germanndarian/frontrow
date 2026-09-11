import XCTest

/// Onboarding is a pager, so it gets swiped — including past the ends, which
/// is what a thumb does when it is enjoying itself. The steps have to survive
/// that: the crash this covers was an index into a fixed array of titles,
/// reached with a step the pager had moved beyond.
final class OnboardingSwipeTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testSwipingPastBothEndsKeepsTheFlowAlive() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-reset"]
        app.launch()

        XCTAssertTrue(app.buttons["Look around as a guest"].waitForExistence(timeout: 20))
        app.buttons["Look around as a guest"].tap()
        XCTAssertTrue(app.staticTexts["Pick your sports"].waitForExistence(timeout: 10))

        // Pick a sport so the later steps have something to show.
        app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Baseball'")).firstMatch.tap()

        let pager = app.scrollViews.firstMatch
        XCTAssertTrue(pager.waitForExistence(timeout: 5))

        // Forward past the last page, then back past the first, twice over.
        for _ in 0..<2 {
            for _ in 0..<6 { pager.swipeLeft(velocity: .fast) }
            XCTAssertTrue(app.state == .runningForeground, "still alive after swiping past the end")
            for _ in 0..<6 { pager.swipeRight(velocity: .fast) }
            XCTAssertTrue(app.state == .runningForeground, "still alive after swiping past the start")
        }

        // Whichever step it settled on, the flow is still showing one of them.
        let titles = ["Pick your sports", "Choose your leagues", "Follow your teams", "Star your players"]
        let showing = titles.contains { app.staticTexts[$0].exists }
        XCTAssertTrue(showing, "a step is still on screen")
        attach(app, "1-after-swiping")
    }

    /// Back walks the steps down and stops: at the first step there is no
    /// previous step to go to, and no button offering one.
    @MainActor
    func testBackStopsAtTheFirstStep() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-reset"]
        app.launch()

        XCTAssertTrue(app.buttons["Look around as a guest"].waitForExistence(timeout: 20))
        app.buttons["Look around as a guest"].tap()
        XCTAssertTrue(app.staticTexts["Pick your sports"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Back"].exists, "nothing to go back to from the first step")

        app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Baseball'")).firstMatch.tap()
        app.buttons["Continue"].tap()
        XCTAssertTrue(app.staticTexts["Choose your leagues"].waitForExistence(timeout: 10))

        let back = app.buttons["Back"]
        XCTAssertTrue(back.waitForExistence(timeout: 5))
        back.tap()
        XCTAssertTrue(app.staticTexts["Pick your sports"].waitForExistence(timeout: 5))
        XCTAssertFalse(back.exists, "and the way back is gone again")
        XCTAssertEqual(app.state, .runningForeground)
        attach(app, "2-back-to-the-first-step")
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
