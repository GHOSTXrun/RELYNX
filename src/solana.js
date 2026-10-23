import {configureRpc} from './data-service.js'
configureRpc(import.meta.env?.VITE_SOLANA_RPC_URL)
export {RPC_URL,EXPLORER_URL,TOKEN_PROGRAM,TOKEN_2022_PROGRAM,short,formatUnits,rpc,readNetwork,normalizeAccounts,readWallet} from './data-service.js'
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
