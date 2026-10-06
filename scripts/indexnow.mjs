// Tell IndexNow engines (Bing, Yandex, Seznam, Naver…) about every URL in the sitemap.
// Google does not take IndexNow; it learns from Search Console and the sitemap.
//   node scripts/indexnow.mjs        # after a deploy that adds or changes pages
import { readdirSync, readFileSync } from 'node:fs'

const host = 'zeidexsoft.com'
const keyFile = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
const key = readFileSync(`public/${keyFile}`, 'utf8').trim()
const sitemap = await (await fetch(`https://${host}/sitemap.xml`)).text()
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${keyFile}`, urlList }),
})
console.log(`IndexNow: ${urlList.length} URLs → HTTP ${res.status}`)
