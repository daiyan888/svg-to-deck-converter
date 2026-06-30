const appRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/_app-79fce728354456d7.js',
);
const appJs = await appRes.text();

const idx = appJs.indexOf('getTemplates');
console.log(appJs.slice(idx - 100, idx + 3000));
