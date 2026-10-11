import { redirect } from "next/navigation";

export default function ManagePetsPage() {
  redirect("/dashboard?aba=animais");
}
