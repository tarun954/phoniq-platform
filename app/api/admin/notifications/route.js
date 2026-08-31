import { NextResponse } from "next/server";
import { getPlatformContext } from "@/lib/admin/auth";

export async function GET() {
  try {
    const { admin, user } = await getPlatformContext();

    const { data, error } = await admin
      .from("platform_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      notifications: data || [],
      unread: (data || []).filter((item) => !item.read).length,
    });
  } catch (error) {
    const status = Number(error?.status) >= 400 ? Number(error.status) : 500;
    return NextResponse.json({ success:false, error:error?.message || "Unable to load notifications." }, { status });
  }
}

export async function PATCH(request) {
  try {
    const { admin, user } = await getPlatformContext();
    const body = await request.json();

    let query = admin
      .from("platform_notifications")
      .update({ read: true })
      .eq("user_id", user.id);

    if (body?.id) query = query.eq("id", body.id);
    else query = query.eq("read", false);

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success:true });
  } catch (error) {
    const status = Number(error?.status) >= 400 ? Number(error.status) : 500;
    return NextResponse.json({ success:false, error:error?.message || "Unable to update notification." }, { status });
  }
}
