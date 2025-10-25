import './HistoryCard.css';
import React, { useState } from 'react';

export default function HistoryCard({ title, items }) {
  const [expanded, setExpanded] = useState(true);

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <div className="card">
      <div className="card-header" onClick={handleToggle} style={{ cursor: 'pointer' }}>
        {title}
        <span
          className="triangle"
          style={expanded ? {} : { transform: 'rotate(180deg)' }}
        ></span>
      </div>
      {expanded && items && (
        <div className="card-body">
          {items.map((item, idx) => (
            <div key={idx}>{item}</div>
          ))}
        </div>
      )}
    </div>
  );
}