import { useState } from 'react';

export function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="code-block">
      {label && <span className="code-block-label">{label}</span>}
      <div className="code-block-wrap">
        <pre>{code}</pre>
        <button
          type="button"
          className="copy-btn icon-button"
          onClick={handleCopy}
          aria-label="Copy code"
          title="Copy"
        >
          {copied ? '✓' : '⎘'}
        </button>
      </div>
    </div>
  );
}
