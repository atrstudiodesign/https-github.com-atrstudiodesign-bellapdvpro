import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSaleCommissions } from '../src/lib/commissionCore.ts';
const sample = {
  id: 'saleA', companyId: 'companyA', status: 'completed' as const,
  items: [{id:'cut',professionalId:'prof1',priceCents:10990,quantity:2},{id:'cream',priceCents:2999,quantity:1}]
};
const assignment = { uid:'staffA',companyId:'companyA',professionalId:'prof1',active:true,rateBasisPoints:3500 };
test('calculates only assigned eligible items in integer cents',()=>{
  const result=calculateSaleCommissions(sample,[assignment]);
  assert.equal(result.length,1);
  assert.equal(result[0].totalEligibleCents,21980);
  assert.equal(result[0].amountCents,7693);
  assert.equal(result[0].id,'saleA_prof1');
});
test('denies commissions for cancelled/pending sale',()=>{
  assert.deepEqual(calculateSaleCommissions({...sample,status:'cancelled'},[assignment]),[]);
  assert.deepEqual(calculateSaleCommissions({...sample,status:'pending'},[assignment]),[]);
});
test('excludes other companies and disabled professionals',()=>{
  assert.deepEqual(calculateSaleCommissions(sample,[{...assignment,companyId:'companyB'}]),[]);
  assert.deepEqual(calculateSaleCommissions(sample,[{...assignment,active:false}]),[]);
});
test('rejects invalid rates and duplicate professional assignments',()=>{
  assert.throws(()=>calculateSaleCommissions(sample,[{...assignment,rateBasisPoints:10001}]));
  assert.throws(()=>calculateSaleCommissions(sample,[assignment,{...assignment,uid:'staffOther'}]));
});
test('rejects invalid amounts and quantities',()=>{
  assert.throws(()=>calculateSaleCommissions({...sample,items:[{id:'cut',professionalId:'prof1',priceCents:-100,quantity:1}]},[assignment]));
  assert.throws(()=>calculateSaleCommissions({...sample,items:[{id:'cut',professionalId:'prof1',priceCents:100,quantity:0}]},[assignment]));
});
