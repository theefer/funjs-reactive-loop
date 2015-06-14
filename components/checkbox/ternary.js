import h from 'virtual-dom/h';

import Rx from 'rx';

import {labelledCheckbox} from './labelled';


const $combine = Rx.Observable.combineLatest;

export function ternaryCheckbox(trueLabel, falseLabel) {
    // FIXME: configurable initial values
    const trueCb = labelledCheckbox(trueLabel, true);
    const falseCb = labelledCheckbox(falseLabel, true);
    return {
        model: {
            value$: $combine(trueCb.model.checked$,
                             falseCb.model.checked$,
                             (isTrue, isFalse) => {
                if (isTrue && !isFalse)      return true;
                else if (!isTrue && isFalse) return false;
                // else return undefined
            }),
            invalid$: $combine(trueCb.model.checked$,
                               falseCb.model.checked$,
                               (isTrue, isFalse) => {
                return isTrue && isFalse;
            })
        },
        tree$: $combine(trueCb.tree$, falseCb.tree$, (...views) => h('span', views))
    };
};
