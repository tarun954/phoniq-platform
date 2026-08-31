import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/admin/auth";

export async function GET() {
  try {
    const { admin } =
      await requirePlatformPermission("platform_user.view");

    const { data: users, error } = await admin
      .from("platform_users")
      .select("user_id,role,active,created_at")
      .order("created_at",{ascending:true});

    if(error) throw error;

    return NextResponse.json({success:true,users:users||[]});
  } catch(error) {
    const status =
      Number(error?.status) >= 400 && Number(error?.status) <= 599
        ? Number(error.status)
        : 500;

    return NextResponse.json(
      {success:false,error:error?.message||"Unable to load Phoniq team."},
      {status}
    );
  }
}
