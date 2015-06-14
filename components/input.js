import h from 'virtual-dom/h';

import Rx from 'rx';

import {$initThen, $sink} from '../lib/util/reactive';


function inputElement(value, changes$, options = {}) {
    return h('input', {
        type: 'text',
        value: value,
        placeholder: options.placeholder,
        oninput: $sink(changes$)
    });
}


function inputView(options) {
    const changes$ = new Rx.Subject;
    return {
        events: {
            changes$: changes$.asObservable()
        },
        render(value) {
            return inputElement(value, changes$, options);
        }
    };
}

function inputModel(intent) {
    return {
        value$: $initThen('', intent.changed$)
    };
}

function inputIntent(view) {
    return {
        changed$: view.events.changes$.
            map(ev => ev.target.value)
    };
}


// TODO: control disabled
// TODO: allow external setting of value
export function input(options) {
    const view = inputView(options);
    const intent = inputIntent(view);
    const model = inputModel(intent);

    return {
        model: model,
        tree$: model.value$.map(view.render)
    };
};
