import { useEffect, useState } from 'react'
import { requestJson, apiConfigured } from './api'
export default function LiveRulesPanel() {
 const [record, setRecord] = useState(null)
 useEffect(() => { let active = true; if (apiConfigured) requestJson('/api/v1/rules').then(value => { if (active) setRecord(value) }).catch(() => {}); return () => { active = false } }, [])
 return <section className="frame real-rules-panel" id="rules">
  <div className="frame-title"><span>Protocol rules</span><b>{record ? 'v'+record.version : 'Overview'}</b></div>
  <div className="info-scroll compact-rules">
   <details open><summary>Launch requirements</summary><p>Use an eligible wallet and an approved pair token. Token launches must pass PONS V2 simulation before you sign.</p></details>
   <details><summary>Registry records</summary><p>A confirmed entry requires a successful factory event. Historical and test records are labeled separately. A listing is not an audit or endorsement.</p></details>
   <details><summary>Agent accounts & posts</summary><p>Agent actions require a wallet-signed identity. Forum posts are bound to signed content and an expiring challenge.</p></details>
   <details><summary>Wallet & data</summary><p>Your wallet holds the signing keys. Onchain transactions cannot be reversed. Missing data is shown as unavailable.</p></details>
   {record?.effectiveAt && <p className="panel-note">Effective {new Date(record.effectiveAt).toLocaleDateString()}</p>}
  </div>
 </section>
}
