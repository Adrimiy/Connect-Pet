import { redirect } from "next/navigation";

interface PaginaAdocaoProps {
  params: Promise<{ id: string }>;
}

export default async function PaginaAdocaoLegada({ params }: PaginaAdocaoProps) {
  const { id } = await params;
  redirect(`/pets/${encodeURIComponent(id)}`);
}
