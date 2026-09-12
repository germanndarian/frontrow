import SwiftUI

/// Email and password, in one sheet that does both jobs. Supabase keeps the
/// session in the keychain afterwards, so this is the last time you see it
/// until you sign out.
struct SignInSheet: View {
    enum Mode { case signIn, signUp }

    @Environment(Account.self) private var account
    @Environment(\.dismiss) private var dismiss
    @State var mode: Mode
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var error: String?
    @State private var notice: String?
    @State private var busy = false
    @FocusState private var focus: Field?

    private enum Field { case email, password, name }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(mode == .signIn ? "Welcome back." : "Make an account and your teams follow you everywhere.")
                        .font(.system(size: 15))
                        .foregroundStyle(Theme.muted)
                        .padding(.bottom, 2)

                    Button(action: google) {
                        HStack(spacing: 9) {
                            GoogleMark()
                            Text("Continue with Google")
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.surface, in: Capsule())
                        .overlay { Capsule().stroke(Theme.line, lineWidth: 1) }
                        .contentShape(Capsule())
                    }
                    .buttonStyle(PressableButtonStyle())
                    .disabled(busy)

                    HStack(spacing: 10) {
                        Rectangle().fill(Theme.line).frame(height: 1)
                        Text("or")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(Theme.faint)
                        Rectangle().fill(Theme.line).frame(height: 1)
                    }
                    .padding(.vertical, 2)

                    if mode == .signUp {
                        field("Name", text: $displayName, field: .name)
                            .textContentType(.name)
                    }
                    field("Email", text: $email, field: .email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    secureField

                    if let error {
                        Label(error, systemImage: "exclamationmark.triangle")
                            .font(.footnote)
                            .foregroundStyle(Theme.loss)
                    }
                    if let notice {
                        Label(notice, systemImage: "envelope")
                            .font(.footnote)
                            .foregroundStyle(Theme.muted)
                    }

                    Button(action: submit) {
                        HStack(spacing: 8) {
                            if busy { ProgressView().tint(.white) }
                            Text(mode == .signIn ? "Sign in" : "Create account")
                                .font(.system(size: 15, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Theme.accent.opacity(canSubmit ? 1 : 0.4), in: Capsule())
                        .contentShape(Capsule())
                    }
                    .buttonStyle(PressableButtonStyle())
                    .disabled(!canSubmit || busy)
                    .padding(.top, 4)

                    Button(mode == .signIn ? "New here? Create an account" : "Already have an account? Sign in") {
                        withAnimation(.snappy(duration: 0.2)) {
                            mode = mode == .signIn ? .signUp : .signIn
                            error = nil
                            notice = nil
                        }
                    }
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.accent)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 2)
                }
                .padding(18)
            }
            .background(Theme.background)
            .navigationTitle(mode == .signIn ? "Sign in" : "Get started")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        // Creating an account is a form with a name, an email and a password:
        // it wants the whole sheet. Signing in is two fields, so the half
        // sheet still fits it.
        .presentationDetents(mode == .signUp ? [.large] : [.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var canSubmit: Bool {
        email.contains("@") && password.count >= 6
    }

    private func field(_ label: String, text: Binding<String>, field: Field) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Eyebrow(label)
            TextField("", text: text)
                .font(.system(size: 16))
                .padding(.horizontal, 14)
                .padding(.vertical, 13)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(focus == field ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: 1)
                }
                .focused($focus, equals: field)
        }
    }

    private var secureField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Eyebrow("Password")
            SecureField("", text: $password)
                .font(.system(size: 16))
                .textContentType(mode == .signIn ? .password : .newPassword)
                .padding(.horizontal, 14)
                .padding(.vertical, 13)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(focus == .password ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: 1)
                }
                .focused($focus, equals: .password)
            Text("At least 6 characters.")
                .font(.system(size: 11.5))
                .foregroundStyle(Theme.faint)
        }
    }

    private func google() {
        busy = true
        error = nil
        notice = nil
        Task {
            error = await account.signInWithGoogle()
            busy = false
            if error == nil { dismiss() }
        }
    }

    private func submit() {
        busy = true
        error = nil
        notice = nil
        Task {
            if mode == .signIn {
                error = await account.signIn(email: email, password: password)
            } else {
                let result = await account.signUp(email: email, password: password, displayName: displayName)
                error = result.error
                if result.error == nil && result.needsConfirmation {
                    notice = "Check \(email.trimmed) for a confirmation link, then sign in."
                    mode = .signIn
                }
            }
            busy = false
            // A session means the gate has already swapped to the app behind us.
            if error == nil && notice == nil { dismiss() }
        }
    }
}
