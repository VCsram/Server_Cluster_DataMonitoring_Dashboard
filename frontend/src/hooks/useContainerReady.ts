import { useEffect, useRef } from 'react'

/** 等待容器有尺寸后再执行回调，避免 ECharts 初始化时宽高为 0 */
export function useContainerReady(callback: () => void | (() => void), deps: unknown[]) {
  const cleanupRef = useRef<(() => void) | void>(undefined)

  useEffect(() => {
    let frame = 0
    let cancelled = false

    const run = () => {
      if (cancelled) return
      cleanupRef.current?.()
      cleanupRef.current = callback()
    }

    const wait = () => {
      frame = requestAnimationFrame(() => {
        if (cancelled) return
        const el = document.getElementById('dashboard-root')
        if (el && el.offsetHeight > 0) {
          run()
        } else {
          wait()
        }
      })
    }

    wait()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      cleanupRef.current?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
