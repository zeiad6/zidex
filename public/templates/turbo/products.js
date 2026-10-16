/** كتالوج المنتجات — البيانات الوحيدة التي يديرها صاحب المتجر.
 *  كل نص مرتين (ar/en) والسعر بالدولار. توصيل مؤمّن بعد الطلب.
 *  cat: 'bots' = إطارات · 'tools' = جنوط · 'subs' = إكسسوارات (معرّفات داخلية). */
export const PRODUCTS = [
    {
        id: 1, kind: 'tire', cat: 'bots', price: 320, old: 399,
        badge: { ar: 'الأكثر طلباً', en: 'Best seller' },
        name: { ar: 'إطار أداء HSR R20', en: 'HSR R20 Performance Tire' },
        desc: {
            ar: 'إطار صيفي عالي الأداء بتماسك استثنائي على الجاف والمبلل، وجدار جانبي معزّز يتحمّل القيادة الرياضية.',
            en: 'A high-performance summer tire with exceptional grip on dry and wet, and a reinforced sidewall built for spirited driving.',
        },
        specs: [{ ar: '255/50 R20', en: '255/50 R20' }, { ar: 'رياضي', en: 'Sport' }, { ar: 'ضمان 5 سنوات', en: '5-yr warranty' }],
        meta: { ar: 'طقم 4 إطارات · تركيب وموازنة مجاناً', en: 'Set of 4 · free fitting & balancing' },
    },
    {
        id: 2, kind: 'tire', cat: 'bots', price: 260,
        badge: { ar: 'طرق وعرة', en: 'All-terrain' },
        name: { ar: 'إطار الطرق الوعرة AT', en: 'AT All-Terrain Tire' },
        desc: {
            ar: 'نمط مداس عدواني للطين والرمل والصخور، مع ثبات مريح على الإسفلت — للمغامرة بلا تنازل.',
            en: 'An aggressive tread for mud, sand and rock with comfortable on-road stability — adventure without compromise.',
        },
        specs: [{ ar: '265/70 R17', en: '265/70 R17' }, { ar: '4x4', en: '4x4' }, { ar: 'جدار معزّز', en: 'Reinforced' }],
        meta: { ar: 'طقم 4 إطارات · توصيل مؤمّن', en: 'Set of 4 · insured delivery' },
    },
    {
        id: 3, kind: 'wheel', cat: 'tools', price: 374, old: 430,
        badge: { ar: 'جديد', en: 'New' },
        name: { ar: 'جنط رياضي سبائكي 18"', en: 'Sport Alloy Wheel 18"' },
        desc: {
            ar: 'جنط ألمنيوم مصبوب خفيف الوزن بتصميم 5 أذرع رياضي، طلاء ماسي مقاوم للتآكل — يقلّل الوزن غير المعلّق.',
            en: 'A lightweight cast-aluminium wheel with a sporty 5-spoke design and a corrosion-resistant diamond finish — cuts unsprung weight.',
        },
        specs: [{ ar: '18" × 8J', en: '18" × 8J' }, { ar: '5×114.3', en: '5×114.3' }, { ar: 'فضي ماسي', en: 'Diamond silver' }],
        meta: { ar: 'السعر للجنط الواحد · طقم 4 متاح', en: 'Price per wheel · set of 4 available' },
    },
    {
        id: 4, kind: 'wheel', cat: 'tools', price: 339,
        name: { ar: 'جنط كروم لامع 20"', en: 'Polished Chrome Wheel 20"' },
        desc: {
            ar: 'لمعان كروم مرآوي يلفت الأنظار، بنية متينة تتحمّل الطرق اليومية مع حضور فاخر لا يُخطئه أحد.',
            en: 'A mirror-chrome shine that turns heads, with a sturdy build for daily roads and an unmistakable premium presence.',
        },
        specs: [{ ar: '20" × 9J', en: '20" × 9J' }, { ar: '5×120', en: '5×120' }, { ar: 'كروم مصقول', en: 'Polished chrome' }],
        meta: { ar: 'السعر للجنط الواحد', en: 'Price per wheel' },
    },
    {
        id: 5, kind: 'wheel', cat: 'tools', price: 369,
        badge: { ar: 'الأكثر طلباً', en: 'Popular' },
        name: { ar: 'جنط مطفي أسود 19"', en: 'Matte Black Wheel 19"' },
        desc: {
            ar: 'أسود مطفي عميق بتصميم متداخل الأذرع، مظهر عدواني أنيق يناسب الدفع الرباعي والسيدان الرياضي.',
            en: 'Deep matte black with an interlocking spoke design — an aggressive yet refined look for SUVs and sport sedans.',
        },
        specs: [{ ar: '19" × 8.5J', en: '19" × 8.5J' }, { ar: '5×112', en: '5×112' }, { ar: 'أسود مطفي', en: 'Matte black' }],
        meta: { ar: 'السعر للجنط الواحد', en: 'Price per wheel' },
    },
    {
        id: 6, kind: 'brake', cat: 'subs', price: 90,
        name: { ar: 'طقم فحمات فرامل سيراميك', en: 'Ceramic Brake Pad Set' },
        desc: {
            ar: 'فحمات سيراميك هادئة وقليلة الغبار بأداء كبح ثابت وعمر أطول — راحة ويقين في كل توقّف.',
            en: 'Quiet, low-dust ceramic pads with consistent braking and a longer life — comfort and confidence at every stop.',
        },
        specs: [{ ar: 'أمامي', en: 'Front axle' }, { ar: 'سيراميك', en: 'Ceramic' }, { ar: 'قليل الغبار', en: 'Low dust' }],
        meta: { ar: 'طقم محور كامل · ملحقات التركيب', en: 'Full-axle set · fitting hardware' },
    },
    {
        id: 7, kind: 'light', cat: 'subs', price: 140,
        badge: { ar: 'الأفضل', en: 'Top pick' },
        name: { ar: 'طقم إضاءة LED أمامية', en: 'LED Headlight Kit' },
        desc: {
            ar: 'ضوء أبيض نهاري ساطع وتبديد حراري فعّال وعمر طويل — رؤية أوضح ليلاً بتركيب مباشر بلا تعديل.',
            en: 'Bright daylight-white output, effective heat dissipation and long life — clearer night vision with plug-and-play fitment.',
        },
        specs: [{ ar: '6500K', en: '6500K' }, { ar: 'H11 / 9005', en: 'H11 / 9005' }, { ar: 'تركيب مباشر', en: 'Plug & play' }],
        meta: { ar: 'طقم مصباحين · ضمان سنتين', en: 'Pair · 2-year warranty' },
    },
    {
        id: 8, kind: 'mat', cat: 'subs', price: 55,
        name: { ar: 'دواسات مطاطية فاخرة', en: 'Premium Rubber Floor Mats' },
        desc: {
            ar: 'مطاط ثقيل بحواف مرتفعة تحبس الماء والطين، مقاسات مفصّلة لسيارتك وتثبيت لا ينزلق.',
            en: 'Heavy-duty rubber with raised edges that trap water and mud, custom-fit to your car with no-slip anchoring.',
        },
        specs: [{ ar: 'طقم 4 قطع', en: 'Set of 4' }, { ar: 'مطاط ثقيل', en: 'Heavy rubber' }, { ar: 'مقاس مفصّل', en: 'Custom fit' }],
        meta: { ar: 'يُفصَّل حسب موديل سيارتك', en: 'Tailored to your car model' },
    },
];
