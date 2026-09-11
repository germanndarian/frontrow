import XCTest

/// The phase-3 gate: the front door, the sign-in sheet talking to Supabase,
/// and the guest path through onboarding into the app.
///
/// Signing in for real needs somebody's account, so this asserts the round
/// trip instead: a wrong password has to come back from Supabase as a
/// rejection, which only happens if the client, the project URL and the anon
/// key are all right.
final class AccountTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testFrontDoorAndSignInRoundTrip() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-reset"]
        app.launch()

        XCTAssertTrue(app.buttons["Get started free"].waitForExistence(timeout: 20),
                      "a signed-out launch lands on the front door")
        XCTAssertTrue(app.buttons["I already have an account"].exists)
        XCTAssertTrue(app.buttons["Look around as a guest"].exists)
        attach(app, "1-welcome")

        app.buttons["I already have an account"].tap()
        let email = app.textFields.firstMatch
        XCTAssertTrue(email.waitForExistence(timeout: 10))
        email.tap()
        email.typeText("nobody-\(UUID().uuidString.prefix(8))@frontrow.invalid")
        let password = app.secureTextFields.firstMatch
        password.tap()
        password.typeText("not-the-password")
        attach(app, "2-sign-in")

        app.buttons["Sign in"].firstMatch.tap()
        // Supabase answers; anything else would mean the client never reached it.
        let rejection = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS[c] 'credential' OR label CONTAINS[c] 'invalid'")
        ).firstMatch
        XCTAssertTrue(rejection.waitForExistence(timeout: 25),
                      "Supabase should reject an unknown account")
        attach(app, "3-sign-in-rejected")
        app.buttons["Cancel"].firstMatch.tap()
    }

    /// Google can't be completed without a Google account, but everything up
    /// to the browser handing over can: the button is there, and tapping it
    /// makes iOS ask permission to sign in — which only happens once the app
    /// has built a real authorization URL and opened a real auth session.
    @MainActor
    func testGoogleOpensAnAuthenticationSession() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-reset"]
        app.launch()

        let google = app.buttons["Continue with Google"]
        XCTAssertTrue(google.waitForExistence(timeout: 20), "the front door offers Google")
        attach(app, "0-welcome-with-google")
        google.tap()

        // The system's own consent alert, not ours.
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let consent = springboard.alerts.firstMatch
        XCTAssertTrue(consent.waitForExistence(timeout: 20),
                      "iOS asks before handing the sign-in to a browser")
        XCTAssertTrue(
            consent.staticTexts.matching(
                NSPredicate(format: "label CONTAINS[c] 'Sign In' OR label CONTAINS[c] 'supabase'")
            ).firstMatch.exists,
            "and the sheet names the sign-in it is about to open"
        )
        consent.buttons["Cancel"].tap()
        XCTAssertEqual(app.state, .runningForeground, "cancelling comes back to the app")
    }

    @MainActor
    func testGuestOnboardingReachesTheApp() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-reset"]
        app.launch()

        XCTAssertTrue(app.buttons["Look around as a guest"].waitForExistence(timeout: 20))
        app.buttons["Look around as a guest"].tap()

        // Step 1: sports.
        XCTAssertTrue(app.staticTexts["Pick your sports"].waitForExistence(timeout: 10))
        tapRow(app, "Baseball")
        tapRow(app, "Hockey")
        attach(app, "4-onboarding-sports")
        app.buttons["Continue"].tap()

        // Step 2: leagues — baseball pre-selects MLB.
        XCTAssertTrue(app.staticTexts["Choose your leagues"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Major League Baseball"].exists)
        XCTAssertTrue(app.staticTexts["National Hockey League"].exists)
        app.buttons["Continue"].tap()

        // Step 3: teams, from the live catalogue.
        XCTAssertTrue(app.staticTexts["Follow your teams"].waitForExistence(timeout: 10))
        XCTAssertTrue(row(app, "Arizona Diamondbacks").waitForExistence(timeout: 30),
                      "the team list loads from /api/teams")
        // The list is long and lazy, so narrow it — which also puts both
        // leagues on screen at once, each under its own heading.
        let search = app.textFields["Search teams"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("New York")
        XCTAssertTrue(app.staticTexts["MLB"].waitForExistence(timeout: 5), "teams are grouped by league")
        XCTAssertTrue(app.staticTexts["NHL"].exists, "and every followed league gets its own block")
        attach(app, "5a-teams-by-league")
        let yankees = row(app, "New York Yankees")
        XCTAssertTrue(yankees.waitForExistence(timeout: 10), "search narrows the list")
        yankees.tap()
        attach(app, "5-onboarding-teams")
        app.buttons["Continue"].tap()

        // Step 4: players, from that team's roster.
        XCTAssertTrue(app.staticTexts["Star your players"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["NEW YORK YANKEES"].waitForExistence(timeout: 30),
                      "the roster loads for the team just followed")
        attach(app, "6-onboarding-players")
        app.buttons["Finish"].tap()

        // Done screen, then the app.
        XCTAssertTrue(app.staticTexts["You're all set"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.descendants(matching: .any)["Setup complete"].exists,
                      "the check draws itself on the Done screen")
        attach(app, "7-done")
        app.buttons["Open Frontrow"].tap()

        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 15), "the tabs open")
        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 15))
        attach(app, "8-app")

        // And the picks are what the app is showing.
        app.tabBars.buttons["Teams"].tap()
        XCTAssertTrue(app.staticTexts["New York Yankees"].waitForExistence(timeout: 30),
                      "the team picked during onboarding is the one on the Teams tab")
        attach(app, "9-teams-from-onboarding")

        // Settings knows this is a guest and offers the way out.
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Guest"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Exit guest mode"].exists)
        attach(app, "10-settings-guest")
    }

    /// Pick rows combine a name and a detail line, so their accessibility
    /// label is both — match on the part that identifies the row.
    @MainActor
    private func row(_ app: XCUIApplication, _ name: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", name)).firstMatch
    }

    @MainActor
    private func tapRow(_ app: XCUIApplication, _ name: String) {
        let element = row(app, name)
        XCTAssertTrue(element.waitForExistence(timeout: 10), "\(name) row should exist")
        element.tap()
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
