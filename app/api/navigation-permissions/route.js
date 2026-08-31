import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALL_NAV = [
  "nav.overview","nav.hot_leads","nav.leads","nav.customers","nav.calls",
  "nav.appointments","nav.jobs","nav.followups","nav.conversations",
  "nav.resolved","nav.trash","nav.team","nav.settings","nav.support",
  "nav.sidebar_access"
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data:{ user }, error:authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success:false, error:"Sign in required." }, { status:401 });
    }

    const admin = createAdminClient();

    const { data:member, error:memberError } = await admin
      .from("organization_members")
      .select("id,organization_id,role,role_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) {
      return NextResponse.json({ success:false, error:"No organization membership found." }, { status:403 });
    }

    let roleKey = String(member.role || "").toLowerCase();

    if (member.role_id) {
      const { data:role } = await admin
        .from("organization_roles")
        .select("role_key")
        .eq("id", member.role_id)
        .maybeSingle();

      if (role?.role_key) roleKey = String(role.role_key).toLowerCase();
    }

    // Owner always keeps full client workspace visibility.
    if (roleKey === "owner") {
      return NextResponse.json({ success:true, permissionKeys:["*"], roleKey });
    }

    const keys = new Set();

    if (member.role_id) {
      const { data:rolePermissions, error } = await admin
        .from("organization_role_permissions")
        .select("organization_permissions(permission_key)")
        .eq("role_id", member.role_id);

      if (error) throw error;

      for (const row of rolePermissions || []) {
        const key = row.organization_permissions?.permission_key;
        if (key) keys.add(key);
      }
    }

    // If an older role has no nav.* rows yet, preserve the current UI instead of
    // suddenly hiding the entire sidebar. Owner can then customize per employee.
    const hasAnyNav = [...keys].some((key) => key.startsWith("nav."));
    if (!hasAnyNav) {
      for (const key of ALL_NAV) {
        if (key !== "nav.sidebar_access") keys.add(key);
      }
    }

    const { data:overrides, error:overrideError } = await admin
      .from("organization_member_navigation_overrides")
      .select("permission_key,allowed")
      .eq("organization_id", member.organization_id)
      .eq("member_id", member.id);

    if (overrideError) throw overrideError;

    for (const override of overrides || []) {
      if (override.allowed) keys.add(override.permission_key);
      else keys.delete(override.permission_key);
    }

    return NextResponse.json({
      success:true,
      roleKey,
      permissionKeys:[...keys]
    });
  } catch (error) {
    return NextResponse.json(
      { success:false, error:error?.message || "Unable to load navigation permissions." },
      { status:500 }
    );
  }
}
