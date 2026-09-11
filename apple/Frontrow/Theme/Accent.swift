import SwiftUI

/// The accent palette, converted from the website's OKLCH tokens so a colour
/// chosen on one device looks the same on the other.
enum AccentId: String, Codable, Sendable, CaseIterable, Identifiable {
    case cobalt, emerald, violet, cyan, amber, crimson, rose

    var id: String { rawValue }

    var name: String { rawValue.capitalized }

    var color: Color { Color(hex: hex) }

    var hex: UInt32 {
        switch self {
        case .cobalt: 0x5298F9   // oklch(0.68 0.16 257)
        case .emerald: 0x00BC7F  // oklch(0.7 0.158 162)
        case .violet: 0x8C68F0   // oklch(0.62 0.196 292)
        case .cyan: 0x09B7DC     // oklch(0.72 0.13 220)
        case .amber: 0xEBB441    // oklch(0.8 0.142 82)
        case .crimson: 0xEB3653  // oklch(0.62 0.214 18)
        case .rose: 0xEE6183     // oklch(0.68 0.176 8)
        }
    }
}
