import { redirect } from 'next/navigation';

export default async function KursDuzenleRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/kurslar/${id}/ayarlar`);
}
