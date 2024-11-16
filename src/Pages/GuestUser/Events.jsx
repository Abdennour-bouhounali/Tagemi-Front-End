import React from 'react';
import { Link } from 'react-router-dom';

const Events = () => {
  const events = [
    { id: 1, name: 'Medical Camp', date: '2024-08-10', description: 'Free medical check-ups and consultations.' },
    { id: 2, name: 'Cultural Festival', date: '2024-09-15', description: 'Celebrating local culture and traditions.' },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-5xl font-bold mb-8 text-gray-800">Upcoming Events</h1>
      <div className="space-y-8">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">{event.name}</h2>
            <p className="text-xl text-gray-600 mb-4">{event.date}</p>
            <p className="text-lg leading-relaxed mb-6 text-gray-600">{event.description}</p>
            <Link to={`/events/${event.id}`} className="bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 transition duration-300">Learn More</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
