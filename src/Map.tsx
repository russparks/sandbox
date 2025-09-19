import { Loader } from '@googlemaps/js-api-loader'
import { useEffect, useRef } from 'react'
import styles from './Map.module.css'
import { lightGrayStyle } from './mapStyles'
import type { Lead, Project } from './types'
import { STATUS_ICON, STATUS_TEXT, LEAD_ICON } from './icons'

type Props = {
  projects: Project[]
  leads: Lead[]
  showProjects: boolean
  showLeads: boolean
}

type MarkerWrapper = {
  type: 'project'|'lead'
  marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
  labelEl?: HTMLElement
}

export function MapView({ projects, leads, showProjects, showLeads }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<{
    map?: google.maps.Map
    markers: MarkerWrapper[]
    geocoder?: google.maps.Geocoder
    advancedMarker?: typeof google.maps.marker.AdvancedMarkerElement
  }>({ markers: [] })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
      const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined

      console.log("Using Map ID:", mapId);

      if (!apiKey) {
        console.error('Missing VITE_GOOGLE_MAPS_API_KEY')
        return
      }
      if (!mapId) {
        console.warn('No VITE_GOOGLE_MAPS_MAP_ID set. Using local greyscale raster style.')
      }

      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['marker', 'geocoding', 'places'],
      })
      const { Map } = await loader.importLibrary('maps')
      const { AdvancedMarkerElement } = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary

      if (cancelled || !mapRef.current) return

      const map = new Map(mapRef.current, {
        mapId: mapId || undefined,
        center: { lat: 53.8008, lng: -1.5491 },
        zoom: 7,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles: mapId ? undefined : (lightGrayStyle as any),
      })
      stateRef.current.map = map
      stateRef.current.geocoder = new google.maps.Geocoder()
      stateRef.current.advancedMarker = AdvancedMarkerElement

    })()

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const map = stateRef.current.map
    const geocoder = stateRef.current.geocoder
    if (!map || !geocoder) return

    let cancelled = false

    clearMarkers(stateRef.current.markers)
    stateRef.current.markers = []

    ;(async () => {
      const bounds = new google.maps.LatLngBounds()
      const allPoints: {type:'project'|'lead'; name:string; postcode:string; status?:Project['status']}[] = [
        ...projects.map(p=>({type:'project' as const, name:p.name, postcode:p.postcode, status:p.status})),
        ...leads.map(l=>({type:'lead' as const, name:l.name, postcode:l.postcode}))
      ]

      for (const item of allPoints) {
        if (cancelled) return

        const loc = await geocodePostcode(geocoder, item.postcode)
        if (cancelled) return
        if (!loc) { console.warn('No geocode result for', item.postcode, item.name); continue }
        bounds.extend(loc)

        const container = document.createElement('div')
        container.style.position = 'relative'

        const label = document.createElement('div')
        label.className = styles.callout + ' ' + (item.type==='lead' ? styles.calloutLead : '')
        if (item.type === 'project' && item.status) {
          label.style.color = STATUS_TEXT[item.status].color
        }
        label.textContent = item.name + (item.type==='project' && item.status ? ` • ${STATUS_TEXT[item.status].label}` : '')
        const tail = document.createElement('div')
        tail.className = styles.tail
        label.appendChild(tail)

        const iconWrap = document.createElement('div')
        iconWrap.className = styles.iconWrap
        const img = document.createElement('img')
        img.className = styles.icon
        img.src = item.type==='lead' ? LEAD_ICON : STATUS_ICON[item.status!]
        img.alt = item.name
        iconWrap.appendChild(img)

        container.appendChild(label)
        container.appendChild(iconWrap)

        let marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
        try {
          const AdvancedMarkerElement = stateRef.current.advancedMarker
          if (AdvancedMarkerElement) {
            marker = new AdvancedMarkerElement({
              position: loc,
              map,
              content: container,
              collisionBehavior: google.maps.CollisionBehavior?.REQUIRED,
            })
          } else {
            throw new Error('AdvancedMarker unavailable')
          }
        } catch {
          const m = new google.maps.Marker({ position: loc, map, title: item.name })
          const info = new google.maps.InfoWindow({ content: `<strong>${item.name}</strong>` })
          m.addListener('click', () => info.open({ anchor: m, map }))
          marker = m
          console.warn('Using fallback Marker for', item.name)
        }

        stateRef.current.markers.push({ type: item.type, marker, labelEl: label })
      }

      if (!cancelled) {
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 60)
        }
        updateMarkerVisibility(stateRef.current.markers, map, showProjects, showLeads)
      }
    })()

    return () => {
      cancelled = true
      clearMarkers(stateRef.current.markers)
      stateRef.current.markers = []
    }
  }, [projects, leads])

  useEffect(() => {
    const map = stateRef.current.map
    if (!map) return
    updateMarkerVisibility(stateRef.current.markers, map, showProjects, showLeads)
  }, [showProjects, showLeads])

  return <div ref={mapRef} className="map" />
}

function clearMarkers(markers: MarkerWrapper[]) {
  for (const m of markers) {
    if ('setMap' in m.marker) {
      m.marker.setMap(null)
    } else {
      m.marker.map = null
    }
    if (m.labelEl) {
      m.labelEl.remove()
    }
  }
}

function updateMarkerVisibility(markers: MarkerWrapper[], map: google.maps.Map, showProjects: boolean, showLeads: boolean) {
  for (const m of markers) {
    const isVisible = m.type === 'project' ? showProjects : showLeads
    if ('setMap' in m.marker) {
      m.marker.setMap(isVisible ? map : null)
    } else {
      m.marker.map = isVisible ? map : null
    }
    if (m.labelEl) {
      m.labelEl.style.display = isVisible ? '' : 'none'
    }
  }
}

async function geocodePostcode(
  geocoder: google.maps.Geocoder,
  postcode: string
): Promise<google.maps.LatLng | null> {
  return new Promise((resolve) => {
    geocoder.geocode(
      {
        address: postcode,
        componentRestrictions: { country: 'GB' },
        region: 'GB',
      },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          resolve(null);
        }
      }
    );
  });
}
