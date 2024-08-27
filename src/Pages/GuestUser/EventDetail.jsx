import React from 'react';
import { useParams } from 'react-router-dom';

const EventDetail = () => {
  const { id } = useParams();
  const event = {
    id: 1,
    name: 'Medical Camp',
    date: '2024-08-10',
    description: 'Join us for a free medical camp providing check-ups and consultations for various specialties. Our team of doctors will be available to assist you with any medical concerns.',
    location: 'Community Center, Algiers',
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-5xl font-bold mb-8 text-gray-800">{event.name}</h1>
      <p className="text-xl text-gray-600 mb-4">{event.date}</p>
      <p className="text-lg leading-relaxed mb-6 text-gray-600">{event.description}</p>
      <p className="text-lg leading-relaxed mb-6 text-gray-600"><strong>Location:</strong> {event.location}</p>
    </div>
  );
};

export default EventDetail;
