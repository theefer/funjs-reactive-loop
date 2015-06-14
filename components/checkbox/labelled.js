import h from 'virtual-dom/h';

import {checkbox} from '../checkbox';


export function labelledCheckbox(label, initiallyChecked) {
    const choice = checkbox(initiallyChecked);
    return {
        model: choice.model,
        tree$: choice.tree$.map(cbEl => {
            return h('label', [cbEl, label]);
        })
    };
};
