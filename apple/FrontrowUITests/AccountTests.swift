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

        XCTAssertTrue(app.buttons["Get started for free"].waitForExistence(timeout: 20),
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

    /// Creating an account is a three-field form, so its sheet opens full
    /// height; signing in is two fields and keeps the half sheet. The sheet's
    /// own title bar is the measurement — near the top of the screen, or halfway
    /// down it.
    @MainActor
    func testSignUpOpensFullHeightAndSignInDoesNot() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-reset"]
        app.launch()

        let started = app.buttons["Get started for free"]
        XCTAssertTrue(started.waitForExistence(timeout: 20), "the front door says 'for free'")
        started.tap()

        let signUpBar = app.navigationBars["Get started"]
        XCTAssertTrue(signUpBar.waitForExistence(timeout: 10))
        let screen = app.windows.firstMatch.frame.height
        XCTAssertLessThan(signUpBar.frame.minY, screen * 0.2, "sign-up fills the screen")
        attach(app, "6-sign-up-full-height")
        app.buttons["Cancel"].tap()

        app.buttons["I already have an account"].tap()
        let signInBar = app.navigationBars["Sign in"]
        XCTAssertTrue(signInBar.waitForExistence(timeout: 10))
        XCTAssertGreaterThan(signInBar.frame.minY, screen * 0.3, "sign-in stays a half sheet")
        attach(app, "7-sign-in-half-sheet")
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

        // Baseball and hockey have one league each, so there is nothing to
        // choose between and the flow goes straight to teams.
        XCTAssertTrue(app.staticTexts["Follow your teams"].waitForExistence(timeout: 10),
                      "no league step when every sport has a single league")
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
        XCTAssertGreaterThan(app.keyboards.count, 0, "the keyboard is up while searching")
        attach(app, "4b-keyboard-up")
        yankees.tap()
        XCTAssertEqual(app.keyboards.count, 0, "and gone once a team is picked")
        attach(app, "5-onboarding-teams")
        app.buttons["Continue"].tap()

        // Step 4: players, from that team's roster.
        XCTAssertTrue(app.staticTexts["Star your players"].waitForExistence(timeout: 10))
        // The footer stays at the bottom of the screen rather than riding up
        // with the keyboard, so while typing it sits behind it — the return
        // key, a scroll or a pick are the ways back to it.
        let rosterSearch = app.textFields.firstMatch
        if rosterSearch.waitForExistence(timeout: 5) {
            rosterSearch.tap()
            rosterSearch.typeText("a")
            XCTAssertGreaterThan(app.keyboards.count, 0, "the keyboard is up while searching")
            let footer = app.buttons["Back"]
            XCTAssertFalse(footer.isHittable, "the footer doesn't jump above the keyboard")
            rosterSearch.typeText("\n")
            XCTAssertEqual(app.keyboards.count, 0, "return puts the keyboard away")
            XCTAssertTrue(footer.isHittable, "and the footer is back where it was")
            footer.tap()
            XCTAssertTrue(app.staticTexts["Follow your teams"].waitForExistence(timeout: 5),
                          "Back goes to the previous step")
            XCTAssertEqual(app.keyboards.count, 0, "with no keyboard in tow")
            app.buttons["Continue"].tap()
            XCTAssertTrue(app.staticTexts["Star your players"].waitForExistence(timeout: 10))
        }
        XCTAssertTrue(app.staticTexts["NEW YORK YANKEES"].waitForExistence(timeout: 30),
                      "the roster loads for the team just followed")
        attach(app, "6-onboarding-players")
        app.buttons["Finish"].tap()

        // Done screen, then the app.
        XCTAssertTrue(app.staticTexts["You're all set"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.descendants(matching: .any)["Setup complete"].exists,
                      "the check draws itself on the Done screen")
        attach(app, "7-done")
        // Tapped near the edge of the button, away from the words.
        let open = app.buttons["Open Frontrow"]
        XCTAssertTrue(open.waitForExistence(timeout: 5))
        open.coordinate(withNormalizedOffset: CGVector(dx: 0.06, dy: 0.5)).tap()

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
