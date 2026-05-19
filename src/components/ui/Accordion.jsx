import { useState, useRef, useEffect } from 'react';

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  forceOpen,
  level = 'h3',
  badge,
  domRef,
  id,
}) {
  const initOpen = forceOpen !== undefined ? forceOpen : defaultOpen;
  const [open, setOpen] = useState(initOpen);
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(initOpen ? 'auto' : '0px');

  // When forceOpen changes (search activates / clears), sync internal state
  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpen(forceOpen);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (open) {
      const h = bodyRef.current.scrollHeight;
      setHeight(`${h}px`);
      const t = setTimeout(() => setHeight('auto'), 290);
      return () => clearTimeout(t);
    } else {
      // Must set explicit height first so the transition has a "from" value
      setHeight(`${bodyRef.current.scrollHeight}px`);
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight('0px')));
    }
  }, [open]);

  const Tag = level;

  return (
    <div id={id} ref={domRef} className={`accordion-item${open ? ' open' : ''}`}>
      <button
        className="accordion-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <Tag className="accordion-title">
          {title}
          {badge && <span className="accordion-badge">{badge}</span>}
        </Tag>
        <span className="accordion-chevron" aria-hidden="true" />
      </button>
      <div
        className="accordion-body"
        ref={bodyRef}
        style={{
          height,
          overflow: height === 'auto' ? 'visible' : 'hidden',
        }}
      >
        <div className="accordion-inner">{children}</div>
      </div>
    </div>
  );
}

export function Accordion({ items, defaultOpenIndex = -1, level }) {
  return (
    <div className="accordion">
      {items.map((item, i) => (
        <AccordionItem
          key={item.title ?? i}
          title={item.title}
          badge={item.badge}
          defaultOpen={i === defaultOpenIndex}
          level={level}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}
