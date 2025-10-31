import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppointmentDistribution from './AppointmentDistribution'; // Update this import path
import { ArrowLeft } from 'lucide-react';

const EventAppointmentDistribution = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(`/admin/event-tracking/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* You can optionally add a header here if you don't want the modal style */}
      <AppointmentDistribution 
        eventId={eventId} 
        onClose={handleClose}
      />
    </div>
  );
};

export default EventAppointmentDistribution;