import h from 'virtual-dom/h';

import Rx from 'rx';

import {$initThen, $sink} from '../lib/util/reactive';


function checkboxElement(checked, changes$) {
    return h('input', {
        type: 'checkbox',
        checked: checked,
        onchange: $sink(changes$)
    });
}

function checkboxView() {
    const changes$ = new Rx.Subject;
    return {
        events: {
            changes$: changes$.asObservable()
        },
        render(checked) {
            return checkboxElement(checked, changes$);
        }
    };
}

function checkboxModel(intent, initiallyChecked) {
    return {
        checked$: $initThen(initiallyChecked, intent.changeChecked$)
    };
}

function checkboxIntent(view) {
    return {
        changeChecked$: view.events.changes$.
            map(ev => ev.target.checked)
    };
}


// TODO: control disabled
// TODO: allow external setting of value
export function checkbox(initiallyChecked = false) {
    const view = checkboxView();
    const intent = checkboxIntent(view);
    const model = checkboxModel(intent, initiallyChecked);

    return {
        model: model,
        tree$: model.checked$.map(view.render)
    };
};
