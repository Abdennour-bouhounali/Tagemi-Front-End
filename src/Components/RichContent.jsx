import { useMemo } from 'react';
import { sanitizeHtml } from '../utils/safeHtml';

// Figures (4, 2017, 446, 15%, 04/07/2017 ...) get a highlight span so key numbers stand out.
const NUMBER = /[0-9٠-٩]+(?:[.,:/][0-9٠-٩]+)*%?/g;
const SKIP = new Set(['A', 'H1', 'H2', 'H3', 'H4', 'SCRIPT', 'STYLE']);

export function enhanceHtml(html) {
    const clean = sanitizeHtml(html);
    if (!clean || typeof DOMParser === 'undefined') return clean;

    const doc = new DOMParser().parseFromString(`<div id="root">${clean}</div>`, 'text/html');
    const root = doc.getElementById('root');
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!NUMBER.test(n.nodeValue)) continue;
        NUMBER.lastIndex = 0;
        let skip = false;
        for (let p = n.parentNode; p && p !== root; p = p.parentNode) if (SKIP.has(p.nodeName)) skip = true;
        if (!skip) nodes.push(n);
    }
    nodes.forEach((node) => {
        const frag = doc.createDocumentFragment();
        let last = 0;
        node.nodeValue.replace(NUMBER, (match, offset) => {
            frag.append(node.nodeValue.slice(last, offset));
            const span = doc.createElement('span');
            span.className = 'num';
            span.textContent = match;
            frag.append(span);
            last = offset + match.length;
            return match;
        });
        frag.append(node.nodeValue.slice(last));
        node.replaceWith(frag);
    });
    return root.innerHTML;
}

export default function RichContent({ html, className = '' }) {
    const content = useMemo(() => enhanceHtml(html), [html]);
    return <div className={`rich-content ${className}`} dangerouslySetInnerHTML={{ __html: content }} />;
}
