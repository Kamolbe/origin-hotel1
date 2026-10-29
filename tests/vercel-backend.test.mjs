import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BACKEND_URL, verifyHotelBackend } from '../scripts/build-vercel.mjs';
const ready = { service:'origin-hotel',apiVersion:1,ready:true,trustedFrontend:true,durableStorage:true };
test('Vercel routes the shared API to the exact checked Render service before the SPA',async()=>{
  assert.equal(BACKEND_URL,'https://origin-hotel1-1.onrender.com');
  const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
  assert.equal(config.buildCommand,'npm run build:vercel');
  assert.equal(config.rewrites[0].source,'/hotel-api/:path*');
  assert.equal(config.rewrites[0].destination,`${BACKEND_URL}/hotel-api/:path*`);
  let requested='';await verifyHotelBackend({fetchImpl:async url=>{requested=url;return {ok:true,json:async()=>ready}},wait:async()=>{}});
  assert.equal(requested,`${BACKEND_URL}/hotel-api/health/`);
});
test('deployment readiness blocks wrong APIs, missing setup and HTML responses',async()=>{
  for(const response of [{ok:false,status:503},{ok:true,json:async()=>({...ready,service:'other'})},{ok:true,json:async()=>({...ready,ready:false})},{ok:true,json:async()=>({...ready,durableStorage:false})},{ok:true,json:async()=>({...ready,trustedFrontend:false})},{ok:true,json:async()=>{throw new Error('HTML response')}}]){
    await assert.rejects(()=>verifyHotelBackend({fetchImpl:async()=>response,attempts:1,wait:async()=>{}}),/Render backend tasdiqlanmadi/);
  }
});
test('readiness retries a cold start and blocks a network failure',async()=>{
  let calls=0;await verifyHotelBackend({fetchImpl:async()=>++calls===1?{ok:false,status:503}:{ok:true,json:async()=>ready},wait:async()=>{}});assert.equal(calls,2);
  await assert.rejects(()=>verifyHotelBackend({fetchImpl:async()=>{throw new Error('network unavailable')},attempts:1}),/network unavailable/);
});
