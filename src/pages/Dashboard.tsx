import { useI18n } from '@/lib/i18n'
import { Users, Eye, Play, Percent, TrendingUp, TrendingDown, Clock, Video, Activity, BarChart2 } from 'lucide-react'
import { useEffect } from 'react'

export default function Dashboard() {
  const { t } = useI18n()

  useEffect(() => {
    document.title = t('لوحة التحكم', 'Dashboard')
  }, [t])

  return (
    <div className="container-app flex flex-col gap-6 py-6 lg:py-8">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-app text-2xl font-black">{t('لوحة تحكم صانع المحتوى', 'Creator Dashboard')}</h1>
          <p className="text-subtle mt-1 text-[13px]">{t('مؤشرات الأداء الرئيسية والتحليلات الخاصة بك', 'Your key performance indicators and analytics')}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <select className="border-app bg-elevated rounded-md px-3 py-1.5 focus:ring-accent focus:outline-none">
            <option>{t('اخر 7 ايام', 'Last 7 Days')}</option>
            <option>{t('اخر 28 يوم', 'Last 28 Days')}</option>
            <option>{t('مخصص', 'Custom')}</option>
          </select>
        </div>
      </div>
      
      {/* North Star KPIs Top Row (Golden Triangle) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Reach / Impressions (Golden Triangle Top Left) */}
        <div className="border-app bg-elevated shadow-app rounded-card p-5">
          <div className="flex items-center gap-3 mb-2 text-subtle">
            <Activity className="size-4" />
            <span className="text-sm font-medium">{t('إجمالي الوصول', 'Total Reach')}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">892.4K</span>
            <span className="text-emerald-500 text-xs font-medium flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="size-3" /> +24.5%
            </span>
          </div>
        </div>
        
        {/* KPI 2: Engagement Rate */}
        <div className="border-app bg-elevated shadow-app rounded-card p-5">
          <div className="flex items-center gap-3 mb-2 text-subtle">
            <Percent className="size-4" />
            <span className="text-sm font-medium">{t('معدل التفاعل', 'Engagement Rate')}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">14.2%</span>
            <span className="text-emerald-500 text-xs font-medium flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="size-3" /> +1.2%
            </span>
          </div>
        </div>

        {/* KPI 3: Follower Growth */}
        <div className="border-app bg-elevated shadow-app rounded-card p-5">
          <div className="flex items-center gap-3 mb-2 text-subtle">
            <Users className="size-4" />
            <span className="text-sm font-medium">{t('نمو المتابعين', 'Follower Growth')}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">12.4K</span>
            <span className="text-rose-500 text-xs font-medium flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded">
              <TrendingDown className="size-3" /> -5.2%
            </span>
          </div>
        </div>

        {/* KPI 4: Video Views */}
        <div className="border-app bg-elevated shadow-app rounded-card p-5">
          <div className="flex items-center gap-3 mb-2 text-subtle">
            <Eye className="size-4" />
            <span className="text-sm font-medium">{t('مشاهدات الفيديو', 'Video Views')}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">1.2M</span>
            <span className="text-emerald-500 text-xs font-medium flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="size-3" /> +18.4%
            </span>
          </div>
        </div>
      </div>

      {/* Content Effectiveness Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-app bg-elevated shadow-app rounded-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-subtle mb-1">
              <Play className="size-4" />
              <span className="text-sm font-medium">{t('معدل إكمال الفيديو', 'Video Completion Rate')}</span>
            </div>
            <span className="text-xl font-bold">48.5%</span>
          </div>
          <div className="h-12 w-24 bg-ghost-50 rounded flex items-end overflow-hidden">
            <div className="h-[48%] w-full bg-indigo-500" />
          </div>
        </div>

        <div className="border-app bg-elevated shadow-app rounded-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-subtle mb-1">
              <Clock className="size-4" />
              <span className="text-sm font-medium">{t('متوسط وقت المشاهدة', 'Average Watch Time')}</span>
            </div>
            <span className="text-xl font-bold">14s</span>
          </div>
          <div className="text-emerald-500 text-sm font-medium flex items-center gap-1">
            <TrendingUp className="size-4" /> +2s
          </div>
        </div>
      </div>

      {/* Middle Row: Trends & Audience */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border-app bg-elevated shadow-app rounded-card p-5 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-app font-bold">{t('اتجاهات النمو', 'Growth Trends')}</h2>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-accent text-accent-fg rounded">{t('مشاهدات', 'Views')}</button>
              <button className="text-xs px-2 py-1 bg-ghost-100 text-subtle rounded hover:text-app">{t('تفاعل', 'Engagement')}</button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-app rounded-lg bg-ghost-50/50">
            <span className="text-subtle text-sm flex items-center gap-2">
              <BarChart2 className="size-5" />
              {t('مساحة الرسم البياني (بيانات تفاعلية)', 'Chart Area (Interactive Line Chart)')}
            </span>
          </div>
        </div>

        {/* Audience Overview */}
        <div className="border-app bg-elevated shadow-app rounded-card p-5 flex flex-col">
          <h2 className="text-app font-bold mb-4">{t('رؤى الجمهور', 'Audience Insights')}</h2>
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-subtle">{t('إناث', 'Female')}</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="h-2 w-full bg-ghost-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-pink-400 w-[65%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-subtle">{t('ذكور', 'Male')}</span>
                <span className="font-medium">35%</span>
              </div>
              <div className="h-2 w-full bg-ghost-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-400 w-[35%]" />
              </div>
            </div>
            <div className="pt-4 border-t border-app mt-auto">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-500">
                  <Clock className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{t('أفضل وقت للنشر', 'Best Time to Post')}</p>
                  <p className="text-xs text-subtle">{t('الثلاثاء، 8:00 مساءً', 'Tuesday, 8:00 PM')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Content Performance Comparison */}
      <div className="border-app bg-elevated shadow-app rounded-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-app font-bold">{t('تحليل أداء المحتوى', 'Content Performance Analysis')}</h2>
          <button className="text-accent text-sm hover:underline">{t('عرض الكل', 'View All')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-app text-sm text-subtle rtl:text-right">
                <th className="pb-3 font-medium px-2">{t('الفيديو', 'Video')}</th>
                <th className="pb-3 font-medium px-2">{t('المشاهدات', 'Views')}</th>
                <th className="pb-3 font-medium px-2">{t('معدل الإكمال', 'Completion')}</th>
                <th className="pb-3 font-medium px-2">{t('الإعجابات', 'Likes')}</th>
                <th className="pb-3 font-medium px-2">{t('المشاركات', 'Shares')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-app last:border-0 hover:bg-ghost-50/50 transition-colors">
                <td className="py-3 px-2 flex items-center gap-3">
                  <div className="size-12 bg-ghost-100 rounded flex items-center justify-center text-ghost-400 shrink-0">
                    <Video className="size-5" />
                  </div>
                  <span className="font-medium truncate max-w-[200px]">{t('تحدي الرقص الجديد', 'New Dance Challenge')}</span>
                </td>
                <td className="py-3 px-2 font-medium">124.5K</td>
                <td className="py-3 px-2">52%</td>
                <td className="py-3 px-2 text-subtle">18.2K</td>
                <td className="py-3 px-2 text-subtle">3.4K</td>
              </tr>
              <tr className="border-b border-app last:border-0 hover:bg-ghost-50/50 transition-colors">
                <td className="py-3 px-2 flex items-center gap-3">
                  <div className="size-12 bg-ghost-100 rounded flex items-center justify-center text-ghost-400 shrink-0">
                    <Video className="size-5" />
                  </div>
                  <span className="font-medium truncate max-w-[200px]">{t('نصائح تصوير', 'Filming Tips')}</span>
                </td>
                <td className="py-3 px-2 font-medium">89.1K</td>
                <td className="py-3 px-2">64%</td>
                <td className="py-3 px-2 text-subtle">12.8K</td>
                <td className="py-3 px-2 text-subtle">1.2K</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
