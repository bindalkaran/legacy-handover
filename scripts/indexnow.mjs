// Notifies Bing/Yandex (IndexNow) that public URLs changed. Run after a content deploy:
//   node scripts/indexnow.mjs
const KEY = '808c1486cd5e7a578839f60de6ae1724';
const HOST = 'legacyhandover.com';
const xml = await (await fetch('https://' + HOST + '/sitemap.xml')).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList })
});
console.log('IndexNow', r.status, urlList.length, 'urls');
