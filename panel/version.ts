/** تكيّف النسخة الجديدة: عامل الخدمة يب nesionr كل النسخ المخزّنة عند كل نشر
 *  (CACHE_VERSION في sw.js)، وهنا نُكمل الدائرة من جهة العميل.
 *
 *  المشكلة التي يحلّها: زائر عنده عامل خدمة قديم نشط يظل يرى هيكل التطبيق القديم
 *  حتى يُغلق الصفحة ويعيدها — فيبدو «النشر لم يحدث» رغم أن الشبكة تخدم الجديد.
 *  عندما يستلم المتصفح عاملاً جديداً (controllerchange) نُعيد التحميل مرة واحدة،
 *  بحارس في sessionStorage حتى لا تدور الصفحة على نفسها. */
export function adoptNewVersion(): void {
  if (!('serviceWorker' in navigator)) return
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    // حارس: إعادة تحميل واحدة لكل جلسة تبويب، لا حلقة
    try {
      if (sessionStorage.getItem('tma-reloaded') === '1') return
      sessionStorage.setItem('tma-reloaded', '1')
    } catch {
      /* تخزين معطل — نُحمّل مرة واحدة على أي حال */
    }
    reloading = true
    window.location.reload()
  })
}
