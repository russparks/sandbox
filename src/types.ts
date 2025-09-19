export type ProjectStatus = 'precon' | 'construction' | 'permanent'

export type Project = {
  name: string
  postcode: string
  status: ProjectStatus
}

export type LegacyProject = {
  name: string
  postcode: string
  precon?: string
  construction?: string
  permanent?: string
  [k: string]: unknown
}

export type Lead = {
  name: string
  postcode: string
  role?: string
  project?: string
}
