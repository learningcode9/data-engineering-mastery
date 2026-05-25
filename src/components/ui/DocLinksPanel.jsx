import { resolveDocSources } from '../../data/docSources.js';

export function DocLinksPanel({ docIds }) {
  const sources = resolveDocSources(docIds ?? []);
  if (!sources.length) return null;

  // Group by vendor
  const byVendor = sources.reduce((acc, src) => {
    if (!acc[src.vendor]) acc[src.vendor] = { color: src.vendorColor, items: [] };
    acc[src.vendor].items.push(src);
    return acc;
  }, {});

  return (
    <section className="doc-links-panel">
      <div className="doc-links-header">
        <span className="doc-links-badge">Based on Official Documentation</span>
        <h4>Official Docs & References</h4>
        <p>These resources are the authoritative source for the concepts covered in this topic.</p>
      </div>
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
    </section>
  );
}
