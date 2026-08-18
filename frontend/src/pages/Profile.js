import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { id: profileId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [formData, setFormData] = useState({
    bio: '',
    campus_location: '',
    profile_picture: '',
    availability: ''
  });
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser._id;
  const isOwnProfile = !profileId || profileId === currentUserId;

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (isOwnProfile && !token) {
        navigate('/login');
        return;
      }
      setError('');
      const res = isOwnProfile
        ? await axios.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          })
        : await axios.get(`/api/users/${profileId}`);
      setUser(res.data);
      setImageFailed(false);
      if (isOwnProfile) {
        localStorage.setItem('user', JSON.stringify(res.data));
      }
      setFormData({
        bio: res.data.bio || '',
        campus_location: res.data.campus_location || '',
        profile_picture: res.data.profile_picture || '',
        availability: res.data.availability || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Unable to load this profile.');
    }
  }, [isOwnProfile, profileId, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!user) return;

    const profileUserId = user.id || user._id;
    const fetchProfileDetails = async () => {
      try {
        const [skillsRes, reviewsRes] = await Promise.all([
          axios.get(`/api/skills/user/${profileUserId}`),
          axios.get(`/api/reviews/${profileUserId}`)
        ]);
        setSkills(skillsRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Error fetching profile details:', err);
      }
    };

    fetchProfileDetails();
  }, [user]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      setError('');
      setSuccess('');
      const res = await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setImageFailed(false);
      localStorage.setItem('user', JSON.stringify(res.data));
      setEditing(false);
      setSuccess('Profile updated.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Unable to update your profile.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : 'No ratings';
  const offeredSkills = skills.filter((skill) => skill.is_offering);
  const requestedSkills = skills.filter((skill) => !skill.is_offering);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isOwnProfile ? 'My Profile' : `${user.first_name} ${user.last_name}`}
            </h1>
            {isOwnProfile ? (
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            ) : (
              <Link
                to={`/messages?userId=${user.id || user._id}`}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Message
              </Link>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="flex items-center space-x-6 mb-6">
            {user.profile_picture && !imageFailed ? (
              <img
                src={user.profile_picture}
                alt={`${user.first_name} ${user.last_name}`}
                className="h-24 w-24 rounded-full object-cover bg-indigo-100"
                onError={(e) => {
                  setImageFailed(true);
                }}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-indigo-600">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-500">{user.email}</p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Credits: {user.credit_balance}
              </div>
            </div>
          </div>

          {editing && isOwnProfile ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.bio}
                  onChange={onChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Campus Location</label>
                <input
                  type="text"
                  name="campus_location"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.campus_location}
                  onChange={onChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
                <input
                  type="text"
                  name="profile_picture"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.profile_picture}
                  onChange={onChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Availability</label>
                <textarea
                  name="availability"
                  rows={3}
                  placeholder="Example: Mon/Wed after 3pm, Friday mornings"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.availability}
                  onChange={onChange}
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">About</h3>
                <p className="mt-1 text-gray-600">{user.bio || 'No bio added yet.'}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Location</h3>
                <p className="mt-1 text-gray-600">{user.campus_location || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Member Since</h3>
                <p className="mt-1 text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Availability</h3>
                <p className="mt-1 text-gray-600">{user.availability || 'No availability added yet.'}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Rating</h3>
                <p className="mt-1 text-gray-600">
                  {averageRating} {reviews.length > 0 && `from ${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Skills Offered</h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {offeredSkills.map((skill) => (
                    <div key={skill.id} className="border border-gray-200 rounded-md p-3">
                      <p className="font-medium text-gray-900">{skill.name}</p>
                      <p className="text-sm text-gray-600">{skill.credits_per_hour} credits/hr</p>
                    </div>
                  ))}
                </div>
                {offeredSkills.length === 0 && <p className="mt-1 text-gray-600">No offered skills yet.</p>}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Skills Requested</h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requestedSkills.map((skill) => (
                    <div key={skill.id} className="border border-gray-200 rounded-md p-3">
                      <p className="font-medium text-gray-900">{skill.name}</p>
                      <p className="text-sm text-gray-600">{skill.description || 'No description added.'}</p>
                    </div>
                  ))}
                </div>
                {requestedSkills.length === 0 && <p className="mt-1 text-gray-600">No requested skills yet.</p>}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Reviews</h3>
                <div className="mt-2 space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {review.reviewer_name} {review.reviewer_last_name}
                        </p>
                        <p className="text-sm font-medium text-indigo-700">{review.rating}/5</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{review.comment || 'No comment provided.'}</p>
                    </div>
                  ))}
                </div>
                {reviews.length === 0 && <p className="mt-1 text-gray-600">No reviews yet.</p>}
              </div>
            </div>
          )}
          {isOwnProfile && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
