import { useState } from 'react';
import { resolveDocSources } from '../../data/docSources.js';

export function DocLinksPanel({ docIds }) {
  const [expanded, setExpanded] = useState(false);
  const sources = resolveDocSources(docIds ?? []);
  if (!sources.length) return null;

  const byVendor = sources.reduce((acc, src) => {
    if (!acc[src.vendor]) acc[src.vendor] = { color: src.vendorColor, items: [] };
    acc[src.vendor].items.push(src);
    return acc;
  }, {});

  const vendorCount  = Object.keys(byVendor).length;
  const sourceCount  = sources.length;

  return (
    <section className="doc-links-panel">
      <button
        type="button"
        className="doc-links-header doc-links-toggle"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="doc-links-header-left">
          <span className="doc-links-badge">Based on Official Documentation</span>
          <h4>Official Docs &amp; References</h4>
          <p>
            {sourceCount} {sourceCount === 1 ? 'reference' : 'references'} across {vendorCount} {vendorCount === 1 ? 'source' : 'sources'}
          </p>
        </div>
        <span className="doc-links-chevron" aria-hidden="true">
          {expanded ? '▴' : '▾'}
        </span>
      </button>
      {expanded && (
        <div className="doc-links-groups">
          {Object.entries(byVendor).map(([vendor, { color, items }]) => (
            <div key={vendor} className="doc-links-vendor-group">
              <span className="doc-links-vendor-label" style={{ '--vendor-color': color }}>
                {vendor}
              </span>
              <ul className="doc-links-list">
                {items.map(src => (
                  <li key={src.id} className="doc-links-item">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-links-link"
                      style={{ '--vendor-color': color }}
                    >
                      <span className="doc-links-title">{src.title}</span>
                      <span className="doc-links-desc">{src.description}</span>
                      <span className="doc-links-arrow" aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
