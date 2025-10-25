import HistoryCard from './HistoryCard';
import React from 'react';
import './HistoryPage.css';

const historyData = [
  {
    title: "Sunday, August 24 - Calisthenics",
    items: [
      "2 x Push Ups",
      "2 x Dips",
      "2 x Pull-Ups",
      "2 x Leg Raises",
      "2 x Squats"
    ]
  },
  {
    title: "Saturday, August 23 - Calisthenics",
    items: [
      "2 x Push Ups",
      "2 x Dips",
      "2 x Pull-Ups"
    ]
  },
  {
    title: "Friday, August 22 - Calisthenics",
    items: [
      "2 x Push Ups",
      "2 x Squats"
    ]
  }
];


export default function HistoryPage() {
  return (
    <div className="history-page">
      <h1>History</h1>
      <div className="cards-container">
        {historyData.map((entry, idx) => (
          <HistoryCard
            key={idx}
            title={entry.title}
            items={entry.items}
          />
        ))}
      </div>
    </div>
  );
}