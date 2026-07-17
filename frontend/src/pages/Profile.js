import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    campus_location: '',
    profile_picture: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setFormData({
        bio: res.data.bio || '',
        campus_location: res.data.campus_location || '',
        profile_picture: res.data.profile_picture || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (!user) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="flex items-center space-x-6 mb-6">
            <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600">
                {user.first_name[0]}{user.last_name[0]}
              </span>
            </div>
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

          {editing ? (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
