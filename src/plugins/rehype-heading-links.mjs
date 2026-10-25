// Appends a "§" link to every h2/h3 so any section can be linked to directly.
const text = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');

export default function rehypeHeadingLinks() {
  const walk = (node) => {
    if (node.type === 'element' && /^h[23]$/.test(node.tagName) && node.properties?.id) {
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['anchor'],
          href: `#${node.properties.id}`,
          ariaLabel: `Link to section: ${text(node).trim()}`,
        },
        children: [{ type: 'text', value: '§' }],
      });
      return;
    }
    node.children?.forEach(walk);
  };
  return walk;
}
