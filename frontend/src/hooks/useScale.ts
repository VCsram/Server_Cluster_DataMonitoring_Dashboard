import { useEffect } from 'react'

interface AutofitOptions {
  designWidth?: number
  designHeight?: number
  el?: string
}

export function useScale({ designWidth = 1920, designHeight = 1080, el = '#dashboard-root' }: AutofitOptions = {}) {
  useEffect(() => {
    const root = document.querySelector(el) as HTMLElement | null
    if (!root) return

    const resize = () => {
      const ww = window.innerWidth
      const wh = window.innerHeight
      const scaleX = ww / designWidth
      const scaleY = wh / designHeight
      const scale = Math.min(scaleX, scaleY)
      root.style.transform = `scale(${scale})`
      root.style.transformOrigin = 'left top'
      root.style.width = `${designWidth}px`
      root.style.height = `${designHeight}px`
      const offsetX = (ww - designWidth * scale) / 2
      const offsetY = (wh - designHeight * scale) / 2
      root.style.marginLeft = `${offsetX}px`
      root.style.marginTop = `${offsetY}px`
      window.dispatchEvent(new Event('resize'))
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [designWidth, designHeight, el])
}
