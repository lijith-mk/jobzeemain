import React, { useState, useEffect } from 'react';

import API_BASE_URL from '../config/api';
const EventNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/employers/notifications?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/employers/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/employers/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/employers/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_approved':
        return '✅';
      case 'event_rejected':
        return '❌';
      case 'new_registration':
        return '👤';
      case 'event_reminder':
        return '⏰';
      case 'payment_received':
        return '💰';
      case 'event_updated':
        return '📝';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'event_approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'event_rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'new_registration':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'event_reminder':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'payment_received':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'event_updated':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-blue-100 bg-white overflow-hidden shadow-sm">
            {['all','unread','read'].map(key => (
              <button key={key} onClick={()=>setFilter(key)} className={`px-3.5 py-2 text-sm font-semibold ${filter===key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>{key.charAt(0).toUpperCase()+key.slice(1)}</button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L16 7l-6 6-6-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">
            {filter === 'unread' 
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                notification.isRead 
                  ? 'bg-white/90 backdrop-blur border-slate-200' 
                  : 'bg-blue-50/80 backdrop-blur border-blue-200 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/80 border border-white/60 shadow-sm flex items-center justify-center text-lg">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold text-gray-900`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 text-gray-700`}>
                        {notification.message}
                      </p>
                      {notification.eventTitle && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 mt-2">📅 {notification.eventTitle}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-3">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Delete
                    </button>
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="text-xs text-indigo-600 hover:underline font-semibold"
                      >
                        View Details
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {notifications.length >= 20 && (
        <div className="text-center">
          <button className="px-6 py-2 border border-blue-200 rounded-xl text-gray-700 hover:bg-blue-50 transition-colors">
            Load More Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default EventNotifications;

