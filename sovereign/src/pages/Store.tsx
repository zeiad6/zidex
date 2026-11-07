import { Store as StoreSection } from '@/components/store/Store'
import { useOverlays } from '@/lib/overlays'

export default function StorePage() {
  const { openOrder } = useOverlays()
  return <StoreSection onOrder={openOrder} />
}
