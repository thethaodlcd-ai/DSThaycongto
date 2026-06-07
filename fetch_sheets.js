import https from 'https';

https.get('https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/export?format=csv&gid=0', (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => { console.log(body.substring(0, 500)); });
});
