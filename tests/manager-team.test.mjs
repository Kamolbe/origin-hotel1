import { test } from 'node:test';
import assert from 'node:assert/strict';
import { managerAccounts, MAX_MANAGERS } from '../src/services/managerTeam.ts';
test('manager limit includes blocked accounts but excludes legacy non-manager staff',()=>{
 assert.equal(MAX_MANAGERS,3);
 const users=[{id:'m1',role:'manager',isActive:true},{id:'m2',role:'manager',isActive:false},{id:'legacy',role:'manager',isManagerAccount:false},{id:'m3',role:'manager',isManagerAccount:true,isActive:true},{id:'owner',role:'admin'}];
 assert.deepEqual(managerAccounts(users).map(user=>user.id),['m1','m2','m3']);
});
