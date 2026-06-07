import { readFileSync } from 'fs';
fetch('https://docs.google.com/spreadsheets/d/1eAoUT8U-vRVU8RBF8TrdvFoZmRiEzRR1Tnq3oiwgia0/gviz/tq?tqx=out:csv').then(res => res.text()).then(text => console.log(text.substring(0, 500)));
