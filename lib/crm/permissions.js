import { requireOrganization, jsonError } from "@/lib/crm/auth";

export class PermissionError extends Error {
  constructor(message="You do not have permission to perform this action.") {
    super(message);
    this.name="PermissionError";
    this.status=403;
  }
}

export async function getMemberAuthorization(context) {
  const { admin, user, organizationId } = context;

  const { data: member, error } = await admin
    .from("organization_members")
    .select(`
      id,user_id,organization_id,role,role_id,
      organization_roles(id,role_key,name,is_system)
    `)
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!member) throw new PermissionError("You are not a member of this organization.");

  const legacyRole=String(member.role||"").toLowerCase();

  if (!member.role_id && ["owner","admin"].includes(legacyRole)) {
    return { member, role:{role_key:legacyRole,name:legacyRole}, permissions:["*"] };
  }

  if (!member.role_id) {
    return { member, role:null, permissions:[] };
  }

  const { data: rows, error: pError } = await admin
    .from("organization_role_permissions")
    .select(`organization_permissions(permission_key)`)
    .eq("role_id", member.role_id);

  if (pError) throw pError;

  return {
    member,
    role: member.organization_roles || null,
    permissions:(rows||[])
      .map(row=>row.organization_permissions?.permission_key)
      .filter(Boolean)
  };
}

export async function requirePermission(permissionKey) {
  const context=await requireOrganization();
  const authorization=await getMemberAuthorization(context);

  if (
    !authorization.permissions.includes("*") &&
    !authorization.permissions.includes(permissionKey)
  ) {
    throw new PermissionError();
  }

  return { ...context, authorization };
}

export function permissionErrorResponse(error) {
  if (error?.status===401 || error?.status===403) {
    return jsonError(error.message,error.status);
  }

  console.error("PERMISSION ERROR:",error);
  return jsonError(error?.message || "Something went wrong.",500);
}
