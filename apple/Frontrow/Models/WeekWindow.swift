import Foundation

/// One week of the schedule. Offsets run from last week into the season
/// ahead, so the strip reads "Last week · This week · Next week · Sep 28 …".
struct WeekWindow: Identifiable, Hashable, Sendable {
    let offset: Int
    let start: Date
    let end: Date

    var id: Int { offset }

    /// The window the app opens on, and the ones on either side of it.
    static let offsets = Array(-1...16)

    static func all(from now: Date = .now, calendar: Calendar = .current) -> [WeekWindow] {
        offsets.compactMap { make(offset: $0, from: now, calendar: calendar) }
    }

    static func make(offset: Int, from now: Date = .now, calendar: Calendar = .current) -> WeekWindow? {
        guard let thisWeek = calendar.dateInterval(of: .weekOfYear, for: now),
              let start = calendar.date(byAdding: .weekOfYear, value: offset, to: thisWeek.start),
              let end = calendar.date(byAdding: .day, value: 6, to: start)
        else { return nil }
        return WeekWindow(offset: offset, start: start, end: end)
    }

    /// What the chip says. The near weeks get words; the rest get their date.
    var label: String {
        switch offset {
        case -1: "Last week"
        case 0: "This week"
        case 1: "Next week"
        default: start.formatted(.dateTime.month(.abbreviated).day())
        }
    }

    /// "Sep 14 – 20", or "Sep 28 – Oct 4" when the week straddles a month.
    var range: String {
        let sameMonth = Calendar.current.isDate(start, equalTo: end, toGranularity: .month)
        let from = start.formatted(.dateTime.month(.abbreviated).day())
        let to = sameMonth
            ? end.formatted(.dateTime.day())
            : end.formatted(.dateTime.month(.abbreviated).day())
        return "\(from) – \(to)"
    }

    /// "20260914-20260920", the window the scoreboard API takes.
    var query: String {
        "\(Self.stamp(start))-\(Self.stamp(end))"
    }

    private static func stamp(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d%02d%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    func contains(_ date: Date) -> Bool {
        date >= start && date < Calendar.current.date(byAdding: .day, value: 1, to: end)!
    }
}
