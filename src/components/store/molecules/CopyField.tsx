import { CopyButton } from '@/components/ui/Primitives'

/** Molecule: a labelled value the buyer must copy exactly (wallet, amount, reference). */
export function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-sunken flex items-center gap-3 rounded-2xl p-3">
      <div className="min-w-0 flex-1">
        <p className="text-subtle text-[11px] font-semibold">{label}</p>
        <p className={mono ? 'text-app mt-0.5 font-mono text-[13px] break-all' : 'text-app mt-0.5 font-bold'} dir="ltr">
          {value}
        </p>
      </div>
      <CopyButton value={value} className="shrink-0" />
    </div>
  )
}
