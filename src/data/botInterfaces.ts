/** مولّد من bot-suite/src/data.ts عبر scripts/stage-bot-suite.mjs — لا تعدّله يدوياً.
 *  كل بوت معروض للبيع له واجهة رسومية على /bot-suite/ — القائمة هنا بوّابتها. */
export const BOT_INTERFACE_SKUS: readonly string[] = ['store-bot-basic', 'store-bot-pro', 'store-bot-hosting', 'group-bot', 'support-bot', 'booking-bot', 'subs-bot', 'quiz-bot', 'ai-bot', 'multibot-crm', 'workflow-engine', 'whatsapp-bot-pro']

/** هل لهذا الـSKU واجهة رسومية على /bot-suite/؟ */
export const hasBotInterface = (sku: string): boolean => BOT_INTERFACE_SKUS.includes(sku)
