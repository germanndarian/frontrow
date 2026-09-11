import Foundation

/// Where the account lives. Both values are the public, client-side pair the
/// website already ships in every page it serves: the anon key is designed to
/// be seen, and Row-Level Security — not secrecy — is what keeps one account's
/// rows out of another's reach. Rotating the project means changing these.
enum SupabaseConfig {
    static let url = URL(string: "https://mpcjfjznphtjykwgvxam.supabase.co")!
    static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wY2pmanpucGh0anlrd2d2eGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTYxOTMsImV4cCI6MjA5NjQ5MjE5M30.TubxoI5O-KQpWHPaHQnQ1YI1odvnkto5ko4u2hVCrgA"
}
