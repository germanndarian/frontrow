import XCTest

/// Onboarding only offers what has been earned: no swiping ahead of an answer
/// you haven't given, and no league step for someone whose sports leave
/// nothing to choose between.
final class StepGatingTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testSwipingOnlyReachesStepsAlreadyVisited() throws {
        let app = guestOnboarding()
        XCTAssertTrue(app.staticTexts["Pick your sports"].waitForExistence(timeout: 15))

        // Nothing picked: swiping cannot leave the first step. The swipe goes
        // below the rows — a swipe over one would land on it, since with a
        // single page there is no pager to claim the gesture.
        for _ in 0..<3 { swipeForward(app) }
        attach(app, "1-stuck-on-sports")
        XCTAssertEqual(app.state, .runningForeground)
        XCTAssertTrue(app.staticTexts["Pick your sports"].exists,
                      "a sport has to be chosen before anything follows it")

        // Even with a sport chosen, a swipe doesn't jump ahead — Continue is
        // what opens the next step.
        tapRow(app, "Baseball")
        for _ in 0..<2 { swipeForward(app) }
        XCTAssertTrue(app.staticTexts["Pick your sports"].exists,
                      "forward is earned by Continue, not by swiping")

        app.buttons["Continue"].tap()
        XCTAssertTrue(app.staticTexts["Follow your teams"].waitForExistence(timeout: 15),
                      "one league per sport means no league step")
        attach(app, "2-straight-to-teams")

        // Backwards is always free, and forwards again once it has been seen.
        swipeBack(app)
        XCTAssertTrue(app.staticTexts["Pick your sports"].waitForExistence(timeout: 5),
                      "swiping back through what you have done")
        swipeForward(app)
        XCTAssertTrue(app.staticTexts["Follow your teams"].waitForExistence(timeout: 5),
                      "and forward again into a step already visited")

        // But no further: players stays shut until a team is followed.
        for _ in 0..<3 { swipeForward(app) }
        XCTAssertTrue(app.staticTexts["Follow your teams"].exists)
    }

    @MainActor
    func testFootballGetsALeagueStep() throws {
        let app = guestOnboarding()
        XCTAssertTrue(app.staticTexts["Pick your sports"].waitForExistence(timeout: 15))

        tapRow(app, "Football")
        app.buttons["Continue"].tap()
        XCTAssertTrue(app.staticTexts["Choose your leagues"].waitForExistence(timeout: 10),
                      "football has two leagues, so the choice is worth making")
        XCTAssertTrue(app.staticTexts["National Football League"].exists)
        XCTAssertTrue(app.staticTexts["College Football"].exists)
        attach(app, "3-football-leagues")
    }

    @MainActor
    private func guestOnboarding() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-reset"]
        app.launch()
        XCTAssertTrue(app.buttons["Look around as a guest"].waitForExistence(timeout: 20))
        app.buttons["Look around as a guest"].tap()
        return app
    }

    /// Swipes inside the pager, below the rows of the first step: a swipe over
    /// a row would land on it while there is a single page and no pager to
    /// claim the gesture.
    @MainActor
    private func swipeForward(_ app: XCUIApplication) {
        drag(app, from: 0.88, to: 0.08)
    }

    @MainActor
    private func swipeBack(_ app: XCUIApplication) {
        drag(app, from: 0.08, to: 0.88)
    }

    @MainActor
    private func drag(_ app: XCUIApplication, from: CGFloat, to: CGFloat) {
        let window = app.windows.firstMatch
        window.coordinate(withNormalizedOffset: CGVector(dx: from, dy: 0.72))
            .press(forDuration: 0.05,
                   thenDragTo: window.coordinate(withNormalizedOffset: CGVector(dx: to, dy: 0.72)))
    }

    @MainActor
    private func tapRow(_ app: XCUIApplication, _ name: String) {
        let row = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", name)).firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 10), "\(name) row")
        row.tap()
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
