import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Hard-deletes the signed-in user's account. Deleting an auth user requires the
 * service-role key, which only exists server-side — so this runs here, never in
 * the browser. The user's rows cascade away via the foreign keys in the schema.
 *
 * The website authenticates with its session cookie; the iOS app has no cookie
 * jar, so it sends the same session as a bearer token instead. Either way the
 * token is verified by Supabase before anything is deleted.
 */
export async function DELETE(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Account deletion isn't configured." },
      { status: 500 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } },
  );

  const bearer = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  const supabase = bearer ? null : await createClient();
  const {
    data: { user },
  } = bearer
    ? await admin.auth.getUser(bearer)
    : await supabase!.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The app clears its own keychain session; the website needs its cookie gone.
  await supabase?.auth.signOut();
  return NextResponse.json({ ok: true });
}
