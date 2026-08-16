import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    provider_id: '',
    skill_id: '',
    proposed_time: '',
    duration_minutes: 60,
    notes: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/bookings', newBooking, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowBookingForm(false);
      setNewBooking({
        provider_id: '',
        skill_id: '',
        proposed_time: '',
        duration_minutes: 60,
        notes: ''
      });
      fetchBookings();
    } catch (err) {
      console.error('Error creating booking:', err);
      alert(err.response?.data?.error || 'Failed to create booking');
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/bookings/${bookingId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <button
          onClick={() => setShowBookingForm(!showBookingForm)}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {showBookingForm ? 'Cancel' : 'New Booking'}
        </button>
      </div>

      {showBookingForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Request a Session</h2>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider ID</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newBooking.provider_id}
                onChange={(e) => setNewBooking({ ...newBooking, provider_id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Skill ID</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newBooking.skill_id}
                onChange={(e) => setNewBooking({ ...newBooking, skill_id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Proposed Time</label>
              <input
                type="datetime-local"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newBooking.proposed_time}
                onChange={(e) => setNewBooking({ ...newBooking, proposed_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newBooking.duration_minutes}
                onChange={(e) => setNewBooking({ ...newBooking, duration_minutes: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newBooking.notes}
                onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Request Booking
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{booking.skill_name}</h3>
                <p className="text-sm text-gray-500">
                  {booking.requester_name} → {booking.provider_name}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div>
                <span className="font-medium">Time:</span>{' '}
                {new Date(booking.proposed_time).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {booking.duration_minutes} min
              </div>
              <div>
                <span className="font-medium">Credits:</span> {booking.credits_transferred}
              </div>
            </div>
            {booking.notes && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Notes:</span> {booking.notes}
              </p>
            )}
            <div className="flex space-x-2">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                    className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                    className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateStatus(booking.id, 'completed')}
                  className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No bookings yet. Start by requesting a session!</p>
        </div>
      )}
    </div>
  );
};

export default Bookings;
