import MonthClientPage from "./month-client-page"

export async function generateStaticParams() {
  return Array.from({ length: 12 }, (_, i) => ({
    month: String(i + 1),
  }))
}

export default async function MonthPage({
  params,
}: {
  params: Promise<{ month: string }>
}) {
  const resolvedParams = await params
  return <MonthClientPage params={resolvedParams} />
}
