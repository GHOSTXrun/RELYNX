import { useEffect, useMemo, useRef, useState } from 'react'
import { formatEther, parseEventLogs, parseAbi } from 'viem'
import { publicClient, FACTORY_ADDRESS, EXPLORER_URL, ponsAbi } from './pons'
import { requestJson, apiConfigured } from './api'
import { Search } from 'lucide-react'
const short = value => value ? value.slice(0,8)+'…'+value.slice(-6) : '—'
const ZERO_ADDRESS='0x0000000000000000000000000000000000000000'
const metadataAbi = parseAbi(['function name() view returns (string)', 'function symbol() view returns (string)'])
const fixed=[
 {id:'pid0',token:'PID0',ticker:'PID0',type:'LEGACY PROJECT TOKEN',status:'Historical',agent:'PID0 NETWORK',network:'ROBINHOOD CHAIN / 4663',contract:'0xcceff0368f2336d5abe4c16b402c6aa6c384048d',curve:'0x63eaE07197ffaFC5cE6f7a40086D3e0243B68c71',pairToken:ZERO_ADDRESS,pairLabel:'NATIVE ETH',txHash:'0x4d7d13dd59a44517635b134f302e3282383bbc7783330cd6afcda06bdbbf37c7',launchBlock:'67177910',description:'$PID0 is the legacy token of the original PID0 project, retained as a historical onchain record. RELYNX has no announced token. Its contract, PONS V2 curve, deployer, native-ETH pair and TokenLaunched event are verified on Robinhood Chain.',proof:'Historical record'},
 {id:'test02',token:'TEST 02',ticker:'TEST',type:'TEST LAUNCH TOKEN',status:'Historical',agent:'PID0 LAUNCH TEST',network:'ROBINHOOD CHAIN / 4663',contract:'0x0ab609a4c47d3006ca4f53909864c6ffb3e74e07',curve:'0x714766672e4a938363da159bebfe45e770595112',pairToken:ZERO_ADDRESS,pairLabel:'NATIVE ETH',txHash:'0xef5cdcd19a2d6a7f27f9a732b7c6b4b19a5fd5b6b8c9e254860081465cd2f1c4',launchBlock:'0x3ffe1bd',description:'TEST 02 is a PONS V2 test launch used to validate the PID0 launch path before the official $PID0 deployment. Its TokenLaunched event, token, curve, deployer and native-ETH pair are verified on Robinhood Chain.',proof:'Historical record'},
 {id:'test01',token:'TEST 01',ticker:'TEST',type:'TEST LAUNCH TOKEN',status:'Historical',agent:'PID0 LAUNCH TEST',network:'ROBINHOOD CHAIN / 4663',contract:'0x1d888e2f742113408c1036579d54a11069df2134',curve:'0x30d9d2fbb6e8b31d5c19e4d23376e4d86f74bd44',pairToken:ZERO_ADDRESS,pairLabel:'NATIVE ETH',txHash:'0x90855cbe653699fdbeb1aca1f3e0293c6a5dd2f21c22c4e315b1add4ebca8ffd',launchBlock:'0x3ffde43',description:'TEST 01 is the first PONS V2 test launch for PID0. Its TokenLaunched event, token, curve, deployer and native-ETH pair are verified on Robinhood Chain. It remains a test token rather than the official $PID0 token.',proof:'Historical record'}
]

