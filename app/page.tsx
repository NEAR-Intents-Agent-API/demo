import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth/session";

export default async function RootPage() {
  redirect((await currentSession()) ? "/agents" : "/login");
}
