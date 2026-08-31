import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const err = new Error("Sign in required.");
    err.status = 401;
    throw err;
  }

  const admin = createAdminClient();

  const { data: member, error: memberError } = await admin
    .from("organization_members")
    .select("id,organization_id,role,role_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) throw memberError;

  if (!member) {
    const err = new Error("No organization membership found.");
    err.status = 403;
    throw err;
  }

  let roleName = String(member.role || "member");
  let roleKey = roleName.toLowerCase();

  if (member.role_id) {
    const { data: role } = await admin
      .from("organization_roles")
      .select("name,role_key")
      .eq("id", member.role_id)
      .maybeSingle();

    if (role) {
      roleName = role.name;
      roleKey = String(role.role_key || "").toLowerCase();
    }
  }

  return { supabase, admin, user, member, roleName, roleKey };
}

export async function GET() {
  try {
    const { admin, user, member, roleName, roleKey } = await getContext();

    const [{ data: organization }, { data: profile }, { data: companyProfile }] =
      await Promise.all([
        admin.from("organizations").select("*").eq("id", member.organization_id).maybeSingle(),
        admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        admin.from("company_profiles").select("*").eq("organization_id", member.organization_id).maybeSingle(),
      ]);

    return NextResponse.json({
      success: true,
      canEdit: ["owner","admin"].includes(roleKey),
      role: { name: roleName, key: roleKey },
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || profile?.name || user.user_metadata?.full_name || "",
      },
      company: {
        id: member.organization_id,
        name: companyProfile?.company_name || organization?.name || "",
        businessType: companyProfile?.industry || companyProfile?.business_type || "",
        website: companyProfile?.website || "",
        mainPhone: companyProfile?.phone || companyProfile?.main_phone || "",
        serviceArea: companyProfile?.service_area || "",
        timezone: companyProfile?.timezone || "",
        supportEmail: companyProfile?.support_email || "",
        supportPhone: companyProfile?.support_phone || "",
      },
    });
  } catch (error) {
    const status = Number(error?.status) >= 400 ? Number(error.status) : 500;
    return NextResponse.json({ success:false, error:error?.message || "Unable to load settings." }, { status });
  }
}

export async function PATCH(request) {
  try {
    const { admin, user, member, roleKey } = await getContext();

    if (!["owner","admin"].includes(roleKey)) {
      return NextResponse.json(
        { success:false, error:"Your role has read-only settings access." },
        { status:403 }
      );
    }

    const body = await request.json();

    if (body?.user?.fullName !== undefined) {
      await admin.from("profiles").upsert(
        { id:user.id, email:user.email, full_name:String(body.user.fullName||"").trim() },
        { onConflict:"id" }
      );
    }

    if (body?.company) {
      const company = body.company;

      if (company.name !== undefined) {
        const { error } = await admin
          .from("organizations")
          .update({ name:String(company.name||"").trim() })
          .eq("id", member.organization_id);
        if (error) throw error;
      }

      const { error } = await admin
        .from("company_profiles")
        .upsert({
          organization_id:member.organization_id,
          company_name:company.name || null,
          industry:company.businessType || null,
          website:company.website || null,
          phone:company.mainPhone || null,
          service_area:company.serviceArea || null,
          timezone:company.timezone || null,
          support_email:company.supportEmail || null,
          support_phone:company.supportPhone || null,
        }, { onConflict:"organization_id" });

      if (error) throw error;
    }

    return NextResponse.json({ success:true });
  } catch (error) {
    const status = Number(error?.status) >= 400 ? Number(error.status) : 500;
    return NextResponse.json({ success:false, error:error?.message || "Unable to update settings." }, { status });
  }
}
