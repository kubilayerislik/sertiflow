import { redirect } from 'next/navigation';

export default async function KursSablonRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/kurslar/${id}/ayarlar/sablon`);
}
