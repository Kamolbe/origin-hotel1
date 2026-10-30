import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapPreviewUrl } from '../src/services/mapPreview.ts';
test('Google map links preserve exact coordinates, searches, place names and embeds',()=>{
  assert.equal(new URL(mapPreviewUrl('https://www.google.com/maps/place/Hotel/@40,60,16z/data=!3d41.3!4d69.2','Elsewhere')).searchParams.get('q'),'41.3,69.2');
  assert.equal(new URL(mapPreviewUrl('https://maps.google.com/?q=Origin+Hotel','Elsewhere')).searchParams.get('q'),'Origin Hotel');
  assert.equal(new URL(mapPreviewUrl('https://www.google.com/maps/place/Origin+Hotel','Elsewhere')).searchParams.get('q'),'Origin Hotel');
  assert.equal(new URL(mapPreviewUrl('https://maps.google.com/?cid=12345','Elsewhere')).searchParams.get('cid'),'12345');
  assert.equal(mapPreviewUrl('https://www.google.com/maps/embed?pb=example','Elsewhere'),'https://www.google.com/maps/embed?pb=example');
});
test('resolved short links use saved Google embed and arbitrary embed hosts are ignored',()=>{
  const saved='https://www.google.com/maps?q=41.3%2C69.2&output=embed';
  assert.equal(mapPreviewUrl('https://maps.app.goo.gl/example','Elsewhere',saved),saved);
  assert.equal(new URL(mapPreviewUrl('https://example.test','Hotel address','https://evil.test/iframe')).hostname,'www.google.com');
});
