import { useEffect, useState } from 'react'

interface Props {
  value: number | undefined
  /** blur 時に確定。空欄は undefined。不正入力は元に戻す。 */
  onCommit: (n: number | undefined) => void
  className?: string
  placeholder?: string
  inputMode?: 'decimal' | 'numeric'
  ariaLabel?: string
}

// 入力中は文字列で保持し、blur で数値に確定する共通フィールド。
// 「クリア→再入力」や小数（12.5）の途中入力を邪魔しない。
export default function NumberField({
  value,
  onCommit,
  className,
  placeholder,
  inputMode = 'decimal',
  ariaLabel,
}: Props) {
  const [s, setS] = useState(value?.toString() ?? '')
  useEffect(() => setS(value?.toString() ?? ''), [value])

  const commit = () => {
    if (s === '') return onCommit(undefined)
    const n = Number(s)
    if (Number.isNaN(n)) return setS(value?.toString() ?? '') // 不正なら元に戻す
    onCommit(n)
  }

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={s}
      onChange={(e) => setS(e.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  )
}
