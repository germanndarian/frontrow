import XCTest

/// Renders the widgets at their real sizes and photographs them. The views
/// are the ones the extension ships — the app compiles the same files — so
/// this is how a widget change gets looked at without adding one to a home
/// screen first.
final class WidgetGalleryTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testWidgetsRenderAtEverySize() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-widget-gallery"]
        app.launch()

        XCTAssertTrue(app.staticTexts["Small · 2×2"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.staticTexts["Medium · 4×2"].exists)
        XCTAssertTrue(app.staticTexts["FRONTROW"].firstMatch.exists, "the widgets draw their header")
        XCTAssertTrue(app.staticTexts["LIVE"].firstMatch.exists, "and the live pill when a game is on")
        attach(app, "1-home-widgets")

        let gallery = app.scrollViews.firstMatch
        for _ in 0..<3 { gallery.swipeUp(velocity: .fast) }
        XCTAssertTrue(app.staticTexts["LOCK SCREEN"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Rectangular"].exists)
        XCTAssertTrue(app.staticTexts["Circular"].exists)
        XCTAssertTrue(app.staticTexts["Inline"].exists)
        attach(app, "2-lock-widgets")
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
