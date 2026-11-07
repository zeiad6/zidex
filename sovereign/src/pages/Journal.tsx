import { Journal as JournalSection } from '@/components/journal/Journal'
import { useOverlays } from '@/lib/overlays'

export default function JournalPage() {
  const { openArticle } = useOverlays()
  return <JournalSection onOpen={openArticle} />
}
