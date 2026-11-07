import { Hero } from '@/components/hero/Hero'
import { SectionIndex } from '@/components/home/SectionIndex'
import { TrialBand } from '@/components/home/TrialBand'
import { LatestJournal } from '@/components/home/LatestJournal'
import { ContactBand } from '@/components/about/ContactBand'

export default function Home() {
  return (
    <>
      <Hero />
      <SectionIndex />
      <TrialBand />
      <LatestJournal />
      <ContactBand compact />
    </>
  )
}
