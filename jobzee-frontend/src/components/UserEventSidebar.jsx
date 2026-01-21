import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const UserEventSidebar = ({ user, onLogout, activeTab, onTabChange, isMobile = false, open = false, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      path: '/dashboard'
    },
    {
      id: 'participate',
      name: 'Participate',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/participate'
    },
    {
      id: 'my-events',
      name: 'My Events',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/my-events'
    },
    {
      id: 'my-tickets',
      name: 'My Tickets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      path: '/my-tickets'
    },
    {
      id: 'certificates',
      name: 'Certificates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      path: '/certificates'
    },
    {
      id: 'payments',
      name: 'Payments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      path: '/payments'
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      path: '/profile'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const sidebarContent = (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Premium Header */}
      <div className="relative px-6 py-5 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl" />
        </div>
        <div className="relative flex items-center space-x-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/40">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight">JobZee</h1>
            <p className="text-[11px] text-gray-500 font-medium">Event Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navigationItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onTabChange && onTabChange(item.id)}
              className={`group relative flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                active
                  ? 'text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/60 hover:shadow'
              }`}
            >
              {/* Active indicator bar */}
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all ${
                active ? 'bg-white/90' : 'bg-transparent group-hover:bg-blue-500/60'
              }`} />
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ring-1 ${
                active
                  ? 'bg-white/20 ring-white/30 text-white'
                  : 'bg-white/70 ring-gray-200 text-gray-700 group-hover:bg-white'
              }`}>
                {item.icon}
              </span>
              <span className={`font-semibold tracking-wide ${active ? 'text-white' : ''}`}>{item.name}</span>
              {/* Right chevron on hover */}
              <svg className={`ml-auto w-4 h-4 transition-transform ${active ? 'opacity-90' : 'opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="px-4 py-4 border-t border-white/40 bg-white/60 backdrop-blur">
        <button
          onClick={onLogout}
          className="group flex items-center space-x-3 w-full px-3 py-3 text-red-600 hover:text-red-700 rounded-xl transition-all duration-300 hover:bg-red-50"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          <span className="font-semibold">Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/40 bg-white/60 backdrop-blur">
        <p className="text-[11px] text-gray-600 text-center font-medium">2025 © JobZee</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {open && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
};

export default UserEventSidebar;
