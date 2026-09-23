import { useEffect, useRef, useState } from 'react'

export function CountUp({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number
  prefix?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      previous.current = value
      setDisplay(value)
      return
    }
    const start = previous.current
    const end = value
    previous.current = end
    if (start === end) return
    const duration = 480
    const startedAt = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      setDisplay(Math.round(start + (end - start) * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <span>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}
