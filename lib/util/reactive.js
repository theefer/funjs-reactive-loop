import h from 'virtual-dom/h';
import Rx from 'rx';


// FIXME: not exporting correctly?
// export var $combine = Rx.Observable.combineLatest;

export function $init(value) {
    return Rx.Observable.return(value);
};

// Note: lazyConcat must be a lazy lambda as JS doesn't support call-by-name
export function $initThen(value, nextValues$) {
    return $init(value).concat(nextValues$);
};


export function $sink(subject) {
    return (value) => subject.onNext(value);
};

export function sequenceCombine$(observables$) {
  // Work around odd behaviour of combineLatest with empty Array
  // (never yields a value)
  if (observables$.length === 0) {
    return Rx.Observable.return([]);
  } else {
    return Rx.Observable.combineLatest(observables$, (...all) => all);
  }
}

export function container$(tagName, children) {
  return sequenceCombine$(children).
    map(views => h(tagName, [...views]));
}
