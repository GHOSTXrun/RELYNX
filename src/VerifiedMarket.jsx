import { useState } from 'react'
import { EXPLORER_URL,TOKEN_2022_PROGRAM,short } from './solana'
export default function VerifiedMarket({session,data,status,onConnect,onRefresh}){
 const [query,setQuery]=useState('')
 const tokens=(data?.tokens||[]).filter(token=>token.mint.toLowerCase().includes(query.trim().toLowerCase()))
 return <div className="sol-data-grid">
  <section className="frame sol-assets"><div className="frame-title"><span>Wallet assets</span><b>{session?(data?.tokens.length??'—')+' token types':'Solana mainnet'}</b></div>
   <div className="sol-asset-tools"><input aria-label="Search token mints" placeholder="Search mint address" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={onRefresh} disabled={!session||status==='Loading…'}>Refresh ↻</button></div>
   <div className="sol-native"><span className="sol-mark">◎</span><div><b>Solana</b><small>Native currency</small></div><strong>{session?data?.balance!=null?data.balance+' SOL':status==='Loading…'?'Loading…':'Unavailable':'— SOL'}</strong></div>
   <div className="sol-token-head"><span>Asset</span><span>Mint address</span><span>Balance</span></div>
   {tokens.map(token=><a className="sol-token-row" href={EXPLORER_URL+'/address/'+token.mint} target="_blank" rel="noreferrer" key={token.id}><span>{token.program===TOKEN_2022_PROGRAM?'Token-2022':'SPL Token'}<small>{token.accountCount} account{token.accountCount===1?'':'s'}</small></span><span>{short(token.mint,6)} ↗</span><b>{token.balance}</b></a>)}
   {!tokens.length&&<div className="sol-empty"><b>{!session?'Your assets, in one view':status==='Loading…'?'Reading your wallet…':!data?'Wallet data unavailable':!data.tokensComplete?'Token data is incomplete':query?'No matching mint':'No token balances'}</b><p>{!session?'Connect a Solana wallet to load SOL and SPL balances.':!data||!data.tokensComplete?'Retry when the network is available.':'Only accounts with a positive token balance are listed.'}</p>{!session&&<button className="subtle-button" onClick={onConnect}>Connect wallet ↗</button>}</div>}
   <div className="registry-foot"><span>{data?.tokensComplete?'SPL Token + Token-2022':session?'Token coverage not confirmed':'Wallet not connected'}</span><span role="status">{status}</span></div>
  </section>
  <section className="frame sol-transactions"><div className="frame-title"><span>Recent transactions</span><b>Latest 5</b></div>
   {(data?.transactions||[]).map(tx=><a className="sol-tx" key={tx.signature} href={EXPLORER_URL+'/tx/'+tx.signature} target="_blank" rel="noreferrer"><span><b>{short(tx.signature,8)} ↗</b><small>{tx.blockTime?new Date(tx.blockTime*1000).toLocaleString():'Time unavailable'}</small></span><em className={tx.err?'tx-failed':'tx-confirmed'}>{tx.err?'Failed':tx.confirmationStatus||'Recorded'}</em></a>)}
   {!data?.transactions?.length&&<div className="sol-empty"><b>{!session?'Follow wallet activity':status==='Loading…'?'Loading transactions…':data?.transactionsComplete?'No recent transactions':'Activity unavailable'}</b><p>{!session?'Connect a wallet to inspect recent signatures on Solana Explorer.':data?.transactionsComplete?'This address has no recent transaction records.':'Refresh to retry the transaction feed.'}</p></div>}
   <p className="panel-note">Balances and signatures are read from Solana. Token prices are not estimated.</p>
  </section>
 </div>
}
