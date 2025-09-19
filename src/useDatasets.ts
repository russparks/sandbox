import { z } from 'zod'
import type { Lead, LegacyProject, Project, ProjectStatus } from './types'

const projectSchema = z.object({
  name: z.string(),
  postcode: z.string(),
  status: z.enum(['precon', 'construction', 'permanent'])
})

const legacyProjectSchema = z.object({
  name: z.string(),
  postcode: z.string(),
}).and(z.object({
  precon: z.string().optional(),
  construction: z.string().optional(),
  permanent: z.string().optional(),
}).passthrough())

const leadSchema = z.object({
  name: z.string(),
  postcode: z.string(),
  role: z.string().optional(),
  project: z.string().optional()
})

export function useDatasets() {
  async function fetchJSON<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(path, { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      return await res.json() as T
    } catch (e) {
      console.error(`Failed to load ${path}:`, e)
      return null
    }
  }

  async function load() {
    const [pRaw, lRaw] = await Promise.all([
      fetchJSON<any[]>('./data/projects.json'),
      fetchJSON<any[]>('./data/leads.json')
    ])

    const projects: Project[] = []
    const leads: Lead[] = []

    if (!pRaw) {
      console.warn('Projects dataset missing; map will still init')
    } else {
      for (const item of pRaw) {
        const direct = projectSchema.safeParse(item)
        if (direct.success) {
          projects.push(direct.data)
          continue
        }
        const legacy = legacyProjectSchema.safeParse(item)
        if (legacy.success) {
          const li = legacy.data as LegacyProject
          const status: ProjectStatus | undefined = li.construction !== undefined
            ? 'construction'
            : li.precon !== undefined
              ? 'precon'
              : li.permanent !== undefined
                ? 'permanent'
                : undefined
          if (!status) {
            console.warn('Legacy project missing status keys:', li)
            continue
          }
          projects.push({ name: li.name, postcode: li.postcode, status })
        } else {
          console.warn('Invalid project entry dropped:', item)
        }
      }
    }

    if (!lRaw) {
      console.warn('Leads dataset missing; map will still init')
    } else {
      for (const item of lRaw) {
        const parsed = leadSchema.safeParse(item)
        if (parsed.success) leads.push(parsed.data)
        else console.warn('Invalid lead entry dropped:', item)
      }
    }

    return { projects, leads }
  }

  return { load }
}
