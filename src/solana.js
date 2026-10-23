export const RPC_URL = import.meta.env?.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
export const EXPLORER_URL = 'https://explorer.solana.com'
export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
let requestId = 0
export const short = (value, length=5) => value ? value.slice(0,length)+'…'+value.slice(-length) : '—'
export function formatUnits(amount, decimals=9) {
 const digits=String(amount)
 if (!/^\d+$/.test(digits) || !Number.isInteger(decimals) || decimals<0 || decimals>255) return '—'
 const padded=digits.padStart(decimals+1,'0'), whole=(decimals?padded.slice(0,-decimals):padded).replace(/^0+(?=\d)/,'')
 const fraction=decimals?padded.slice(-decimals).replace(/0+$/,''):''
 return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction?'.'+fraction:'')
}
export async function rpc(method, params=[]) {
 const response=await fetch(RPC_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++requestId,method,params}),signal:AbortSignal.timeout(10000)})
 if(!response.ok)throw new Error(response.status===429?'Network busy. Try again shortly.':'Solana network is unavailable.')
 const data=await response.json()
 if(data.error)throw new Error(data.error.message||'Solana request failed.')
 return data.result
}
export async function readNetwork() {
 const [epoch,performance]=await Promise.allSettled([rpc('getEpochInfo',[{commitment:'confirmed'}]),rpc('getRecentPerformanceSamples',[1])])
 if(epoch.status==='rejected')throw epoch.reason
 const sample=performance.status==='fulfilled'?performance.value?.[0]:null
 return {slot:epoch.value.absoluteSlot,epoch:epoch.value.epoch,tps:sample?.samplePeriodSecs>0?Math.round(sample.numTransactions/sample.samplePeriodSecs):null,updatedAt:Date.now()}
}
export function normalizeAccounts(accounts) {
 const grouped=new Map()
 for(const entry of accounts){
  const info=entry?.account?.data?.parsed?.info, amount=info?.tokenAmount
  if(!info?.mint || !amount || !/^\d+$/.test(String(amount.amount)) || !Number.isInteger(amount.decimals))continue
  const program=entry.account.owner, key=info.mint+':'+program
  const previous=grouped.get(key)
  const raw=BigInt(amount.amount)+(previous?BigInt(previous.amount):0n)
  grouped.set(key,{id:key,mint:info.mint,program,decimals:amount.decimals,amount:String(raw),balance:formatUnits(String(raw),amount.decimals),accountCount:(previous?.accountCount||0)+1})
 }
 return [...grouped.values()].filter(item=>BigInt(item.amount)>0n)
}
export async function readWallet(address) {
 const results=await Promise.allSettled([
  rpc('getBalance',[address,{commitment:'confirmed'}]),
  rpc('getTokenAccountsByOwner',[address,{programId:TOKEN_PROGRAM},{encoding:'jsonParsed',commitment:'confirmed'}]),
  rpc('getTokenAccountsByOwner',[address,{programId:TOKEN_2022_PROGRAM},{encoding:'jsonParsed',commitment:'confirmed'}]),
  rpc('getSignaturesForAddress',[address,{limit:5,commitment:'confirmed'}])
 ])
 const available=index=>results[index].status==='fulfilled'
 if(results.every(result=>result.status==='rejected'))throw new Error('Wallet data could not be loaded. Please retry.')
 const balance=available(0)?formatUnits(String(results[0].value.value),9):null
 const tokens=normalizeAccounts([...(available(1)?results[1].value.value:[]),...(available(2)?results[2].value.value:[])])
 return {address,balance,tokens,tokensComplete:available(1)&&available(2),transactions:available(3)?results[3].value:[],transactionsComplete:available(3),updatedAt:Date.now()}
}
export function getProvider(name) {
 if(typeof window==='undefined')return null
 return name==='Solflare'?window.solflare:window.phantom?.solana||(window.solana?.isPhantom?window.solana:null)
}
export async function connectWallet(name='Phantom') {
 const provider=getProvider(name)
 if(!provider)throw new Error('Open this page in '+name+' or install its browser extension.')
 const response=await provider.connect()
 const account=response?.publicKey?.toString()||provider.publicKey?.toString()
 if(!account)throw new Error('The wallet did not return an address.')
 return {account,provider,name}
}
