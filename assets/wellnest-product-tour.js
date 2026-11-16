const sections = [
  ['dashboard', 'Dashboard', 'See recent trends, daily care and upcoming appointments at a glance.'],
  ['chronic-pain', 'Chronic Pain', 'Log pain severity, locations, flare triggers and relief notes.'],
  ['asthma', 'Asthma', 'Keep peak flow readings, symptoms and your action plan together.'],
  ['epilepsy', 'Epilepsy', 'Record seizure events, warning signs, duration and recovery.'],
  ['medications', 'Medications', 'Organise prescriptions, dose times, eScripts and refills.'],
  ['appointments', 'Appointments', 'Review upcoming visits, clinic locations and preparation notes.'],
  ['care-circle', 'Care Circle', 'Keep your care team and emergency contacts within reach.'],
  ['exercises', 'Exercises', 'Log physiotherapy, movement, duration and intensity.'],
  ['reflection', 'Reflection', 'Make space for journaling, reminders and guided breathing.'],
  ['expenses', 'Expenses', 'Organise healthcare costs, receipts and supporting documents.'],
  ['emergency-plan', 'Emergency Plan', 'Keep essential medical details and emergency contacts together.'],
];

export function createProductTour({ jsx, jsxs }, { useEffect, useRef, useState }) {
  return function ProductTour() {
    const [selected, setSelected] = useState(0);
    const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [pointerInside, setPointerInside] = useState(false);
    const [focusInside, setFocusInside] = useState(false);
    const playing = !reducedMotion && !pointerInside && !focusInside;
    const controls = useRef(null);

    useEffect(() => {
      if (!playing) return;
      const timer = window.setTimeout(() => setSelected(index => (index + 1) % sections.length), 6000);
      return () => window.clearTimeout(timer);
    }, [playing, selected]);

    useEffect(() => {
      const row = controls.current;
      const active = row.querySelector('[aria-pressed="true"]');
      const rowBounds = row.getBoundingClientRect();
      const activeBounds = active.getBoundingClientRect();
      if (activeBounds.left < rowBounds.left) {
        row.scrollLeft += activeBounds.left - rowBounds.left;
      } else if (activeBounds.right > rowBounds.right) {
        row.scrollLeft += activeBounds.right - rowBounds.right;
      }
    }, [selected]);

    const [slug, label, description] = sections[selected];
    const screenshot = '/wellnest-website/landing/product-tour/' + slug + '.webp';

    return jsx('section', {
      className: 'hb-product-tour',
      'aria-label': 'Explore WellNest',
      children: jsx('div', {
        className: 'hb-container',
        children: jsxs('div', {
          className: playing ? 'hb-fc hb-product-tour-card' : 'hb-fc hb-product-tour-card is-paused',
          onMouseEnter: () => setPointerInside(true),
          onMouseLeave: () => setPointerInside(false),
          onFocus: () => setFocusInside(true),
          onBlur: event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
          },
          children: [
            jsx('div', {
              className: 'hb-fc-tabs hb-product-tour-controls',
              ref: controls,
              role: 'group',
              'aria-label': 'Choose a section to preview',
              children: sections.map(([id, title], index) => jsxs('button', {
                type: 'button',
                className: index === selected ? 'hb-fc-tab is-active' : 'hb-fc-tab',
                'aria-pressed': index === selected,
                'aria-controls': 'hb-product-tour-preview',
                onClick: () => setSelected(index),
                children: [title, jsx('span', { className: 'hb-fc-tab-bar', 'aria-hidden': true })],
              }, id)),
            }),
            jsxs('figure', {
              id: 'hb-product-tour-preview',
              children: [
                jsx('div', {
                  className: 'hb-product-tour-screenshots hb-fc-shimmer',
                  children: sections.map(([id, title], index) => jsx('img', {
                    className: index === selected ? 'is-active' : undefined,
                    src: '/wellnest-website/landing/product-tour/' + id + '.webp',
                    alt: 'WellNest ' + title + ' interface',
                    'aria-hidden': index !== selected,
                    loading: 'lazy',
                    decoding: 'async',
                    width: 1440,
                    height: 1335,
                  }, id)),
                }),
                jsxs('figcaption', {
                  children: [
                    jsxs('div', {
                      'aria-live': playing ? 'off' : 'polite',
                      children: [jsx('strong', { children: label }), jsx('p', { children: description })],
                    }),
                    jsx('a', { className: 'hb-fc-share', href: screenshot, target: '_blank', rel: 'noopener', children: 'Open full screenshot ↗' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    });
  };
}
