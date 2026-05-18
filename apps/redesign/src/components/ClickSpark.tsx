'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react'

type Spark = {
  x: number
  y: number
  angle: number
  startTime: number
}

type ClickSparkProps = {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  easing?: 'linear' | 'ease-in' | 'ease-in-out' | 'ease-out'
  extraScale?: number
  className?: string
  children: ReactNode
}

export type ClickSparkHandle = {
  sparkAt: (x: number, y: number) => void
}

const ClickSpark = forwardRef<ClickSparkHandle, ClickSparkProps>(function ClickSpark(
  {
    sparkColor = '#fff',
    sparkSize = 10,
    sparkRadius = 15,
    sparkCount = 8,
    duration = 400,
    easing = 'ease-out',
    extraScale = 1,
    className,
    children,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sparksRef = useRef<Spark[]>([])

  const addSparks = useCallback(
    (x: number, y: number) => {
      const now = performance.now()
      const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      }))

      sparksRef.current.push(...newSparks)
    },
    [sparkCount]
  )

  useImperativeHandle(ref, () => ({ sparkAt: addSparks }), [addSparks])

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement

    if (!canvas || !parent) {
      return
    }

    let resizeTimeout: ReturnType<typeof setTimeout>

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const scaledWidth = Math.round(width * dpr)
      const scaledHeight = Math.round(height * dpr)

      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth
        canvas.height = scaledHeight
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }
    }

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 100)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(parent)
    resizeCanvas()

    return () => {
      resizeObserver.disconnect()
      clearTimeout(resizeTimeout)
    }
  }, [])

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case 'linear':
          return t
        case 'ease-in':
          return t * t
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        default:
          return t * (2 - t)
      }
    },
    [easing]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx) {
      return
    }

    let animationId = 0

    const draw = (timestamp: number) => {
      const dpr = window.devicePixelRatio || 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime

        if (elapsed >= duration) {
          return false
        }

        const progress = elapsed / duration
        const eased = easeFunc(progress)
        const distance = eased * sparkRadius * extraScale
        const lineLength = sparkSize * (1 - eased)
        const x1 = (spark.x + distance * Math.cos(spark.angle)) * dpr
        const y1 = (spark.y + distance * Math.sin(spark.angle)) * dpr
        const x2 = (spark.x + (distance + lineLength) * Math.cos(spark.angle)) * dpr
        const y2 = (spark.y + (distance + lineLength) * Math.sin(spark.angle)) * dpr

        ctx.strokeStyle = sparkColor
        ctx.lineWidth = 2 * dpr
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        return true
      })

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(animationId)
  }, [duration, easeFunc, extraScale, sparkColor, sparkRadius, sparkSize])

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    addSparks(event.clientX - rect.left, event.clientY - rect.top)
  }

  return (
    <div className={className} onClick={handleClick}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 8,
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  )
})

export default ClickSpark
