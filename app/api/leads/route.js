import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/leads
 *
 * Supported examples:
 *
 * /api/leads
 * /api/leads?status=resolved
 * /api/leads?priority=hot
 * /api/leads?status=new&priority=hot
 *
 * This route ONLY returns leads that belong
 * to the logged-in user's organization.
 */
export async function GET(request) {
  try {
    /*
     * STEP 1
     * Verify the logged-in Supabase user.
     */
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "GET /api/leads auth error:",
        userError
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          leads: [],
        },
        {
          status: 401,
        }
      );
    }

    /*
     * STEP 2
     * Use the admin client only after authentication.
     */
    const admin = createAdminClient();

    /*
     * STEP 3
     * Find which organization this user belongs to.
     */
    const {
      data: membership,
      error: membershipError,
    } = await admin
      .from("organization_members")
      .select(
        `
        organization_id,
        role
        `
      )
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "GET /api/leads membership error:",
        membershipError
      );

      throw membershipError;
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No organization membership found for this user.",
          leads: [],
        },
        {
          status: 404,
        }
      );
    }

    const organizationId =
      membership.organization_id;

    /*
     * STEP 4
     * Read filters from the URL.
     */
    const { searchParams } =
      new URL(request.url);

    const status =
      searchParams.get("status");

    const priority =
      searchParams.get("priority");

    const includeDeleted =
      searchParams.get("includeDeleted") ===
      "true";

    /*
     * STEP 5
     * Build the lead query.
     *
     * We intentionally query leads first and
     * customers separately below.
     *
     * This prevents Supabase relationship
     * configuration from breaking the API.
     */
    let leadQuery = admin
      .from("leads")
      .select("*")
      .eq(
        "organization_id",
        organizationId
      )
      .order("created_at", {
        ascending: false,
      });

    /*
     * Normal CRM pages should not display
     * soft-deleted leads.
     */
    if (!includeDeleted) {
      leadQuery =
        leadQuery.is(
          "deleted_at",
          null
        );
    }

    /*
     * Optional status filter.
     *
     * Example:
     * /api/leads?status=resolved
     */
    if (status) {
      leadQuery =
        leadQuery.eq(
          "status",
          status
        );
    }

    /*
     * Optional priority filter.
     *
     * Example:
     * /api/leads?priority=hot
     */
    if (priority) {
      leadQuery =
        leadQuery.eq(
          "priority",
          priority
        );
    }

    const {
      data: leadRows,
      error: leadsError,
    } = await leadQuery;

    if (leadsError) {
      console.error(
        "GET /api/leads Supabase lead error:",
        leadsError
      );

      throw leadsError;
    }

    const leads = leadRows || [];

    /*
     * Nothing else needs to be fetched
     * when there are no leads.
     */
    if (leads.length === 0) {
      return NextResponse.json({
        success: true,
        leads: [],
      });
    }

    /*
     * STEP 6
     * Get all customer IDs associated
     * with the returned leads.
     */
    const customerIds = [
      ...new Set(
        leads
          .map(
            (lead) =>
              lead.customer_id
          )
          .filter(Boolean)
      ),
    ];

    let customers = [];

    if (customerIds.length > 0) {
      const {
        data: customerRows,
        error: customersError,
      } = await admin
        .from("customers")
        .select(
          `
          id,
          organization_id,
          full_name,
          phone,
          city,
          service_address
          `
        )
        .eq(
          "organization_id",
          organizationId
        )
        .in(
          "id",
          customerIds
        );

      if (customersError) {
        console.error(
          "GET /api/leads customer error:",
          customersError
        );

        throw customersError;
      }

      customers =
        customerRows || [];
    }

    /*
     * STEP 7
     * Create a lookup map.
     */
    const customerMap =
      new Map(
        customers.map(
          (customer) => [
            customer.id,
            customer,
          ]
        )
      );

    /*
     * STEP 8
     * Attach the nested customer object
     * expected by the CRM frontend.
     */
    const result =
      leads.map(
        (lead) => ({
          ...lead,

          customer:
            lead.customer_id
              ? customerMap.get(
                  lead.customer_id
                ) || null
              : null,
        })
      );

    /*
     * STEP 9
     * Return JSON.
     */
    return NextResponse.json({
      success: true,
      leads: result,
    });
  } catch (error) {
    console.error(
      "GET /api/leads error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load leads.",
        leads: [],
      },
      {
        status: 500,
      }
    );
  }
}