/** نفس عقد لوحة التحكم: عامل خدمة جديد ⇒ إعادة تحميل واحدة.
 *  بلا هذا يظل زائر بعامل قديم يرى الهيكل القديم بعد النشر. */
export function adoptNewVersion() {
    if (!('serviceWorker' in navigator))
        return;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading)
            return;
        try {
            if (sessionStorage.getItem('suite-reloaded') === '1')
                return;
            sessionStorage.setItem('suite-reloaded', '1');
        }
        catch {
            /* تخزين معطل */
        }
        reloading = true;
        window.location.reload();
    });
}
