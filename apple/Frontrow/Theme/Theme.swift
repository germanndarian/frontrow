import SwiftUI
import UIKit

/// Semantic colours, taken from the web app's tokens: light is the cobalt
/// theme that matches the homepage, dark the original midnight look. Each
/// follows the system appearance automatically.
enum Theme {
    static let accent = Color(hex: 0x3C82E6)

    static let background = dynamic(light: 0xF1F1EC, dark: 0x0F1622)
    static let background2 = dynamic(light: 0xEAE9E4, dark: 0x161D2A)
    static let surface = dynamic(light: 0xFFFFFF, dark: 0x1A2130)
    static let surface2 = dynamic(light: 0xF1F0EA, dark: 0x222A3A)
    static let line = dynamic(light: 0xE6E5DF, dark: 0x2C3446)
    static let lineSoft = dynamic(light: 0xEEEDE8, dark: 0x252D3D)
    static let ink = dynamic(light: 0x131313, dark: 0xF4F5F7)
    static let muted = dynamic(light: 0x46464A, dark: 0xB4BAC6)
    static let faint = dynamic(light: 0x8C8C86, dark: 0x7E8696)
    static let live = dynamic(light: 0xD8392E, dark: 0xF05A4C)
    static let win = dynamic(light: 0x1F9D5C, dark: 0x3FCB84)
    static let loss = dynamic(light: 0xD1393A, dark: 0xF06A5E)
    static let gold = dynamic(light: 0xC58A1E, dark: 0xE2B153)

    private static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

extension Color {
    init(hex: UInt32) { self.init(UIColor(hex: hex)) }

    /// Team colours arrive as "#rrggbb" strings from the API.
    init?(cssHex: String) {
        var s = cssHex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(hex: v)
    }
}
