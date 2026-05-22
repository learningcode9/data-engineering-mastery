import { useState, useRef, useEffect } from 'react';

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  controlledOpen,
  onOpenChange,
  level = 'h3',
  badge,
  badgeVariant,
  domRef,
  id,
}) {
  const initOpen = controlledOpen ?? defaultOpen;
  const [internalOpen, setInternalOpen] = useState(initOpen);
  const open = controlledOpen ?? internalOpen;
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(initOpen ? 'auto' : '0px');

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
  const handleToggle = () => {
    const next = !open;
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div id={id} ref={domRef} className={`accordion-item${open ? ' open' : ''}`}>
      <button
        className="accordion-trigger"
        type="button"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <Tag className="accordion-title">
          {title}
          {badge && (
            <span className={`accordion-badge${badgeVariant ? ` accordion-badge--${badgeVariant}` : ''}`}>
              {badge}
            </span>
          )}
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
