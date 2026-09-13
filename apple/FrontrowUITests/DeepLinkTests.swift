import XCTest

/// A widget names one game, and the app opens that game rather than dropping
/// you on the scoreboard to find it again. The URL arrives here as a launch
/// argument — a test can't hand the app a home-screen tap — but it takes the
/// same path through the app as the real thing.
final class DeepLinkTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testAGameLinkOpensThatGame() throws {
        // A real game from the same feed the app reads, so the id is one the
        // scoreboard will actually be holding when the link resolves.
        let game = try todaysGame()

        let app = XCUIApplication()
        app.launchArguments = [
            "-ui-testing-sample",
            "-ui-testing-url", "frontrow://game/\(game.id)",
        ]
        app.launch()

        // The link is answered once the board has loaded, which is after the
        // app has finished launching — the sheet waits for it.
        XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout: 40),
                      "the game's sheet came up on its own")
        let sheet = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS %@", game.home)).firstMatch
        XCTAssertTrue(sheet.waitForExistence(timeout: 10),
                      "and it is the game the link named")
        attach(app, "1-opened-from-widget")

        app.buttons["Done"].tap()
        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 10),
                      "closing it leaves you on the scoreboard")
    }

    @MainActor
    func testAScoresLinkJustOpensTheScoreboard() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-sample", "-ui-testing-url", "frontrow://scores"]
        app.launch()

        XCTAssertTrue(app.navigationBars["Live & Upcoming"].waitForExistence(timeout: 30))
        XCTAssertFalse(app.buttons["Done"].exists, "no sheet, because no game was named")
    }

    // MARK: - The feed

    private struct Fixture {
        let id: String
        let home: String
    }

    /// The first game on today's board, straight from the app's own API.
    private func todaysGame() throws -> Fixture {
        let url = URL(string: "https://frontrow-ten.vercel.app/api/scoreboard?leagues=mlb")!
        var result: Result<Fixture, Error>?
        let done = expectation(description: "scoreboard")
        URLSession.shared.dataTask(with: url) { data, _, error in
            defer { done.fulfill() }
            if let error { result = .failure(error); return }
            do {
                let games = try JSONSerialization.jsonObject(with: data ?? Data()) as? [[String: Any]]
                guard let first = games?.first,
                      let id = first["id"] as? String,
                      let home = first["home"] as? [String: Any],
                      let name = home["displayName"] as? String
                else { throw XCTSkip("the board is empty today") }
                result = .success(Fixture(id: id, home: name))
            } catch {
                result = .failure(error)
            }
        }.resume()
        wait(for: [done], timeout: 30)
        return try XCTUnwrap(result).get()
    }

    @MainActor
    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
