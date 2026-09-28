import { useEffect } from 'react'

const HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap'
const ID = 'zidex-reading-font'

/**
 * Article bodies get a serif reading face, the interface keeps the sans.
 * That is the one place on the site where a two-family split earns its
 * weight: prose runs for a few thousand words, where a face designed for
 * reading holds attention better than one designed for interfaces.
 *
 * The stylesheet is injected on the article routes only. The home page, the
 * link grid and the program list never open a long article, so making them
 * download two more families to style three words of body copy would be the
 * exact mistake the site criticises elsewhere.
 */
export function useReadingFont() {
  useEffect(() => {
    if (document.getElementById(ID)) return

    const preconnect = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].map((href) => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = href
      link.crossOrigin = ''
      document.head.appendChild(link)
      return link
    })

    const link = document.createElement('link')
    link.id = ID
    link.rel = 'stylesheet'
    link.href = HREF
    document.head.appendChild(link)

    return () => {
      link.remove()
      for (const node of preconnect) node.remove()
    }
  }, [])
}
