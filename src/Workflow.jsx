import { useState } from 'react'
const steps=[
 {title:'Connect',input:'Phantom / Solflare',action:'Approve address access',output:'Public wallet address',detail:'Choose a wallet and approve the connection. No SOL moves and no token is created.'},
 {title:'Read',input:'Connected wallet',action:'Fetch SOL & SPL accounts',output:'Balances and mint addresses',detail:'The workspace reads SOL, SPL Token and Token-2022 balances directly from Solana.'},
 {title:'Prepare',input:'Name, symbol, supply',action:'Save a token draft',output:'Local draft',detail:'Define token details and save a draft on this device. This stage does not deploy a mint.'},
 {title:'Review',input:'Mint or signature',action:'Open Solana Explorer',output:'Independent onchain record',detail:'Inspect mint accounts and transaction results in Solana Explorer before taking further action.'}
]
export default function Workflow({onDraft}){
 const [active,setActive]=useState(0)
 return <section id="workflow" className="sol-workflow">
  <div className="section-heading"><div><h2>How it works</h2><p>Four steps. Clear inputs and outputs.</p></div><span className="outline-tag">INTERACTIVE WALKTHROUGH</span></div>
  <div className="frame"><div className="workflow-table-wrap"><table className="workflow-table"><thead><tr><th>Step</th><th>Input</th><th>Action</th><th>Result</th></tr></thead><tbody>{steps.map((step,index)=><tr className={active===index?'is-active':''} key={step.title}><th scope="row"><button onClick={()=>setActive(index)} aria-pressed={active===index}><span>0{index+1}</span>{step.title}</button></th><td>{step.input}</td><td>{step.action}</td><td>{step.output}</td></tr>)}</tbody></table></div><div className="workflow-demo"><div><span>STEP 0{active+1} / WALKTHROUGH</span><h3>{steps[active].title}</h3><p>{steps[active].detail}</p></div><div className="workflow-demo-actions">{active===2&&<button className="subtle-button" onClick={onDraft}>Open draft ↗</button>}<button className="subtle-button" onClick={()=>setActive(value=>(value+1)%steps.length)}>{active===3?'Start again':'Next step'} →</button></div></div></div>
 </section>
}
