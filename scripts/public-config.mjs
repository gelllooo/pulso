export function assertPublicSupabaseKey(value) {
  if (!value) return;
  let privileged = value.startsWith("sb_secret_");
  if (value.split(".").length === 3) {
    try {
      const claims = JSON.parse(
        Buffer.from(value.split(".")[1], "base64url").toString("utf8"),
      );
      privileged ||= ["service_role", "supabase_admin"].includes(claims.role);
    } catch {
      /* Supabase validates malformed public keys when connecting. */
    }
  }
  if (privileged)
    throw new Error(
      "Refusing to bundle a privileged Supabase key. Use a publishable/anon key in VITE_ configuration.",
    );
}
