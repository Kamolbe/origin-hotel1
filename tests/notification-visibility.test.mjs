import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSeeNotification } from '../src/services/notificationVisibility.ts';
const admin={id:'a',role:'admin'},manager={id:'m',role:'manager'},guest={id:'g',role:'user'};
test('booking operations go to manager inbox, private outcomes only to their guest',()=>{
 const shared={type:'booking'},own={type:'booking',userId:'g'};
 assert.equal(canSeeNotification(manager,shared),true);
 assert.equal(canSeeNotification(admin,shared),false);
 assert.equal(canSeeNotification(guest,shared),false);
 assert.equal(canSeeNotification(guest,own),true);
 assert.equal(canSeeNotification(manager,own),false);
 assert.equal(canSeeNotification(admin,{type:'booking',userId:'a'}),false);
 assert.equal(canSeeNotification(null,shared),false);
});
test('owner retains salary notifications and shared financial oversight',()=>{
 assert.equal(canSeeNotification(admin,{type:'system',userId:'a'}),true);
 assert.equal(canSeeNotification(manager,{type:'system',userId:'a'}),false);
 assert.equal(canSeeNotification(admin,{type:'payment'}),true);
 assert.equal(canSeeNotification(guest,{type:'payment'}),false);
});
