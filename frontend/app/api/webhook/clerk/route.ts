import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string | null;
    last_name: string | null;
    primary_email_address_id: string;
  };
}

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Webhook secret not configured" }, { status: 200 });
  }

  const headerPayload = headers();
  const svix_id        = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body    = JSON.stringify(payload);

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { type, data } = event;

  const primaryEmail =
    data.email_addresses.find(e => e.id === data.primary_email_address_id)?.email_address
    ?? data.email_addresses[0]?.email_address;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

  if (type === "user.created") {
    const insertData: UserInsert = {
      id: data.id, email: primaryEmail, full_name: fullName,
      role: "viewer", notifications_enabled: true, zone_access: null, push_token: null,
    };
    await (supabase.from("users") as any).upsert(insertData, { onConflict: "id" });
  }

  if (type === "user.updated") {
    await (supabase.from("users") as any)
      .update({ email: primaryEmail, full_name: fullName })
      .eq("id", data.id);
  }

  if (type === "user.deleted") {
    await supabase.from("users").delete().eq("id", data.id);
  }

  return NextResponse.json({ message: "OK" }, { status: 200 });
}
