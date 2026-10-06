import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'

export function SignaturePad({
  onChange,
}: {
  onChange: (dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const snapshot = canvas.toDataURL()
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#1a1406'
      const image = new Image()
      image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height)
      image.src = snapshot
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = event.currentTarget.getContext('2d')
    if (!ctx) return
    drawing.current = true
    const { x, y } = point(event)
    ctx.beginPath()
    ctx.moveTo(x, y)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = event.currentTarget.getContext('2d')
    if (!ctx) return
    const { x, y } = point(event)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false
    onChange(event.currentTarget.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="h-44 w-full touch-none rounded-2xl border border-line bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <Button type="button" variant="ghost" onClick={clear}>
        Clear signature
      </Button>
    </div>
  )
}
