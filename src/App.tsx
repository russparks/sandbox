import { useEffect, useMemo, useState } from 'react'
import { MapView } from './Map'
import { useDatasets } from './useDatasets'
import type { Lead, Project } from './types'

export default function App() {
  const { load } = useDatasets()
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [ready, setReady] = useState(false)
  const [showProjects, setShowProjects] = useState(true)
  const [showLeads, setShowLeads] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load().then(({ projects, leads }) => {
      setProjects(projects)
      setLeads(leads)
      setReady(true)
      if (projects.length === 0 && leads.length === 0) {
        setError('Datasets failed to load. Map will still initialize when API key is valid.')
      }
    })
  }, [])

  const footerProjects = useMemo(() => projects.map(p => `${p.name} ${p.postcode}`).join(' • '), [projects])
  const footerLeads = useMemo(() => leads.map(l => `${l.name} ${l.postcode}`).join(' • '), [leads])

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <header className="header">
        <div className="title">Project Locations</div>
        <div className="toggles">
          <label className="toggle">
            <input type="checkbox" checked={showProjects} onChange={e=>setShowProjects(e.target.checked)} />
            <span>Projects</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={showLeads} onChange={e=>setShowLeads(e.target.checked)} />
            <span>Leads</span>
          </label>
        </div>
      </header>

      {error ? <div style={{padding:'8px 16px', color:'#b91c1c', borderBottom:'1px solid #fee2e2'}}>{error}</div> : null}

      <div style={{flex:1}}>
        <div className="map">
          {ready ? <MapView projects={projects} leads={leads} showProjects={showProjects} showLeads={showLeads} /> : null}
        </div>
      </div>

      <footer className="footer">
        <span><strong>Projects:</strong> {footerProjects || '—'}</span>
        <span> &nbsp; | &nbsp; </span>
        <span><strong>Leads:</strong> {footerLeads || '—'}</span>
      </footer>
    </div>
  )
}
