import { BentoMatrix } from '@/components/matrix/BentoMatrix'
import { useOverlays } from '@/lib/overlays'

export default function Solutions() {
  const { openOrder } = useOverlays()
  return <BentoMatrix onOrder={openOrder} />
}
