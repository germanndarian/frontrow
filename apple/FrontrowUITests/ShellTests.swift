import XCTest

/// Proves the shell behaves like Apple Music: five glass tabs, the bar
/// minimises to its icon when the scores list scrolls down, and the labels
/// come back when the bar is tapped or the list scrolls up.
///
/// The assertion is on hittability, not on `tabBar.frame`: the accessibility
/// container keeps its full height while the visible glass capsule shrinks,
/// so the honest signal that the bar minimised is that the other tabs are no
/// longer reachable.
final class ShellTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testTabBarMinimizesOnScrollDownAndExpandsAgain() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample"]
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 15), "tab bar should exist")
        let scores = tabBar.buttons["Scores"]
        let settings = tabBar.buttons["Settings"]
        XCTAssertTrue(scores.exists)
        XCTAssertTrue(settings.exists)

        // The tab bar only minimises against a list long enough to scroll, and
        // "Your teams" is deliberately short — a league's whole week is not.
        let list = app.scrollViews.firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["MLB"].waitForExistence(timeout: 15))
        app.buttons["MLB"].tap()
        _ = app.staticTexts["UPCOMING"].waitForExistence(timeout: 30)
            || app.staticTexts["LIVE NOW"].waitForExistence(timeout: 5)
            || app.staticTexts["RESULTS"].waitForExistence(timeout: 5)

        XCTAssertTrue(settings.isHittable, "every tab is reachable while the bar is expanded")
        attach(app, "1-expanded")

        // Scroll down: the bar collapses to the selected tab's icon.
        for _ in 0..<3 { list.swipeUp(velocity: .fast) }
        sleep(1)
        attach(app, "2-minimized-after-scroll-down")
        XCTAssertFalse(settings.isHittable, "the other tabs are hidden once the bar minimises")
        XCTAssertTrue(scores.exists, "the selected tab's icon stays visible")

        // Tapping the minimised pill brings the labels back.
        scores.tap()
        sleep(1)
        attach(app, "3-expanded-after-tap")
        XCTAssertTrue(settings.isHittable, "tapping the bar expands it again")

        // And so does scrolling back up. The bar comes back as the list
        // travels toward the top rather than on the first flick, so swipe
        // until it does (measured: about eight flicks from here).
        for _ in 0..<3 { list.swipeUp(velocity: .fast) }
        sleep(1)
        XCTAssertFalse(settings.isHittable, "minimised again")
        for _ in 0..<14 where !settings.isHittable {
            list.swipeDown(velocity: .fast)
        }
        sleep(1)
        attach(app, "4-expanded-after-scroll-up")
        XCTAssertTrue(settings.isHittable, "scrolling back up expands it again")

        settings.tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
        attach(app, "5-settings-tab")
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
