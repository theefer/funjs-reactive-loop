import Rx from 'rx';

const $Obs = Rx.Observable;

import reqwest from 'reqwest';

function analyseEntities(text) {
  const req = reqwest({
    url: 'https://juicer-cors.herokuapp.com/api/entities',
    method: 'post',
    type: 'json',
    crossOrigin: true,
    data: {text: text}
  });
  return Promise.resolve(req).then(resp => resp.entities.map(ent => ent.text));
}

// Memoize requests as results never change
const memo = new Map();

export function analyseEntities$(text) {
  if (! memo.has(text)) {
    memo.set(text, $Obs.fromPromise(analyseEntities(text)));
  }
  return memo.get(text);
}
