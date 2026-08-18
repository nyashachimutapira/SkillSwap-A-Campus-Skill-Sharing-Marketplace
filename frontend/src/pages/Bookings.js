import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [skills, setSkills] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [searchParams] = useSearchParams();
  const [cancellationReasons, setCancellationReasons] = useState({});
  const [rescheduleForms, setRescheduleForms] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [newBooking, setNewBooking] = useState({
    provider_id: '',
    skill_id: '',
    proposed_time: '',
    duration_minutes: 60,
    notes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
    fetchSkills();
  }, []);

  useEffect(() => {
    const providerId = searchParams.get('providerId');
    const skillId = searchParams.get('skillId');

    if (providerId && skillId) {
      setNewBooking((prev) => ({
        ...prev,
        provider_id: providerId,
        skill_id: skillId,
      }));
      setShowBookingForm(true);
    }
  }, [searchParams]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser._id;

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === newBooking.skill_id || skill._id === newBooking.skill_id),
    [newBooking.skill_id, skills]
  );

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

  const fetchSkills = async () => {
    try {
      const res = await axios.get('/api/skills', { params: { is_offering: true } });
      setSkills(res.data);
    } catch (err) {
      console.error('Error fetching skills:', err);
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
      await axios.put(`/api/bookings/${bookingId}/status`, {
        status,
        cancellation_reason: cancellationReasons[bookingId] || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCancellationReasons((prev) => ({ ...prev, [bookingId]: '' }));
      fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  const handleReschedule = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const form = rescheduleForms[bookingId];
      await axios.put(`/api/bookings/${bookingId}/reschedule`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRescheduleForms((prev) => ({ ...prev, [bookingId]: null }));
      fetchBookings();
    } catch (err) {
      console.error('Error rescheduling booking:', err);
      alert(err.response?.data?.error || 'Failed to reschedule booking');
    }
  };

  const handleCreateReview = async (booking) => {
    try {
      const token = localStorage.getItem('token');
      const form = reviewForms[booking.id] || { rating: 5, comment: '' };
      const revieweeId = booking.requester_id === currentUserId ? booking.provider_id : booking.requester_id;
      await axios.post('/api/reviews', {
        booking_id: booking.id,
        reviewee_id: revieweeId,
        rating: Number(form.rating),
        comment: form.comment || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewForms((prev) => ({ ...prev, [booking.id]: null }));
      alert('Review submitted');
    } catch (err) {
      console.error('Error creating review:', err);
      alert(err.response?.data?.error || 'Failed to submit review');
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
              <label className="block text-sm font-medium text-gray-700">Skill</label>
              <select
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newBooking.skill_id}
                onChange={(e) => {
                  const skill = skills.find((item) => item.id === e.target.value || item._id === e.target.value);
                  setNewBooking({
                    ...newBooking,
                    skill_id: e.target.value,
                    provider_id: skill?.user_id || ''
                  });
                }}
              >
                <option value="">Select a skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} with {skill.first_name} {skill.last_name} - {skill.credits_per_hour} credits/hr
                  </option>
                ))}
              </select>
              {selectedSkill?.availability && (
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Provider availability:</span> {selectedSkill.availability}
                </p>
              )}
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
            {booking.reschedule_reason && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Reschedule note:</span> {booking.reschedule_reason}
              </p>
            )}
            {booking.cancellation_reason && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Cancellation reason:</span> {booking.cancellation_reason}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
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
              {['pending', 'confirmed'].includes(booking.status) && (
                <button
                  onClick={() => setRescheduleForms((prev) => ({
                    ...prev,
                    [booking.id]: {
                      proposed_time: booking.proposed_time?.slice(0, 16) || '',
                      duration_minutes: booking.duration_minutes,
                      reschedule_reason: ''
                    }
                  }))}
                  className="px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Reschedule
                </button>
              )}
              {booking.status === 'completed' && (
                <button
                  onClick={() => setReviewForms((prev) => ({
                    ...prev,
                    [booking.id]: { rating: 5, comment: '' }
                  }))}
                  className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Review
                </button>
              )}
            </div>
            {booking.status === 'pending' && (
              <input
                type="text"
                placeholder="Cancellation reason"
                className="mt-3 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={cancellationReasons[booking.id] || ''}
                onChange={(e) => setCancellationReasons((prev) => ({ ...prev, [booking.id]: e.target.value }))}
              />
            )}
            {rescheduleForms[booking.id] && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="datetime-local"
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={rescheduleForms[booking.id].proposed_time}
                  onChange={(e) => setRescheduleForms((prev) => ({
                    ...prev,
                    [booking.id]: { ...prev[booking.id], proposed_time: e.target.value }
                  }))}
                />
                <input
                  type="number"
                  min="15"
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={rescheduleForms[booking.id].duration_minutes}
                  onChange={(e) => setRescheduleForms((prev) => ({
                    ...prev,
                    [booking.id]: { ...prev[booking.id], duration_minutes: Number(e.target.value) }
                  }))}
                />
                <input
                  type="text"
                  placeholder="Reason"
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={rescheduleForms[booking.id].reschedule_reason}
                  onChange={(e) => setRescheduleForms((prev) => ({
                    ...prev,
                    [booking.id]: { ...prev[booking.id], reschedule_reason: e.target.value }
                  }))}
                />
                <button
                  onClick={() => handleReschedule(booking.id)}
                  className="px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Reschedule
                </button>
              </div>
            )}
            {reviewForms[booking.id] && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={reviewForms[booking.id].rating}
                  onChange={(e) => setReviewForms((prev) => ({
                    ...prev,
                    [booking.id]: { ...prev[booking.id], rating: e.target.value }
                  }))}
                >
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
                <input
                  type="text"
                  placeholder="Review comment"
                  className="md:col-span-3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={reviewForms[booking.id].comment}
                  onChange={(e) => setReviewForms((prev) => ({
                    ...prev,
                    [booking.id]: { ...prev[booking.id], comment: e.target.value }
                  }))}
                />
                <button
                  onClick={() => handleCreateReview(booking)}
                  className="px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit Review
                </button>
              </div>
            )}
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
