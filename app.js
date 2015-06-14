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
  /* TODO [#1b]: Rewrite to use richer virtual-dom representation
   *
   * For best results using the pre-existing CSS,
   * use the following markup:
   *
   * <article class="tweet tweet-123id">
   *    <img class="tweet__avatar" src="...">
   *    <div class="tweet__content">
   *       <div>
   *           <span class="tweet_author">The Guardian</span>
   *           <span class="tweet_handle">@guardian</span>
   *       </div>
   *       All your <em>quinoa</em> are belong to us.
   *    </div>
   * </article>
   *
   * See hyperscript documentation:
   * https://github.com/Matt-Esch/virtual-dom/blob/master/virtual-hyperscript/README.md
   */
  return h(`article.tweet.tweet-${tweet.id}`, [
    h('div.tweet__content', [
      tweet.text
    ])
  ]);

  /* TODO [#4b]: Pass in the entities returned by analyseEntities$ to
   *             this function and use them to highlight words in the
   *             tweet text.
   *             The highlightEntitiesInText(text, entities) function
   *             returns a virtual-dom fragment that highlights the
   *             given entities in the text.
   */
}

function columnComponent(heading) {
  const activate$ = new Rx.Subject;
  /* TODO [#3a]: Push a tweet object onto the activate$ stream
   *             (`activate$.onNext(tweet)`) every time a tweet
   *             element is clicked (use the `onclick` attribute).
   */

  function view$(tweets$) {
    /* TODO [#1a]: Define tweetList$ that maps the tweets$ stream to a
     *             virtual-dom rendering of a list of tweets.
     *
     * Hint: you will likely want to use `tweetElement` to render each
     * tweet...
     */
    // const tweetList$ = tweets$.map(tweets => {
    //   return h('div', ??? );
    // });
    const tweetList$ = $Obs.return(h('div', 'Tweets to appear here…'));

    /* TODO [#4a]: For each tweet, extract the entities in the
     *             tweet.text using analyseEntities$, which returns a
     *             stream of one element - the array of entities found
     *             in that string.
     *
     *             Bonus: don't wait until the entities have been
     *             extracted to render the element; we can simply
     *             assume there are no entities initially (see
     *             the startWith operator).
     *
     * Hint: remember that if your mapping function returns a stream,
     *       you will need to use flatMap instead of map.
     *
     * Hint: you can use the container$ helper to wrap a list of
     *       streams of virtual-dom into a parent element, e.g.:
     *
     *   container$('div', [tree1$, tree$2])
     *   // returns a stream combining tree1$ and tree2$ in a <div>
     */

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


function view() {
  const filters = filtersComponent();

  const query$ = filters.model.query$;
  const exclReplies$ = filters.model.exclReplies$;

  const tweets$ = getTweetStream$();

  /* TODO [#2]: Update the definition of filteredTweets$ to combine
   *            tweets$ with the two filters above:
   *            - query$: each tweet.text should match the query string
   *            - exclReplies$: if true, exclude tweets starting with an '@'
   *
   * Hint: you may want to use the combineLatest operator:
   * https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/combinelatest.md
   */
  const filteredTweets$ = tweets$;

  const columns = columnsComponent();

  /* TODO [#3b]: Implement pinnedTweets$ using the
   *             `columns.intents.pin$` stream, which is a stream of
   *             tweet objects clicked for pinning.
   *             We want pinnedTweets$ to be a stream, each item of
   *             which is an array of pinned tweets (most recently
   *             pinned first).
   *             For bonus points, don't allow the same tweet to be
   *             pinned twice.
   *
   * Hint: Use the scan operator, starting from an empty array (no
   * tweet pinned initially):
   * https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/scan.md
   */
  const pinnedTweets$ = $Obs.return([]);

  /* TODO [#3c]: Update pinnedTweets$ to also use the
   *             `columns.intents.unpin$` stream, which is a stream of
   *             tweet objects clicked for unpinning.
   *
   * Hint: It may help to think of pin$ and unpin$ as stream of
   * functions applied onto the current state (i.e. the array of
   * pinned tweets).
   * You may also find the merge operator useful:
   * https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/merge.md
   */

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
