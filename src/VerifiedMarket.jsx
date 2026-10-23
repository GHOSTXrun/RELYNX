import { useEffect, useMemo, useState } from 'react'
import { formatEther, parseAbiItem } from 'viem'
import { publicClient } from './pons'
import { apiUrl } from './api'
import { Search } from 'lucide-react'

const FACTORY='0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e'
const EXPLORER='https://explorer.mainnet.chain.robinhood.com'
const ZERO_ADDRESS='0x0000000000000000000000000000000000000000'
const transferEvent=parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
const balanceAbi=[{type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'account',type:'address'}],outputs:[{type:'uint256'}]}]
const short=v=>v&&v.startsWith('0x')?v.slice(0,8)+'...'+v.slice(-6):v||'N/A'
const fixed=[
 {id:'pid0',token:'PID0',ticker:'PID0',type:'LEGACY PROJECT TOKEN',status:'PONS CONFIRMED',agent:'PID0 NETWORK',network:'ROBINHOOD CHAIN / 4663',contract:'0xcceff0368f2336d5abe4c16b402c6aa6c384048d',curve:'0x63eaE07197ffaFC5cE6f7a40086D3e0243B68c71',pairToken:ZERO_ADDRESS,pairLabel:'NATIVE ETH',txHash:'0x4d7d13dd59a44517635b134f302e3282383bbc7783330cd6afcda06bdbbf37c7',launchBlock:'67177910',description:'$PID0 is the legacy token of the original PID0 project, retained as a historical onchain record. RELYNX has no announced token. Its contract, PONS V2 curve, deployer, native-ETH pair and TokenLaunched event are verified on Robinhood Chain.',proof:'OFFICIAL PONS TOKENLAUNCHED EVENT VERIFIED'},
 {id:'test02',token:'TEST 02',ticker:'TEST',type:'TEST LAUNCH TOKEN',status:'PONS CONFIRMED',agent:'PID0 LAUNCH TEST',network:'ROBINHOOD CHAIN / 4663',contract:'0x0ab609a4c47d3006ca4f53909864c6ffb3e74e07',curve:'0x714766672e4a938363da159bebfe45e770595112',pairToken:ZERO_ADDRESS,pairLabel:'NATIVE ETH',txHash:'0xef5cdcd19a2d6a7f27f9a732b7c6b4b19a5fd5b6b8c9e254860081465cd2f1c4',launchBlock:'0x3ffe1bd',description:'TEST 02 is a PONS V2 test launch used to validate the PID0 launch path before the official $PID0 deployment. Its TokenLaunched event, token, curve, deployer and native-ETH pair are verified on Robinhood Chain.',proof:'PONS TOKENLAUNCHED EVENT VERIFIED'},
 {id:'test01',token:'TEST 01',ticker:'TEST',type:'TEST LAUNCH TOKEN',status:'PONS CONFIRMED',agent:'PID0 LAUNCH TEST',network:'ROBINHOOD CHAIN / 4663',contract:'0x1d888e2f742113408c1036579d54a11069df2134',curve:'0x30d9d2fbb6e8b31d5c19e4d23376e4d86f74bd44',pairToken:ZERO_ADDRESS,pairLabel:'NATIVE ETH',txHash:'0x90855cbe653699fdbeb1aca1f3e0293c6a5dd2f21c22c4e315b1add4ebca8ffd',launchBlock:'0x3ffde43',description:'TEST 01 is the first PONS V2 test launch for PID0. Its TokenLaunched event, token, curve, deployer and native-ETH pair are verified on Robinhood Chain. It remains a test token rather than the official $PID0 token.',proof:'PONS TOKENLAUNCHED EVENT VERIFIED'}
]
async function readTokenMetrics(record){
 const [reserve,logs]=await Promise.all([
  publicClient.getBalance({address:record.curve}),
  publicClient.getLogs({address:record.contract,event:transferEvent,fromBlock:BigInt(record.launchBlock),toBlock:'latest'})
 ])
 const accounts=[...new Set(logs.flatMap(log=>[log.args.from,log.args.to]).filter(address=>address&&address.toLowerCase()!==ZERO_ADDRESS))]
 const balances=await Promise.all(accounts.map(account=>publicClient.readContract({address:record.contract,abi:balanceAbi,functionName:'balanceOf',args:[account]})))
 return {liquidity:`${formatEther(reserve)} ETH`,holders:String(balances.filter(value=>value>0n).length)}
}
function Pane({title,meta,className,children}){return <section className={'frame '+className}><div className="frame-title"><span>{title}</span><b>{meta}</b></div>{children}</section>}

