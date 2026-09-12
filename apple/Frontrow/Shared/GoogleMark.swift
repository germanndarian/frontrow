import SwiftUI

/// Google's G, drawn from the four paths of the official mark rather than
/// approximated with arcs. It keeps its own colours in both appearances —
/// Google's guidelines don't allow recolouring it — so the button behind it
/// carries the theme instead: white in light, a raised dark surface in dark.
enum GoogleLogo {
    /// The blue segment.
    static func blue(in rect: CGRect) -> Path {
        var path = Path()
        let s = min(rect.width, rect.height) / 48
        path.move(to: CGPoint(x: rect.minX + 45.12 * s, y: rect.minY + 24.50 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 44.72 * s, y: rect.minY + 20.00 * s), control1: CGPoint(x: rect.minX + 45.12 * s, y: rect.minY + 22.94 * s), control2: CGPoint(x: rect.minX + 44.98 * s, y: rect.minY + 21.44 * s))
        path.addLine(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 20.00 * s))
        path.addLine(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 28.51 * s))
        path.addLine(to: CGPoint(x: rect.minX + 35.84 * s, y: rect.minY + 28.51 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 31.45 * s, y: rect.minY + 35.15 * s), control1: CGPoint(x: rect.minX + 35.33 * s, y: rect.minY + 31.26 * s), control2: CGPoint(x: rect.minX + 33.78 * s, y: rect.minY + 33.59 * s))
        path.addLine(to: CGPoint(x: rect.minX + 31.45 * s, y: rect.minY + 40.67 * s))
        path.addLine(to: CGPoint(x: rect.minX + 38.56 * s, y: rect.minY + 40.67 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 45.12 * s, y: rect.minY + 24.50 * s), control1: CGPoint(x: rect.minX + 42.72 * s, y: rect.minY + 36.84 * s), control2: CGPoint(x: rect.minX + 45.12 * s, y: rect.minY + 31.20 * s))
        path.closeSubpath()
        return path
    }

    /// The green segment.
    static func green(in rect: CGRect) -> Path {
        var path = Path()
        let s = min(rect.width, rect.height) / 48
        path.move(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 46.00 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 38.56 * s, y: rect.minY + 40.67 * s), control1: CGPoint(x: rect.minX + 29.94 * s, y: rect.minY + 46.00 * s), control2: CGPoint(x: rect.minX + 34.92 * s, y: rect.minY + 44.03 * s))
        path.addLine(to: CGPoint(x: rect.minX + 31.45 * s, y: rect.minY + 35.15 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 37.25 * s), control1: CGPoint(x: rect.minX + 29.48 * s, y: rect.minY + 36.47 * s), control2: CGPoint(x: rect.minX + 26.96 * s, y: rect.minY + 37.25 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 11.69 * s, y: rect.minY + 28.18 * s), control1: CGPoint(x: rect.minX + 18.27 * s, y: rect.minY + 37.25 * s), control2: CGPoint(x: rect.minX + 13.42 * s, y: rect.minY + 33.38 * s))
        path.addLine(to: CGPoint(x: rect.minX + 4.34 * s, y: rect.minY + 28.18 * s))
        path.addLine(to: CGPoint(x: rect.minX + 4.34 * s, y: rect.minY + 33.88 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 46.00 * s), control1: CGPoint(x: rect.minX + 7.96 * s, y: rect.minY + 41.07 * s), control2: CGPoint(x: rect.minX + 15.40 * s, y: rect.minY + 46.00 * s))
        path.closeSubpath()
        return path
    }

    /// The yellow segment.
    static func yellow(in rect: CGRect) -> Path {
        var path = Path()
        let s = min(rect.width, rect.height) / 48
        path.move(to: CGPoint(x: rect.minX + 11.69 * s, y: rect.minY + 28.18 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 11.00 * s, y: rect.minY + 24.00 * s), control1: CGPoint(x: rect.minX + 11.25 * s, y: rect.minY + 26.86 * s), control2: CGPoint(x: rect.minX + 11.00 * s, y: rect.minY + 25.45 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 11.69 * s, y: rect.minY + 19.82 * s), control1: CGPoint(x: rect.minX + 11.00 * s, y: rect.minY + 22.55 * s), control2: CGPoint(x: rect.minX + 11.25 * s, y: rect.minY + 21.14 * s))
        path.addLine(to: CGPoint(x: rect.minX + 11.69 * s, y: rect.minY + 14.12 * s))
        path.addLine(to: CGPoint(x: rect.minX + 4.34 * s, y: rect.minY + 14.12 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 2.00 * s, y: rect.minY + 24.00 * s), control1: CGPoint(x: rect.minX + 2.85 * s, y: rect.minY + 17.09 * s), control2: CGPoint(x: rect.minX + 2.00 * s, y: rect.minY + 20.45 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 4.34 * s, y: rect.minY + 33.88 * s), control1: CGPoint(x: rect.minX + 2.00 * s, y: rect.minY + 27.55 * s), control2: CGPoint(x: rect.minX + 2.85 * s, y: rect.minY + 30.91 * s))
        path.addLine(to: CGPoint(x: rect.minX + 11.69 * s, y: rect.minY + 28.18 * s))
        path.closeSubpath()
        return path
    }

    /// The red segment.
    static func red(in rect: CGRect) -> Path {
        var path = Path()
        let s = min(rect.width, rect.height) / 48
        path.move(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 10.75 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 32.41 * s, y: rect.minY + 14.04 * s), control1: CGPoint(x: rect.minX + 27.23 * s, y: rect.minY + 10.75 * s), control2: CGPoint(x: rect.minX + 30.13 * s, y: rect.minY + 11.86 * s))
        path.addLine(to: CGPoint(x: rect.minX + 38.72 * s, y: rect.minY + 7.73 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 2.00 * s), control1: CGPoint(x: rect.minX + 34.91 * s, y: rect.minY + 4.18 * s), control2: CGPoint(x: rect.minX + 29.93 * s, y: rect.minY + 2.00 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 4.34 * s, y: rect.minY + 14.12 * s), control1: CGPoint(x: rect.minX + 15.40 * s, y: rect.minY + 2.00 * s), control2: CGPoint(x: rect.minX + 7.96 * s, y: rect.minY + 6.93 * s))
        path.addLine(to: CGPoint(x: rect.minX + 11.69 * s, y: rect.minY + 19.82 * s))
        path.addCurve(to: CGPoint(x: rect.minX + 24.00 * s, y: rect.minY + 10.75 * s), control1: CGPoint(x: rect.minX + 13.42 * s, y: rect.minY + 14.62 * s), control2: CGPoint(x: rect.minX + 18.27 * s, y: rect.minY + 10.75 * s))
        path.closeSubpath()
        return path
    }
}

struct GoogleMark: View {
    var size: CGFloat = 18

    var body: some View {
        Canvas { context, canvasSize in
            let rect = CGRect(origin: .zero, size: canvasSize)
            context.fill(GoogleLogo.blue(in: rect), with: .color(Color(hex: 0x4285F4)))
            context.fill(GoogleLogo.green(in: rect), with: .color(Color(hex: 0x34A853)))
            context.fill(GoogleLogo.yellow(in: rect), with: .color(Color(hex: 0xFBBC05)))
            context.fill(GoogleLogo.red(in: rect), with: .color(Color(hex: 0xEA4335)))
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}
