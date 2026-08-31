import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NAV_ITEMS = [
  ["nav.overview","Overview"],
  ["nav.hot_leads","Hot Leads"],
  ["nav.leads","Leads"],
  ["nav.customers","Customers"],
  ["nav.calls","Calls"],
  ["nav.appointments","Appointments"],
  ["nav.jobs","Jobs"],
  ["nav.followups","Follow-ups"],
  ["nav.conversations","Conversations"],
  ["nav.resolved","Resolved"],
  ["nav.trash","Trash"],
  ["nav.team","Team & Roles"],
  ["nav.settings","Settings"],
  ["nav.support","Support"]
];

async function context() {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();

  if (!user) {
    const error = new Error("Sign in required.");
    error.status = 401;
    throw error;
  }

  const admin = createAdminClient();

  const { data:me, error } = await admin
    .from("organization_members")
    .select("id,organization_id,role,role_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!me) {
    const e = new Error("No organization membership found.");
    e.status = 403;
    throw e;
  }

  let roleKey = String(me.role || "").toLowerCase();

  if (me.role_id) {
    const { data:role } = await admin
      .from("organization_roles")
      .select("role_key")
      .eq("id", me.role_id)
      .maybeSingle();

    if (role?.role_key) roleKey = String(role.role_key).toLowerCase();
  }

  if (!["owner","admin"].includes(roleKey)) {
    const e = new Error("Only the company Owner or Admin can manage employee sidebar access.");
    e.status = 403;
    throw e;
  }

  return { admin, user, me, roleKey };
}

export async function GET() {
  try {
    const { admin, me } = await context();

    const { data:members, error:memberError } = await admin
      .from("organization_members")
      .select("id,user_id,role,role_id,created_at")
      .eq("organization_id", me.organization_id)
      .order("created_at");

    if (memberError) throw memberError;

    const ids = (members || []).map(m => m.user_id).filter(Boolean);

    let profileMap = new Map();
    if (ids.length) {
      const { data:profiles } = await admin
        .from("profiles")
        .select("id,full_name,email")
        .in("id", ids);

      profileMap = new Map((profiles || []).map(p => [p.id,p]));
    }

    const { data:roles } = await admin
      .from("organization_roles")
      .select("id,name,role_key")
      .eq("organization_id", me.organization_id);

    const roleMap = new Map((roles || []).map(r => [r.id,r]));

    const { data:overrides, error:overrideError } = await admin
      .from("organization_member_navigation_overrides")
      .select("member_id,permission_key,allowed")
      .eq("organization_id", me.organization_id);

    if (overrideError) throw overrideError;

    const byMember = new Map();
    for (const row of overrides || []) {
      if (!byMember.has(row.member_id)) byMember.set(row.member_id,{});
      byMember.get(row.member_id)[row.permission_key] = Boolean(row.allowed);
    }

    return NextResponse.json({
      success:true,
      navigation:NAV_ITEMS.map(([key,label]) => ({ key,label })),
      members:(members || []).map(member => {
        const profile = profileMap.get(member.user_id) || {};
        const role = member.role_id ? roleMap.get(member.role_id) : null;
        const roleKey = String(role?.role_key || member.role || "").toLowerCase();

        return {
          id:member.id,
          userId:member.user_id,
          name:profile.full_name || "Team Member",
          email:profile.email || "",
          roleName:role?.name || member.role || "Member",
          roleKey,
          isOwner:roleKey === "owner",
          overrides:byMember.get(member.id) || {}
        };
      })
    });
  } catch (error) {
    const status = Number(error?.status) >= 400 ? Number(error.status) : 500;
    return NextResponse.json({ success:false, error:error?.message || "Unable to load sidebar access." }, { status });
  }
}

export async function PUT(request) {
  try {
    const { admin, user, me } = await context();
    const body = await request.json();
    const memberId = String(body?.memberId || "");
    const access = body?.access && typeof body.access === "object" ? body.access : {};

    const { data:target, error:targetError } = await admin
      .from("organization_members")
      .select("id,user_id,role,role_id")
      .eq("id", memberId)
      .eq("organization_id", me.organization_id)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) {
      return NextResponse.json({ success:false, error:"Employee not found." }, { status:404 });
    }

    let targetRoleKey = String(target.role || "").toLowerCase();
    if (target.role_id) {
      const { data:targetRole } = await admin
        .from("organization_roles")
        .select("role_key")
        .eq("id",target.role_id)
        .maybeSingle();
      if (targetRole?.role_key) targetRoleKey = String(targetRole.role_key).toLowerCase();
    }

    if (targetRoleKey === "owner") {
      return NextResponse.json({ success:false, error:"Owner always keeps the complete client sidebar." }, { status:400 });
    }

    const validKeys = new Set(NAV_ITEMS.map(([key]) => key));
    const rows = [];

    for (const [key,value] of Object.entries(access)) {
      if (!validKeys.has(key)) continue;
      rows.push({
        organization_id:me.organization_id,
        member_id:memberId,
        permission_key:key,
        allowed:Boolean(value),
        updated_by:user.id,
        updated_at:new Date().toISOString()
      });
    }

    if (rows.length) {
      const { error } = await admin
        .from("organization_member_navigation_overrides")
        .upsert(rows,{ onConflict:"member_id,permission_key" });

      if (error) throw error;
    }

    return NextResponse.json({ success:true });
  } catch (error) {
    const status = Number(error?.status) >= 400 ? Number(error.status) : 500;
    return NextResponse.json({ success:false, error:error?.message || "Unable to save sidebar access." }, { status });
  }
}
