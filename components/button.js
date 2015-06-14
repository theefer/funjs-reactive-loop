import h from 'virtual-dom/h';

import Rx from 'rx';

import {$initThen, $sink} from '../lib/util/reactive';


function buttonElement(label, clicks$) {
    return h('button', {
        onclick: $sink(clicks$)
    }, label);
}

function buttonView(label) {
    const clicks$ = new Rx.Subject;
    return {
        events: {
            clicks$: clicks$.asObservable()
        },
        render() {
            return buttonElement(label, clicks$);
        }
    };
}

function buttonIntent(view) {
    return {
        activated$: view.events.clicks$.
            map(ev => ev.target)
    };
}

// TODO: control disabled
export function button(label) {
    const view = buttonView(label);
    const intent = buttonIntent(view);

    return {
        intents: intent,
        // static but as Observable for interface consistency
        tree$: Rx.Observable.return(view.render())
    };
};
