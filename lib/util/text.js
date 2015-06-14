import h from 'virtual-dom/h';
import VText from 'virtual-dom/vnode/vtext';

function highlight(nodes, string) {
  return nodes.reduce((final, node) => {
    // If a text node, try to split it and emphasise string
    if (node.type === 'VirtualText') {
      const index = node.text.indexOf(string);
      if (index !== -1) {
        const before = node.text.slice(0, index);
        const after = node.text.slice(index + string.length);
        return final.concat(new VText(before), h('em', string), new VText(after));
      } else {
        return final.concat(node);
      }
    } else {
      return final.concat(node);
    }
  }, []);
}


export function highlightEntitiesInText(text, entities) {
  if (entities.length === 0) {
    return text;
  } else {
    return entities.reduce((nodes, entity) => {
      return highlight(nodes, entity);
    }, [new VText(text)]);
  }
}
