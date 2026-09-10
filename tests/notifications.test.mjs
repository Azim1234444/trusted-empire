import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { notifyOrder } from '../lib/notifications.ts';
const origin='https://example.test';
function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_mighty_beyonder.sql',import.meta.url),'utf8'));
 const DB = {
   prepare(query) {
     return {
       bind(...values) {
         const statement = sql.prepare(query);
         return {
           async first() { return statement.get(...values) ?? null; },
           async run() { return { meta: { changes: Number(statement.run(...values).changes) } }; },
         };
       },
     };
   },
 };
 const env={DB,TELEGRAM_BOT_TOKEN:'test-token',TELEGRAM_ADMIN_CHAT_ID:'123',SITE_ORIGIN:origin};
 const sent=[];const transport=async(url,options)=>{sent.push(JSON.parse(options.body));return Response.json({ok:true,result:{message_id:42}})};
 return {env,sent,transport,sql};
}
function request(overrides={},source=origin){return new Request(origin+'/api/notify-order',{method:'POST',headers:{origin:source,'Content-Type':'application/json','cf-connecting-ip':'127.0.0.1'},body:JSON.stringify({requestId:crypto.randomUUID(),planId:'netflix',months:2,name:'Aina',contact:'@ainatest',paymentClaimed:true,...overrides})})}
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=', 'base64');
async function upload(id, bytes=png, type='image/png') {
 const form=new FormData();
 form.set('payload', await request({requestId:id}).text());
 form.set('receipt',new Blob([bytes],{type}),'private-original-name.png');
 return new Request(origin+'/api/notify-order',{method:'POST',headers:{origin,'cf-connecting-ip':'127.0.0.1'},body:form});
}
test('receipt is sent privately with order caption, preserves bytes and deduplicates',async()=>{
 const s=setup(),id=crypto.randomUUID();let calls=0;
 const transport=async(url,options)=>{
  calls++;assert.match(url,/sendDocument$/);assert.equal(options.body.get('chat_id'),'123');
  const doc=options.body.get('document');assert.equal(doc.name,`resit-${id}.png`);
  assert.deepEqual(Buffer.from(await doc.arrayBuffer()),png);
  assert.match(options.body.get('caption'),/RM33.00/);assert.match(options.body.get('caption'),/MENUNGGU SEMAKAN/);
  assert.ok(options.body.get('caption').length<=1024);
  return Response.json({ok:true,result:{message_id:45}});
 };
 assert.equal((await notifyOrder(await upload(id),s.env,transport)).status,200);
 assert.equal((await notifyOrder(await upload(id),s.env,transport)).status,200);
 assert.equal((await notifyOrder(await upload(id,Buffer.concat([png,Buffer.from('changed')])),s.env,transport)).status,409);
 assert.equal(calls,1);s.sql.close();
});
test('invalid or oversized receipt never reaches Telegram',async()=>{
 const s=setup();for(const [data,type] of [[Buffer.from('<svg/>'),'image/png'],[png,'text/html'],[Buffer.alloc(0),'image/png'],[Buffer.alloc(5*1024*1024+1),'image/png']]){
 const r=await notifyOrder(await upload(crypto.randomUUID(),data,type),s.env,s.transport);assert.ok([400,413].includes(r.status));
 }assert.equal(s.sent.length,0);s.sql.close();
});
test('uncertain document delivery is not automatically resent',async()=>{
 const s=setup(),id=crypto.randomUUID();let calls=0;const transport=async()=>{calls++;throw Error('timeout')};
 assert.equal((await notifyOrder(await upload(id),s.env,transport)).status,502);
 assert.equal((await notifyOrder(await upload(id),s.env,transport)).status,409);
 assert.equal(calls,1);s.sql.close();
});
test('notifies once, uses server price and retains pending review',async()=>{const s=setup(),id=crypto.randomUUID();const r=await notifyOrder(request({requestId:id,amount:1}),s.env,s.transport);assert.equal(r.status,200);assert.equal((await r.json()).paymentStatus,'pending_review');assert.match(s.sent[0].text,/RM33.00/);assert.match(s.sent[0].text,/MENUNGGU SEMAKAN/);assert.equal(s.sent[0].chat_id,'123');assert.equal((await notifyOrder(request({requestId:id}),s.env,s.transport)).status,200);assert.equal(s.sent.length,1);assert.equal((await notifyOrder(request({requestId:id,name:'Other'}),s.env,s.transport)).status,409);s.sql.close()});
test('rejects unsupported plans, terms, invalid contacts and unclaimed payment',async()=>{const s=setup();for(const values of [{planId:'iptv'},{planId:'__proto__'},{planId:'viu',months:2},{months:0},{contact:'abc'},{name:'A\nSTATUS: PAID'},{paymentClaimed:false}])assert.equal((await notifyOrder(request(values),s.env,s.transport)).status,400);assert.equal(s.sent.length,0);s.sql.close()});
test('rejects cross-origin requests and missing configuration',async()=>{const s=setup();assert.equal((await notifyOrder(request({},'https://evil.test'),s.env,s.transport)).status,403);assert.equal((await notifyOrder(request(),{...s.env,TELEGRAM_ADMIN_CHAT_ID:''},s.transport)).status,503);assert.equal(s.sent.length,0);s.sql.close()});
test('limits fresh requests without blocking idempotent repeat',async()=>{const s=setup(),id=crypto.randomUUID();for(let i=0;i<5;i++)assert.equal((await notifyOrder(request(i===0?{requestId:id}:{}),s.env,s.transport)).status,200);assert.equal((await notifyOrder(request(),s.env,s.transport)).status,429);assert.equal((await notifyOrder(request({requestId:id}),s.env,s.transport)).status,200);assert.equal(s.sent.length,5);s.sql.close()});
test('uncertain delivery never reports success or resends automatically',async()=>{const s=setup(),id=crypto.randomUUID();let attempts=0;const failing=async()=>{attempts++;throw new Error('timeout')};assert.equal((await notifyOrder(request({requestId:id}),s.env,failing)).status,502);assert.equal((await notifyOrder(request({requestId:id}),s.env,failing)).status,409);assert.equal(attempts,1);s.sql.close()});
