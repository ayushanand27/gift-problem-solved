'use client';

import { useState } from 'react';

// A quiet list. Pointing at a goal brings its photograph forward beside the words.
export default function GoalsShowcase({ goals }) {
  const [active, setActive] = useState(0);
  return (
    <div className="showcase">
      <ul className="showcase-list">
        {goals.map((goal, i) => (
          <li key={goal.title}>
            <button
              type="button"
              className={i === active ? 'showcase-item active' : 'showcase-item'}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={i === active}
            >
              <span className="numeral">{String(i + 1).padStart(2, '0')}</span>
              <span className="showcase-title">{goal.title}</span>
              <span className="showcase-line">{goal.line}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="showcase-frame" aria-hidden="true">
        {goals.map((goal, i) => (
          <img key={goal.title} src={goal.image} alt="" loading="lazy" decoding="async" className={i === active ? 'active' : ''} />
        ))}
      </div>
    </div>
  );
}
