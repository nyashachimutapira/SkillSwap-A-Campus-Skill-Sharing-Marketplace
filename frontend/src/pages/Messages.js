import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams, useNavigate } from 'react-router-dom';

const upsertConversation = (conversationList, conversation) => {
  const existing = conversationList.filter((conv) => conv.other_user_id !== conversation.other_user_id);
  return [conversation, ...existing];
};

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [searchParams] = useSearchParams();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser._id;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      setError('');
      const res = await axios.get('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.error || 'Unable to load conversations.');
    }
  }, []);

  const fetchMessages = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      setError('');
      const res = await axios.get(`/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      await axios.put(`/api/messages/${userId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations((prev) => prev.map((conv) => (
        conv.other_user_id === userId ? { ...conv, unread_count: 0 } : conv
      )));
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.error || 'Unable to load messages.');
    }
  }, []);

  const searchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users', {
        params: { search: userSearch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  }, [userSearch]);

  useEffect(() => {
    fetchConversations();
    
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [fetchConversations]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchUsers();
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchUsers]);

  useEffect(() => {
    if (socket && currentUserId) {
      socket.emit('join_room', currentUserId);

      socket.on('receive_message', (data) => {
        const otherUserId = data.sender_id === currentUserId ? data.receiver_id : data.sender_id;

        setConversations((prev) => upsertConversation(prev, {
          other_user_id: otherUserId,
          first_name: data.sender_name || selectedConversation?.first_name || 'New',
          last_name: data.sender_last_name || selectedConversation?.last_name || 'Message',
          profile_picture: selectedConversation?.profile_picture || '',
          last_message: data.content,
          last_message_time: data.created_at,
          unread_count: selectedConversation?.other_user_id === otherUserId ? 0 : 1,
        }));

        if (selectedConversation?.other_user_id === otherUserId) {
          setMessages((prev) => [...prev, data]);
        }
      });

      return () => socket.off('receive_message');
    }
  }, [socket, currentUserId, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.other_user_id);
    }
  }, [selectedConversation, fetchMessages]);

  const openConversation = useCallback(async (userId) => {
    const existingConversation = conversations.find((conv) => conv.other_user_id === userId);
    if (existingConversation) {
      setSelectedConversation(existingConversation);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      setError('');
      const res = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const conversation = {
        other_user_id: res.data.id || res.data._id,
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        profile_picture: res.data.profile_picture,
        last_message: '',
        last_message_time: '',
        unread_count: 0,
      };
      setConversations((prev) => upsertConversation(prev, conversation));
      setSelectedConversation(conversation);
    } catch (err) {
      console.error('Error opening conversation:', err);
      setError(err.response?.data?.error || 'Unable to open this conversation.');
    }
  }, [conversations]);

  useEffect(() => {
    const requestedUserId = searchParams.get('userId');
    if (requestedUserId && requestedUserId !== currentUserId) {
      openConversation(requestedUserId);
    }
  }, [searchParams, currentUserId, openConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const messageData = {
        receiver_id: selectedConversation.other_user_id,
        content: newMessage
      };

      const res = await axios.post('/api/messages', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages((prev) => [...prev, res.data]);
      setConversations((prev) => upsertConversation(prev, {
        ...selectedConversation,
        last_message: res.data.content,
        last_message_time: res.data.created_at,
        unread_count: 0,
      }));
      
      // Emit via socket
      socket?.emit('send_message', {
        roomId: res.data.receiver_id,
        ...res.data
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[32rem]">
          {/* Conversations List */}
          <div className="border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start conversation</label>
              <input
                type="text"
                placeholder="Search people..."
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <div className="mt-3 space-y-2">
                {users.slice(0, 4).map((user) => (
                  <button
                    type="button"
                    key={user.id || user._id}
                    onClick={() => openConversation(user.id || user._id)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-xs text-gray-500">{user.campus_location || 'Campus not set'}</span>
                  </button>
                ))}
              </div>
            </div>
            {conversations.map((conv) => (
              <div
                key={conv.other_user_id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.other_user_id === conv.other_user_id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="font-medium text-indigo-600">
                      {conv.first_name[0]}{conv.last_name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.first_name} {conv.last_name}
                    </p>
                    {conv.last_message && (
                      <p className="text-xs text-gray-600 truncate">
                        {conv.last_message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {conv.last_message_time ? new Date(conv.last_message_time).toLocaleString() : ''}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-indigo-600 text-xs font-medium text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentUserId
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === currentUserId
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
