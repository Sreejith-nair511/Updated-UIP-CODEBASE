import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const { userId } = await auth();
  // Signed in → go to dashboard, otherwise middleware will redirect to sign-in
  redirect(userId ? "/dashboard" : "/sign-in");
}
