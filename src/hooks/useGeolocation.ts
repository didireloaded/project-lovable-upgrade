/**
 * Legacy shim — all callers now share the ONE watchPosition registered in GeoProvider.
 * Import useGeo from '@/contexts/GeoContext' for new code.
 */
export type { GeoState } from '@/contexts/GeoContext'
export { useGeo as useGeolocation } from '@/contexts/GeoContext'
