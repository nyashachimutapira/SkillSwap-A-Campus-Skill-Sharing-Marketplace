import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    category: '',
    credits_per_hour: 10,
    is_offering: true
  });

  useEffect(() => {
    fetchSkills();
  }, [category, search]);

  const fetchSkills = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      
      const res = await axios.get('/api/skills', { params });
      setSkills(res.data);
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/skills', newSkill, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddForm(false);
      setNewSkill({
        name: '',
        description: '',
        category: '',
        credits_per_hour: 10,
        is_offering: true
      });
      fetchSkills();
    } catch (err) {
      console.error('Error adding skill:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Browse Skills</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {showAddForm ? 'Cancel' : 'Add Skill'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Skill</h2>
          <form onSubmit={handleAddSkill} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Skill Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newSkill.description}
                onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Credits per Hour</label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={newSkill.credits_per_hour}
                  onChange={(e) => setNewSkill({ ...newSkill, credits_per_hour: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newSkill.is_offering}
                  onChange={(e) => setNewSkill({ ...newSkill, is_offering: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">I am offering this skill</span>
              </label>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Skill
            </button>
          </form>
        </div>
      )}

      <div className="mb-6 flex space-x-4">
        <input
          type="text"
          placeholder="Search skills..."
          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Academic">Academic</option>
          <option value="Technical">Technical</option>
          <option value="Creative">Creative</option>
          <option value="Languages">Languages</option>
          <option value="Services">Services</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {skill.credits_per_hour} credits/hr
              </span>
            </div>
            <p className="text-gray-600 mb-4">{skill.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {skill.first_name} {skill.last_name}
              </span>
              <span>{skill.campus_location}</span>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {skill.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No skills found. Be the first to add one!</p>
        </div>
      )}
    </div>
  );
};

export default Skills;
