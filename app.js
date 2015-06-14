import h from 'virtual-dom/h';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';

import Rx from 'rx';

import virtualize from 'vdom-virtualize';


// Convenience alias
const $Obs = Rx.Observable;


// (fake) Twitter API
import {getTweetStream$}         from './lib/twitter-api';

// Helpers
import {analyseEntities$}        from './lib/analyser';
import {highlightEntitiesInText} from './lib/util/text';
import {container$}              from './lib/util/reactive';

import {input}            from './components/input';
import {labelledCheckbox} from './components/checkbox/labelled';




function filtersComponent() {
  const queryInput = input({placeholder: 'Filter tweets…'});
  const excludeReplies = labelledCheckbox('exclude @-replies');

  function view$() {
    return container$('form', [queryInput.tree$, excludeReplies.tree$]);
  }

  return {
    model: {
      query$:       queryInput.model.value$,
      exclReplies$: excludeReplies.model.checked$
    },
    view$
  };
}


function tweetElement(tweet, entities) {
  return h(`article.tweet.tweet-${tweet.id}`, [
    h('img.tweet__avatar', {src: tweet.user.profile_image_url}),
    h('div.tweet__content', [
      h('div', [
        h('span.tweet__author', tweet.user.name),
        h('span.tweet__handle', `@${tweet.user.screen_name}`)
      ]),
      highlightEntitiesInText(tweet.text, entities)
    ])
  ]);
}

function columnComponent(heading) {
  const activate$ = new Rx.Subject;

  function view$(tweets$) {
    const tweetList$ = tweets$.flatMap(tweets => {
      return container$('ol', tweets.map(tweet => {
        return analyseEntities$(tweet.text).
          startWith([]).
          map(entities => tweetElement(tweet, entities)).
          map(tweetTree => h('li', {
            onclick: ev => activate$.onNext(tweet)
          }, tweetTree));
      }));
    });

    const tree$ = tweetList$.map(tweetList => {
      return h('section.tweets-column', [
        h('h2', heading),
        tweetList
      ]);
    });

    return tree$;
  }

  return {
    intents: {
      activate$
    },
    view$
  };
}

function columnsComponent() {
  const timeline = columnComponent('Timeline');
  const pinned   = columnComponent('Pinned');

  function view$(timelineTweets$, pinnedTweets$) {
    return container$('div', [
      timeline.view$(timelineTweets$),
      pinned.view$(pinnedTweets$)
    ]);
  }

  return {
    intents: {
      pin$:   timeline.intents.activate$,
      unpin$: pinned.intents.activate$
    },
    view$
  };
}


function isReply(tweet) {
  return tweet.text[0] !== '@';
}

function view() {
  const filters = filtersComponent();

  const query$ = filters.model.query$;
  const exclReplies$ = filters.model.exclReplies$;

  const tweets$ = getTweetStream$();
  const filteredTweets$ = $Obs.combineLatest(
    tweets$,
    query$,
    exclReplies$,
    (tweets, query, exclReplies) => {
      return tweets.
        filter(tweet => tweet.text.match(new RegExp(query, 'i'))).
        filter(tweet => exclReplies ? isReply(tweet) : true);
    });

  const columns = columnsComponent();

  const pinActions$ = $Obs.merge(
    columns.intents.pin$.map(tweet => tweets => {
      if (tweets.find(tw => tw.id === tweet.id)) {
        return tweets;
      } else {
        return [].concat(tweet, tweets);
      }
    }),
    columns.intents.unpin$.map(tweet => tweets => tweets.filter(tw => tw.id !== tweet.id))
  );

  const pinnedTweets$ = pinActions$.
    scan([], (pinnedTweets, stepFn) => stepFn(pinnedTweets)).
    startWith([]);

  const tree$ = container$('div', [
    filters.view$(),
    columns.view$(filteredTweets$, pinnedTweets$)
  ]);

  return {
    tree$
  };
}


/* == You shouldn't have to touch the stuff below == */

const out = document.getElementById('out');

const initialDom = virtualize(out);

const theView = view();

theView.tree$.
    startWith(initialDom).
    bufferWithCount(2, 1).
    filter(pair => pair.length === 2).
    map(([last, current]) => diff(last, current)).
    reduce((out, patches) => patch(out, patches), out).
    subscribeOnError(err => console.error(err));