function Pane({title,meta,className,children}) {return <section className={'frame '+className}><div className="frame-title"><span>{title}</span><b>{meta}</b></div>{children}</section>}
export default function VerifiedMarket(){
 const [launches,setLaunches]=useState([]),[selectedId,setSelectedId]=useState('pid0'),[query,setQuery]=useState(''),[filter,setFilter]=useState('all')
 const [sync,setSync]=useState('Loading…'),[checkedAt,setCheckedAt]=useState(null),[scope,setScope]=useState(null),[gateway,setGateway]=useState(apiConfigured?'Connecting…':'Not connected')
 const [metrics,setMetrics]=useState({}),[proofs,setProofs]=useState({}),[metricStatus,setMetricStatus]=useState('Loading…')
 const busy=useRef(false)
 async function refresh(){
  if(busy.current)return
  busy.current=true;setSync('Loading…')
  try{
   const tip=await publicClient.getBlockNumber()
   const from=tip>9999n?tip-9999n:0n
   const logs=await publicClient.getLogs({address:FACTORY_ADDRESS,event:ponsAbi.find(item=>item.type==='event'&&item.name==='TokenLaunched'),fromBlock:from,toBlock:tip})
   const latest=logs.filter(item=>!item.removed).slice(-12).reverse()
   const results=await Promise.all(latest.map(async log=>{
    const [name,symbol]=await Promise.allSettled(['name','symbol'].map(functionName=>publicClient.readContract({address:log.args.token,abi:metadataAbi,functionName})))
    return {id:log.args.token.toLowerCase(),token:name.status==='fulfilled'?name.value:short(log.args.token),ticker:symbol.status==='fulfilled'?symbol.value:'TOKEN',contract:log.args.token,curve:log.args.curve,pairToken:log.args.pairToken,txHash:log.transactionHash,agent:short(log.args.deployer),type:'PONS V2 launch',status:'Confirmed',live:true,description:'Launched through the PONS V2 factory.',block:String(log.blockNumber)}
   }))
   setLaunches(results);setScope({from:String(from),to:String(tip)});setSync('Connected');setCheckedAt(new Date())
  }catch{setSync('Unavailable')}
  finally{busy.current=false}
 }
 useEffect(()=>{refresh();const timer=setInterval(()=>{if(!document.hidden)refresh()},60000);return()=>clearInterval(timer)},[])
 useEffect(()=>{if(!apiConfigured)return;let active=true;requestJson('/api/v1/status').then(()=>{if(active)setGateway('Connected')}).catch(()=>{if(active)setGateway('Unavailable')});return()=>{active=false}},[])
 const records=useMemo(()=>{
  const known=new Set(launches.map(item=>item.contract.toLowerCase()))
  return [...launches,...fixed.filter(item=>!known.has(item.contract.toLowerCase()))]
 },[launches])
 const selected=records.find(item=>item.id===selectedId)||records[0]
 useEffect(()=>{
  if(!selected)return
  let active=true;setMetricStatus('Loading…')
  publicClient.getBalance({address:selected.curve}).then(value=>{if(active){setMetrics(values=>({...values,[selected.id]:new Intl.NumberFormat('en-US',{maximumSignificantDigits:6}).format(Number(formatEther(value)))+' ETH'}));setMetricStatus('Live')}}).catch(()=>{if(active)setMetricStatus('Unavailable')})
  if(!selected.live)publicClient.getTransactionReceipt({hash:selected.txHash}).then(receipt=>{
   const events=parseEventLogs({abi:ponsAbi,logs:receipt.logs,eventName:'TokenLaunched',strict:false})
   const valid=receipt.status==='success'&&events.some(event=>event.address.toLowerCase()===FACTORY_ADDRESS.toLowerCase()&&event.args.token?.toLowerCase()===selected.contract.toLowerCase()&&event.args.curve?.toLowerCase()===selected.curve.toLowerCase())
   if(active)setProofs(values=>({...values,[selected.id]:valid?'Confirmed':'Not confirmed'}))
  }).catch(()=>{if(active)setProofs(values=>({...values,[selected.id]:'Unavailable'}))})
  return()=>{active=false}
 },[selected?.id,checkedAt])
 const filtered=records.filter(item=>(filter==='all'||(filter==='recent'?item.live:filter==='test'?item.type==='TEST LAUNCH TOKEN':!item.live&&item.type!=='TEST LAUNCH TOKEN'))&&[item.token,item.ticker,item.agent,item.contract].some(value=>String(value||'').toLowerCase().includes(query.trim().toLowerCase())))
 return <div className="verified-market">
  <Pane title="Launch registry" meta={records.length+' records'} className="verified-registry">
   <div className="registry-tools"><div className="registry-filters" role="group" aria-label="Record type">{[['all','All'],['recent','Recent'],['legacy','Historical'],['test','Tests']].map(([key,label])=><button key={key} className={filter===key?'on':''} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div><label className="registry-search"><Search size={14}/><input aria-label="Search launches" placeholder="Search name or contract" value={query} onChange={event=>setQuery(event.target.value)}/></label></div>
   <div className="market-controls"><span className="source-label">PONS V2 events</span><button onClick={refresh} disabled={sync==='Loading…'}>{sync==='Loading…'?'Loading…':'Refresh ↻'}</button><b role="status" className={sync==='Connected'?'status-online':'status-muted'}>{sync}</b></div>
   <div className="verified-table-head"><span>TOKEN</span><span>NAME</span><span>RECORD</span><span>CONTRACT</span></div>
   <div className="verified-agent-list">{filtered.map(record=><button key={record.id} aria-pressed={selected.id===record.id} className={selected.id===record.id?'selected':''} onClick={()=>setSelectedId(record.id)}><b>{'$'+record.ticker}</b><span>{record.token}</span><span>{record.live?'Confirmed':record.type==='TEST LAUNCH TOKEN'?'Test':'Historical'}</span><span>{short(record.contract)}</span></button>)}</div>
   {!filtered.length&&<div className="empty-registry"><b>{sync==='Loading…'?'Loading records…':'No matching records'}</b><p>{filter==='recent'?'Recent launches appear after confirmation within the scanned block range.':'Try another name, address or filter.'}</p><button className="clear-filter" onClick={()=>{setQuery('');setFilter('all')}}>Reset filters</button></div>}
   <div className="registry-foot"><span>{scope?'Blocks '+scope.from+'–'+scope.to:'Recent block data unavailable'}</span><span>{checkedAt?'Updated '+checkedAt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'Awaiting connection'}</span></div>
  </Pane>
  <Pane title="Token details" meta={selected.live?'Confirmed':proofs[selected.id]||'Historical record'} className="verified-inspect">
   <div className="project-title"><div className="token-glyph">{selected.ticker.slice(0,2)}</div><div><h2>{selected.token}</h2><p>{selected.type==='TEST LAUNCH TOKEN'?'Test launch':selected.live?'PONS V2 launch':'Historical launch'}</p></div></div>
   {!selected.live&&<p className="data-notice">Archived {selected.type==='TEST LAUNCH TOKEN'?'test':'PID0'} record. This is not a RELYNX token.</p>}
   <dl><dt>Network</dt><dd>Robinhood · 4663</dd><dt>Contract</dt><dd><a href={EXPLORER_URL+'/address/'+selected.contract} target="_blank" rel="noreferrer">{short(selected.contract)} ↗</a></dd><dt>Curve</dt><dd><a href={EXPLORER_URL+'/address/'+selected.curve} target="_blank" rel="noreferrer">{short(selected.curve)} ↗</a></dd><dt>Pair token</dt><dd>{selected.pairToken===ZERO_ADDRESS?'ETH':short(selected.pairToken)}</dd><dt>Curve reserve</dt><dd>{metricStatus==='Live'?metrics[selected.id]:metricStatus}</dd><dt>Launch proof</dt><dd>{selected.live?'Confirmed':proofs[selected.id]||'Checking…'}</dd><dt>Gateway</dt><dd>{gateway}</dd></dl>
   <a className="verified-action" href={EXPLORER_URL+'/tx/'+selected.txHash} target="_blank" rel="noreferrer">View transaction ↗</a>
   <p className="panel-note">Curve reserve is not token price or total liquidity. Holder counts and prices are available from the explorer when indexed.</p>
  </Pane>
 </div>
}
