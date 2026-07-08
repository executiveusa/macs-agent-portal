import * as React from "react"

const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
}

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large-desktop' | 'ultra-wide'

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(() => {
    if (typeof window === "undefined") return 'desktop'
    const width = window.innerWidth
    if (width < BREAKPOINTS.md) return 'mobile'
    if (width < BREAKPOINTS.lg) return 'tablet'
    if (width < BREAKPOINTS['2xl']) return 'desktop'
    if (width < BREAKPOINTS['3xl']) return 'large-desktop'
    return 'ultra-wide'
  })

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      let type: DeviceType
      if (width < BREAKPOINTS.md) type = 'mobile'
      else if (width < BREAKPOINTS.lg) type = 'tablet'
      else if (width < BREAKPOINTS['2xl']) type = 'desktop'
      else if (width < BREAKPOINTS['3xl']) type = 'large-desktop'
      else type = 'ultra-wide'
      setDeviceType(type)
    }

    const handleResize = () => updateDeviceType()
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return deviceType
}

export function useViewportWidth(): number {
  const [width, setWidth] = React.useState(() => {
    if (typeof window === "undefined") return 1024
    return window.innerWidth
  })

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
}

export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const width = useViewportWidth()
  return width >= BREAKPOINTS[breakpoint]
}
