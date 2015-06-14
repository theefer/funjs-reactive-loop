import Rx from 'rx';

const $Obs = Rx.Observable;

import tweetsFunJS    from '../data/funjsldn.json!';
import tweetsFavs     from '../data/favourites.json!';
import tweetsGuardian from '../data/guardian.json!';

const tweets = [].
        // Merge in random order
        concat(tweetsFavs, tweetsFunJS, tweetsGuardian).
        sort((a, b) => Math.random() < 0.5 ? -1 : 1);

function rand(min, max) {
  return (Math.random() * (max - min)) + min;
}

const minDelay = 300;
const maxDelay = 2000;

function randDelay$() {
  return $Obs.return().
    delay(rand(minDelay, maxDelay)).
    concat($Obs.defer(randDelay$));
}


// Random timer to simulate tweets posting
const randomTimer$ = randDelay$();


function pace$(source$, ticker$) {
  return source$.zip(ticker$, (value, _) => value);
}

export function getTweetStream$() {
  const tweets$ = $Obs.from(tweets);
  return pace$(tweets$, randomTimer$).
    scan([], (all, tweet) => [].concat(tweet, all));
}
