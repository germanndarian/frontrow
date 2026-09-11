import Foundation

/// Where one request has got to. Screens switch on this instead of juggling
/// separate `isLoading` and `error` flags.
enum Loadable<Value: Sendable>: Sendable {
    case loading
    case loaded(Value)
    case failed(String)

    var value: Value? {
        if case .loaded(let v) = self { return v }
        return nil
    }

    var errorMessage: String? {
        if case .failed(let m) = self { return m }
        return nil
    }

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }
}

/// Loads once per key and hands back what it already has on the next look —
/// the small piece of TanStack Query these screens actually use.
@MainActor
@Observable
final class Cache<Key: Hashable & Sendable, Value: Sendable> {
    private(set) var entries: [Key: Loadable<Value>] = [:]
    private var inFlight: Set<Key> = []
    private let load: @Sendable (Key) async throws -> Value

    init(load: @escaping @Sendable (Key) async throws -> Value) {
        self.load = load
    }

    subscript(key: Key) -> Loadable<Value> {
        entries[key] ?? .loading
    }

    /// Fetches unless it is already loaded or in flight; `force` re-fetches.
    func fetch(_ key: Key, force: Bool = false) async {
        if !force, entries[key]?.value != nil || inFlight.contains(key) { return }
        if force { entries[key] = .loading }
        inFlight.insert(key)
        defer { inFlight.remove(key) }
        do {
            entries[key] = .loaded(try await load(key))
        } catch {
            entries[key] = .failed(error.localizedDescription)
        }
    }
}
