import Foundation

/// Talks to the deployed site's /api route handlers — the same ESPN proxy the
/// website uses, with the same server-side caching and normalisation.
struct APIClient: Sendable {
    static let production = URL(string: "https://frontrow-ten.vercel.app/api")!

    /// Points at production unless told otherwise, which is how the simulator
    /// is aimed at a dev server or a PR preview — either as a launch argument
    /// (`-api-base http://localhost:3000/api`) or, for `xcodebuild test`, as
    /// `TEST_RUNNER_FRONTROW_API_BASE=…`, which XCTest hands to the app with
    /// the prefix stripped.
    static let shared = APIClient(baseURL: baseOverride() ?? production)

    private static func baseOverride() -> URL? {
        let process = ProcessInfo.processInfo
        if let flag = process.arguments.firstIndex(of: "-api-base"),
           process.arguments.index(after: flag) < process.arguments.endIndex,
           let url = URL(string: process.arguments[process.arguments.index(after: flag)]) {
            return url
        }
        if let base = process.environment["FRONTROW_API_BASE"], let url = URL(string: base) {
            return url
        }
        return nil
    }

    let baseURL: URL
    private let session: URLSession
    // JSONDecoder isn't Sendable, so make one per call rather than store it.
    private var decoder: JSONDecoder { JSONDecoder() }

    init(baseURL: URL) {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        session = URLSession(configuration: config)
    }

    enum Failure: Error, LocalizedError {
        case http(Int)
        case upstream(String)

        var errorDescription: String? {
            switch self {
            case .http(let code): "The server answered \(code)."
            case .upstream(let message): message
            }
        }
    }

    func get<T: Decodable>(_ path: String, query: [String: String] = [:]) async throws -> T {
        var components = URLComponents(url: baseURL.appending(path: path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        var request = URLRequest(url: components.url!)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("frontrow-ios/1.0", forHTTPHeaderField: "User-Agent")
        let (data, response) = try await session.data(for: request)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(code) else {
            if let body = try? decoder.decode(APIErrorBody.self, from: data) {
                throw Failure.upstream(body.error.replacingOccurrences(of: "_", with: " "))
            }
            throw Failure.http(code)
        }
        return try decoder.decode(T.self, from: data)
    }
}

private struct APIErrorBody: Decodable {
    let error: String
}

/// ESPN dates come through as ISO strings, some without seconds
/// ("2026-03-27T23:15Z"). Try the strict form first, then the lenient ones.
enum ISODate {
    // The formatters are configured once and never mutated afterwards, which
    // is what makes sharing them across isolation domains safe.
    nonisolated(unsafe) private static let strict: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()
    nonisolated(unsafe) private static let fractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let noSeconds: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd'T'HH:mmX"
        return f
    }()

    static func parse(_ s: String) -> Date? {
        strict.date(from: s) ?? fractional.date(from: s) ?? noSeconds.date(from: s)
    }
}
