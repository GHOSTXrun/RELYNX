import test from 'node:test'
import assert from 'node:assert/strict'
import {formatUnits,normalizeAccounts,readWallet,readNetwork,TOKEN_PROGRAM,TOKEN_2022_PROGRAM} from '../src/solana.js'
const account=(mint,amount,decimals=9,owner=TOKEN_PROGRAM)=>({account:{owner,data:{parsed:{info:{mint,tokenAmount:{amount,decimals}}}}}})
test('formats exact token amounts without floating point rounding',()=>{
 assert.equal(formatUnits('1',9),'0.000000001')
 assert.equal(formatUnits('123456789012345678901',9),'123,456,789,012.345678901')
 assert.equal(formatUnits('0',9),'0')
 assert.equal(formatUnits('1200000',6),'1.2')
 assert.equal(formatUnits('1000',0),'1,000')
 assert.equal(formatUnits('-1',9),'—')
})
test('combines token accounts by mint and program, filters zero balances',()=>{
 const values=normalizeAccounts([account('mint-a','1'),account('mint-a','2'),account('mint-a','5',9,TOKEN_2022_PROGRAM),account('empty','0'),{account:{data:{}}}])
 assert.equal(values.length,2)
 assert.equal(values[0].balance,'0.000000003')
 assert.equal(values[0].accountCount,2)
 assert.equal(values[1].program,TOKEN_2022_PROGRAM)
})
test('partial RPC failure does not present missing token coverage as complete',async()=>{
 const original=globalThis.fetch
 globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);if(body.method==='getTokenAccountsByOwner'&&body.params[1].programId===TOKEN_2022_PROGRAM)return {ok:false,status:429};const result=body.method==='getBalance'?{value:0}:body.method==='getSignaturesForAddress'?[]:{value:[account('mint-a','1230000',6)]};return {ok:true,json:async()=>({result})}}
 try {const result=await readWallet('wallet');assert.equal(result.balance,'0');assert.equal(result.tokens[0].balance,'1.23');assert.equal(result.tokensComplete,false);assert.equal(result.transactionsComplete,true)}finally{globalThis.fetch=original}
})
test('network snapshot preserves zero sample TPS',async()=>{
 const original=globalThis.fetch
 globalThis.fetch=async(url,options)=>({ok:true,json:async()=>({result:JSON.parse(options.body).method==='getEpochInfo'?{absoluteSlot:123,epoch:4}:[{numTransactions:0,samplePeriodSecs:60}]})})
 try{const network=await readNetwork();assert.equal(network.slot,123);assert.equal(network.epoch,4);assert.equal(network.tps,0)}finally{globalThis.fetch=original}
})
