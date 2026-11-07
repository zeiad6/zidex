import { About as AboutSection } from '@/components/about/About'
import { ContactBand } from '@/components/about/ContactBand'

export default function AboutPage() {
  return (
    <>
      <AboutSection />
      <ContactBand compact />
    </>
  )
}
