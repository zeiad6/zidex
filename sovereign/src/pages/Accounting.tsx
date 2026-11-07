import { Accounting as AccountingSection } from '@/components/accounting/Accounting'
import { useOverlays } from '@/lib/overlays'
import { getPost } from '@/lib/posts'

export default function AccountingPage() {
  const { openArticle } = useOverlays()
  return (
    <AccountingSection
      onReadArticle={() => {
        const post = getPost('yusr')
        if (post) openArticle(post)
      }}
    />
  )
}
