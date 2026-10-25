// Lets posts link to other pages as "/posts/x/" and still work when the site
// lives under a base path (GitHub project pages): prefixes root-relative URLs.
export default function rehypeBaseLinks({ base = '/' } = {}) {
  const prefix = base.replace(/\/$/, '');
  const fix = (url) =>
    prefix && typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') &&
    url !== prefix && !url.startsWith(`${prefix}/`)
      ? `${prefix}${url}`
      : url;
  const walk = (node) => {
    if (node.type === 'element') {
      if (node.properties?.href) node.properties.href = fix(node.properties.href);
      if (node.properties?.src) node.properties.src = fix(node.properties.src);
    }
    node.children?.forEach(walk);
  };
  return prefix ? walk : () => {};
}
