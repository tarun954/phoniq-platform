import crypto from "crypto";
import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/admin/auth";

const DEFAULT_ROLE_KEYS = [
  ["owner","Owner"],
  ["admin","Admin"],
  ["dispatcher","Dispatcher"],
  ["technician","Technician"],
  ["viewer","Viewer"],
];

const DEFAULT_ROLE_PERMISSIONS = {
  admin: ["*"],
  dispatcher: [
    "dashboard.view","lead.view","lead.update","lead.assign",
    "customer.view","customer.update","call.view","appointment.view",
    "appointment.create","appointment.update","job.view","job.create",
    "job.update","followup.view","followup.create","message.view","message.send"
  ],
  technician: [
    "dashboard.view","lead.view","customer.view","call.view",
    "appointment.view","job.view","job.update","followup.view","message.view"
  ],
  viewer: [
    "dashboard.view","lead.view","customer.view","call.view",
    "appointment.view","job.view","followup.view","message.view"
  ],
};

export async function POST(request) {
  try {
    const { admin, user } =
      await requirePlatformPermission("company.create");

    const body = await request.json();

    const companyName = String(body?.companyName || "").trim();
    const ownerEmail = String(body?.ownerEmail || "").trim().toLowerCase();

    if (!companyName) {
      return NextResponse.json(
        { success:false,error:"Company name is required." },
        { status:400 }
      );
    }

    if (!ownerEmail || !ownerEmail.includes("@")) {
      return NextResponse.json(
        { success:false,error:"A valid owner email is required." },
        { status:400 }
      );
    }

    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .insert({ name: companyName })
      .select("id,name,created_at")
      .single();

    if (organizationError) throw organizationError;

    // Optional company_profiles enrichment. If your table schema differs,
    // this should not block core tenant creation.
    try {
      await admin.from("company_profiles").insert({
        organization_id: organization.id,
        company_name: companyName,
        industry: body?.industry || null,
        website: body?.website || null,
        phone: body?.companyPhone || null,
        timezone: body?.timezone || null,
        primary_contact_name: body?.ownerName || null,
        primary_contact_email: ownerEmail,
        primary_contact_phone: body?.ownerPhone || null,
      });
    } catch (profileError) {
      console.warn("COMPANY PROFILE OPTIONAL INSERT:", profileError?.message);
    }

    const createdRoles = {};

    for (const [roleKey, roleName] of DEFAULT_ROLE_KEYS) {
      const { data: role, error: roleError } = await admin
        .from("organization_roles")
        .insert({
          organization_id: organization.id,
          name: roleName,
          role_key: roleKey,
          is_system: true,
        })
        .select("id,name,role_key")
        .single();

      if (roleError) throw roleError;
      createdRoles[roleKey] = role;
    }

    const { data: allPermissions, error: permissionsError } = await admin
      .from("organization_permissions")
      .select("id,permission_key");

    if (permissionsError) throw permissionsError;

    const permissionByKey = new Map(
      (allPermissions || []).map((p) => [p.permission_key,p.id])
    );

    for (const [roleKey, role] of Object.entries(createdRoles)) {
      if (roleKey === "owner") continue;

      let ids = [];

      if (DEFAULT_ROLE_PERMISSIONS[roleKey]?.includes("*")) {
        ids = (allPermissions || []).map((p) => p.id);
      } else {
        ids = (DEFAULT_ROLE_PERMISSIONS[roleKey] || [])
          .map((key) => permissionByKey.get(key))
          .filter(Boolean);
      }

      if (ids.length) {
        const { error } = await admin
          .from("organization_role_permissions")
          .insert(
            ids.map((permissionId) => ({
              role_id: role.id,
              permission_id: permissionId,
            }))
          );

        if (error) throw error;
      }
    }

    const token = crypto.randomBytes(32).toString("hex");

    const { data: invitation, error: invitationError } = await admin
      .from("organization_invitations")
      .insert({
        organization_id: organization.id,
        email: ownerEmail,
        role_id: createdRoles.owner.id,
        token,
        status: "pending",
        invited_by: user.id,
      })
      .select("id,email,status,expires_at")
      .single();

    if (invitationError) throw invitationError;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return NextResponse.json({
      success:true,
      company:organization,
      ownerInvitation:invitation,
      inviteUrl:`${baseUrl}/invite/${token}`,
    },{status:201});
  } catch (error) {
    console.error("ADMIN CREATE COMPANY ERROR:",error);

    const status =
      Number(error?.status) >= 400 && Number(error?.status) <= 599
        ? Number(error.status)
        : 500;

    return NextResponse.json(
      {success:false,error:error?.message||"Unable to create company."},
      {status}
    );
  }
}