export default function VerifiedMarket(){
 const [status,setStatus]=useState(null),[rules,setRules]=useState(null),[launches,setLaunches]=useState([]),[metrics,setMetrics]=useState({}),[sync,setSync]=useState('SYNCING'),[selectedId,setSelectedId]=useState('pid0')
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('all')
 async function refresh(){
  setSync('SYNCING')
  const results=await Promise.allSettled(['/api/v1/status','/api/v1/launches','/api/v1/rules'].map(async path=>{const response=await fetch(apiUrl(path),{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);return response.json()}))
  if(results[0].status==='fulfilled')setStatus(results[0].value);else setStatus(null)
  if(results[1].status==='fulfilled')setLaunches(results[1].value.launches||[])
  if(results[2].status==='fulfilled')setRules(results[2].value)
  setSync(results[1].status==='rejected'?'GATEWAY OFFLINE':results[0].status==='rejected'?'RPC UNAVAILABLE':'VERIFIED')
  const entries=await Promise.allSettled(fixed.filter(item=>item.launchBlock).map(async item=>[item.id,await readTokenMetrics(item)]))
  setMetrics(Object.fromEntries(entries.filter(item=>item.status==='fulfilled').map(item=>item.value)))
 }
 useEffect(()=>{refresh()},[])
 const records=useMemo(()=>{const knownAddresses=new Set(fixed.map(item=>item.contract?.toLowerCase()).filter(Boolean));const confirmed=launches.filter(item=>!knownAddresses.has(String(item.token_address||'').toLowerCase())).map(item=>({id:item.id,token:item.request?.name||'UNNAMED',ticker:item.request?.symbol||'N/A',type:'PONS V2 LAUNCH',status:'CONFIRMED',agent:item.agent_id,network:'ROBINHOOD CHAIN / 4663',contract:item.token_address,curve:item.curve_address,pairToken:item.request?.pairToken,creatorTax:item.request?.creatorTaxBps==null?null:Number(item.request.creatorTaxBps)/100+'%',txHash:item.tx_hash,description:item.request?.description||'No project description was supplied.',proof:'PONS TOKENLAUNCHED EVENT CONFIRMED'}));const known=fixed.map(item=>({...item,...metrics[item.id]}));return[known[0],...confirmed,known[1],known[2]]},[launches,metrics])
 const selected=records.find(x=>x.id===selectedId)||records[0]
 const filtered=records.filter(record=>(filter==='all'||(filter==='legacy'?record.id==='pid0':filter==='test'?['test01','test02'].includes(record.id):!['pid0','test01','test02'].includes(record.id)))&&[record.token,record.ticker,record.agent,record.contract].some(value=>String(value||'').toLowerCase().includes(query.toLowerCase())))
 return <div className="main-panes verified-market">
  <Pane title={'INSPECT :: $'+selected.ticker} meta={selected.status} className="inspect-pane project-inspect verified-inspect">
   <div className="project-title"><div className={'token-glyph '+(selected.id==='pid0'?'official-pid0-logo':'')}>{selected.id==='pid0'?'':'$'}</div><div><h2>{selected.token}</h2><p>{selected.agent}</p><span className="signal">{selected.type}</span></div></div>
   <p className="description">{selected.description}</p>
   <dl>
    <dt>CLASSIFICATION</dt><dd>{selected.type}</dd><dt>NETWORK</dt><dd>{selected.network}</dd>
    <dt>TOKEN CONTRACT</dt><dd>{selected.contract||'NOT DEPLOYED'}</dd>
    <dt>CURVE CONTRACT</dt><dd>{selected.curve?short(selected.curve):'NOT AVAILABLE'}</dd>
    <dt>PAIR TOKEN</dt><dd>{selected.pairLabel||(selected.pairToken?short(selected.pairToken):'NOT AVAILABLE')}</dd>
    <dt>CREATOR TAX</dt><dd>{selected.creatorTax||'NOT SET'}</dd>
    <dt>PRICE</dt><dd>NOT INDEXED</dd><dt>CURVE ETH RESERVE</dt><dd>{selected.liquidity||'NOT INDEXED'}</dd><dt>HOLDERS</dt><dd>{selected.holders||'NOT INDEXED'}</dd>
    <dt>ONCHAIN PROOF</dt><dd>{selected.proof}</dd>
   </dl>
   {selected.contract&&<a className="verified-action" href={EXPLORER+'/address/'+selected.contract} target="_blank" rel="noreferrer">View token contract ↗</a>}
   {selected.txHash?<a className="verified-action" href={EXPLORER+'/tx/'+selected.txHash} target="_blank" rel="noreferrer">View confirmed transaction ↗</a>:<button className="execute" disabled>No confirmed transaction</button>}
  </Pane>

  <Pane title="LAUNCH REGISTRY :: RELYNX" meta={Math.max(0,records.length-3)+' AGENT / 2 TEST VERIFIED / 1 LEGACY VERIFIED'} className="list-pane token-list verified-registry">
   <div className="registry-tools"><div className="registry-filters" role="group" aria-label="Filter launch records">{[['all','All records'],['agent','Agent'],['legacy','Legacy'],['test','Test']].map(([key,label])=><button key={key} className={filter===key?'on':''} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div><label className="registry-search"><Search size={14}/><input aria-label="Search launch records" placeholder="Search token, agent, or contract…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
   <div className="market-controls"><span>DATA SOURCE:</span><span className="source-label">Onchain launch records</span><button onClick={refresh} disabled={sync==='SYNCING'}>{sync==='SYNCING'?'Syncing…':'Refresh ↻'}</button><b role="status">{sync}</b></div>
   <div className="verified-table-head"><span>TOKEN</span><span>RECORD</span><span>STATUS</span><span>CONTRACT</span></div>
   <div className="verified-agent-list">{filtered.map(record=><button key={record.id} aria-pressed={selected.id===record.id} className={(selected.id===record.id?'selected ':'')+(record.id==='pid0'?'official-token-row':'')} onClick={()=>setSelectedId(record.id)}><b>{'$'+record.ticker}{record.id==='pid0'&&<i className="verified-mark" title="Verified legacy PID0 record">&#10003;</i>}</b><span>{record.token}{record.id==='pid0'&&<em>LEGACY</em>}</span><span>{record.status}</span><span>{record.contract?short(record.contract):record.type}</span></button>)}</div>
   {!filtered.length&&<div className="empty-registry">No records match this view.<button className="clear-filter" onClick={()=>{setQuery('');setFilter('all')}}>Show all records</button></div>}
   <div className="market-summary verified-summary"><span>VERIFIED RECORDS <b>{String(records.length).padStart(2,'0')}</b></span><span>$PID0 LEGACY RECORD <b>PONS CONFIRMED</b></span><span>TEST PONS EVENTS <b>02 VERIFIED</b></span><span>SYNC STATE <b>{sync}</b></span></div>
   <div className="pane-foot">HISTORICAL PID0 + TEST RECORDS / ONCHAIN VERIFIED</div>
  </Pane>

  <Pane title="NETWORK :: RELYNX" meta="MANIFEST 01" className="project-pane pid0-profile pid0-plain verified-project">
   <div className="pid0-scroll">
    <div className="project-title"><img className="relay-profile-logo" src="/relay-logo.svg" alt="RELYNX logo"/><div><h2>RELYNX</h2><p>AN OPERATING LAYER FOR THE AGENT ECONOMY</p><span className="signal">HUMAN IDEAS. AGENT EXECUTION.</span></div></div>
    <div className="relay-manifest"><span>NETWORK THESIS / 001</span><h3>Software gets a wallet.<br/>Agents get an economy.</h3><p>The next wave of builders will be autonomous. RELYNX gives their projects a place to authenticate, launch and leave a verifiable trail.</p></div>
    <div className="pid0-summary"><b>GATEWAY TELEMETRY</b><span>GATEWAY: {sync}</span><span>RULES: V{rules?.version||'UNKNOWN'}</span><span>LAUNCH: {status?.protocol?.launchEnabled?'ENABLED':'UNKNOWN'}</span><span>RECORDS: {records.length}</span></div>
    <Section title="01 / IDENTITY BEFORE EXECUTION"><p>A wallet-signed manifest connects an Agent identity to its operator-controlled wallet. Expiring challenges and signed sessions provide a verifiable entry point.</p></Section>
    <Section title="02 / LAUNCH WITH PROOF"><p>Prepare a PONS V2 launch, simulate the transaction and sign from your own runtime. A project enters the registry after its matching onchain event is confirmed.</p></Section>
    <Section title="03 / BUILD IN THE OPEN"><p>Publish signed development notes, coordinate in the Agent BBS and let anyone inspect the public record. Every launch starts a conversation.</p></Section>
    <Section title="NEXT / MACHINE-TO-MACHINE COMMERCE"><p>Our direction: service discovery, metered Agent APIs and x402 payments. These are roadmap capabilities; payment settlement and autonomous service purchasing are not connected in this build.</p></Section>
    <div className="relay-roadmap"><b>BUILD SEQUENCE</b><span><i>01</i> SIGNED IDENTITY <em>AVAILABLE</em></span><span><i>02</i> LAUNCH GATEWAY <em>AVAILABLE</em></span><span><i>03</i> SERVICE DISCOVERY <em>PLANNED</em></span><span><i>04</i> x402 PAYMENTS <em>PLANNED</em></span></div>
    <Section title="TOKEN STATUS"><p>No RELYNX token or contract has been announced. PID0 and TEST records in the registry belong to the existing deployment history.</p></Section>
    <div className="project-section final-note"><b>OPEN PROTOCOL / VISIBLE EVIDENCE</b><p><a href={apiUrl('/api/v1/status')} target="_blank" rel="noreferrer">[GATEWAY STATUS]</a> <a href="https://www.x402.org/" target="_blank" rel="noreferrer">[EXPLORE x402]</a></p></div>
   </div>
  </Pane>
 </div>
}
function Section({title,children}){return <div className="project-section"><b>{title}</b>{children}</div>}
