/**
 * External marketplaces.
 *
 * The shop on this site is the primary place to buy: Stars checkout inside
 * Telegram, or a bank transfer on the product page, both handled by us.
 * These are the *other* venues where the same kind of digital goods change
 * hands — Telegram collectibles on Fragment's own market, and the forums
 * that trade accounts, channels and usernames.
 *
 * Two things are deliberate here, and both matter for honesty:
 *
 *   · Every card links to the platform's own page. A card never claims to
 *     be an official ZeidexSoft storefront on someone else's forum, and it
 *     never invents a listing URL — if the operator has a storefront there,
 *     it is filled in `storefront`, and the card links to that instead.
 *   · The deal happens on the platform, under its rules, its escrow and its
 *     fees. This site takes no payment and offers no guarantee for a
 *     transaction it never saw, so the card says so where it counts.
 */

export type Marketplace = {
  id: string
  name: string
  /** One line on what the venue actually is. */
  blurb: string
  blurbEn: string
  href: string
  /**
   * The operator's own storefront on that platform. Left null until it is
   * filled in — a guessed profile URL would ship a dead link to every
   * visitor, and on a marketplace a dead link costs more than no link.
   */
  storefront?: string | null
  /** What you can actually buy there. */
  sells: string
  sellsEn: string
  /** What it costs to sell there, as of the month in `feeChecked`. */
  fee: string
  feeEn: string
  /** Escrow / buyer protection — or the honest absence of it. */
  escrow: string
  escrowEn: string
  tone: 'violet' | 'teal' | 'amber' | 'rose'
  feeChecked: string
}

export const MARKETPLACES: Marketplace[] = [
  {
    id: 'fragment',
    name: 'Fragment',
    blurb:
      'سوق تيليجرام الرسمي على شبكة TON: أسماء مستخدمين وأرقام وهدايا NFT ونجوم واشتراك Premium.',
    blurbEn:
      "Telegram's own market on the TON chain: collectible usernames, numbers, NFT gifts, Stars and Premium.",
    href: 'https://fragment.com/',
    storefront: null,
    sells: 'أسماء المستخدمين المجمّعة والأرقام والهدايا ونجوم تيليجرام',
    sellsEn: 'Collectible usernames, anonymous numbers, NFT gifts and Telegram Stars',
    fee: 'عمولة 5٪ على كل عملية بيع، إضافةً إلى نحو 1 GRAM رسوم شبكة',
    feeEn: '5% platform fee per sale, plus roughly 1 GRAM of network fee',
    escrow: 'التسوية على السلسلة نفسها: لا وسيط ولا استرداد بعد تحويل الملكية',
    escrowEn: 'Settled on-chain: no middleman, and no reversal once ownership moves',
    tone: 'violet',
    feeChecked: '2026-10',
  },
  {
    id: 'playerup',
    name: 'PlayerUp',
    blurb:
      'منتدى عالمي لتداول الحسابات الرقمية، مع خدمة وساطة اختيارية تكفل الدفع والتسليم للطرفين.',
    blurbEn:
      'A global forum for trading digital accounts, with an optional middleman service that guarantees both payment and delivery.',
    href: 'https://www.playerup.com/',
    storefront: null,
    sells: 'حسابات يوتيوب وإنستغرام وديسكورد، وقنوات لها جمهور جاهز',
    sellsEn: 'YouTube, Instagram and Discord accounts, and channels with a ready audience',
    fee: 'النشر في المنتدى مجاني؛ رسوم الوساطة تبدأ من 3٪ وتنخفض مع درجة العضوية',
    feeEn: 'Forum posting is free; middleman fees start at 3% and drop with membership tier',
    escrow: 'الوساطة تغطي استرداد المبلغ (chargeback)، أما المنتج فينتقل خارجها',
    escrowEn: 'The middleman covers chargebacks, but the goods themselves move outside it',
    tone: 'teal',
    feeChecked: '2026-10',
  },
  {
    id: 'epicnpc',
    name: 'EpicNPC',
    blurb:
      'منتدى تجارة أصول رقمية بمنتديات فرعية لكل لعبة، ونظام وساطة خاص به اسم «Trade Guardian».',
    blurbEn:
      'A long-running asset-trading forum with a sub-forum per game and its own middleman system, "Trade Guardian".',
    href: 'https://www.epicnpc.com/',
    storefront: null,
    sells: 'حسابات الألعاب وعملاتها وخدمات رفع المستوى (boosting)',
    sellsEn: 'Game accounts, in-game currency and boosting services',
    fee: 'النشر مجاني؛ ورسوم الوسيط يحدّدها الوسيط المعتمد ولا تُنشر رقماً ثابتاً',
    feeEn: 'Posting is free; the middleman sets its own fee, and no fixed number is published',
    escrow: 'الوساطة شرط لفتح أي نزاع — بلاها لا يحقق المنتدى في الطلب',
    escrowEn: 'The middleman is required to open a dispute; without it the forum will not investigate',
    tone: 'amber',
    feeChecked: '2026-10',
  },
  {
    id: 'fameswap',
    name: 'Fameswap',
    blurb:
      'متجر متخصص بالحسابات التي لها جمهور فعلي، مع escrow إلزامي في كل صفقة.',
    blurbEn:
      'A storefront specialised in accounts that already carry a real audience, with mandatory escrow on every sale.',
    href: 'https://fameswap.com/',
    storefront: null,
    sells: 'حسابات إنستغرام وتيك توك ويوتيوب مع متابعين وتفاعل',
    sellsEn: 'Instagram, TikTok and YouTube accounts with followers and engagement',
    fee: 'رسوم الـ escrow: 5٪ من السعر أو 50 دولاراً كحد أدنى، أيهما أكبر (3٪ للأعضاء المميزين)',
    feeEn: 'Escrow fee: 5% of the price or a $50 floor, whichever is larger (3% for premium members)',
    escrow: 'الـ escrow إلزامي، لكنه لا يغطي استرجاع الأصل بعد تسليمه',
    escrowEn: 'Escrow is mandatory, but it does not cover the asset being reclaimed after delivery',
    tone: 'rose',
    feeChecked: '2026-10',
  },
]

/** Deep links on Fragment, for the intents a card cannot express on its own. */
export const FRAGMENT_STARS = 'https://fragment.com/stars/buy'
export const FRAGMENT_USERNAMES = 'https://fragment.com/username'
export const FRAGMENT_GIFTS = 'https://fragment.com/gifts'