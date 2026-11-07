import { Programs as ProgramsSection } from '@/components/programs/Programs'
import { useOverlays } from '@/lib/overlays'

export default function ProgramsPage() {
  const { openProgram } = useOverlays()
  return <ProgramsSection onDetails={openProgram} />
}
