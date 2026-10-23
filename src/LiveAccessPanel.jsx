import { FACTORY_ADDRESS, EXPLORER_URL } from './pons'
import { apiConfigured } from './api'
const short = value => value ? `${value.slice(0, 8)}…${value.slice(-6)}` : 'Not connected'
export default function LiveAccessPanel({ session, protocol, protocolError, onConnect, onLaunch }) {
 const pending = protocolError ? 'Unavailable' : 'Loading…'
 return <section className="frame real-access-panel" id="access">
  <div className="frame-title"><span>Wallet & launch</span><b>{protocol ? 'PONS V2' : pending}</b></div>
  <div className="info-scroll">
   <div className="live-protocol-grid">
    <span>Network</span><b>Robinhood · 4663</b>
    <span>Factory</span><a href={EXPLORER_URL+'/address/'+FACTORY_ADDRESS} target="_blank" rel="noreferrer">{short(FACTORY_ADDRESS)} ↗</a>
    <span>Launches</span><b>{protocol ? protocol.enabled ? 'Open' : 'Paused' : pending}</b>
    <span>Launch fee</span><b>{protocol?.feeLabel || pending}</b>
    <span>Curve fee</span><b>{protocol ? Number(protocol.config.curveFeeBps)/100+'%' : pending}</b>
    <span>Wallet</span><b>{short(session?.account)}</b>
    <span>Eligibility</span><b>{session ? session.eligible ? 'Eligible' : 'Not eligible' : 'Connect to check'}</b>
    <span>Agent gateway</span><b>{apiConfigured ? 'Configured' : 'Not connected'}</b>
   </div>
   {protocolError && <p className="data-notice" role="status">Network data is unavailable. Check your connection and refresh.</p>}
   <div className="info-actions"><button onClick={onConnect}>{session ? 'Wallet connected' : 'Connect wallet'} ↗</button><button onClick={onLaunch}>Create token ↗</button></div>
   <p className="panel-note">Transactions require wallet approval. Fees and eligibility are read from the factory contract.</p>
  </div>
 </section>
}

