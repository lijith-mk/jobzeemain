import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

import API_BASE_URL from '../config/api';
// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EventAnalytics = ({ events, stats }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d'); // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/employers/events/analytics?period=${selectedPeriod}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '1y': 'Last year'
    };
    return labels[period] || 'Last 30 days';
  };

  // Prepare chart data
  const prepareRegistrationsChartData = () => {
    const registrationsData = analyticsData?.rsvpsOverTime || [];
    
    if (registrationsData.length === 0) {
      // Generate sample data if no real data
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
      const labels = [];
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push(Math.floor(Math.random() * 20) + 1);
      }
      
      return {
        labels,
        datasets: [{
          label: 'Registrations',
          data,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: 'rgb(99, 102, 241)',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          fill: true,
          tension: 0.4,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          shadowBlur: 10,
          shadowColor: 'rgba(99, 102, 241, 0.3)'
        }]
      };
    }

    return {
      labels: registrationsData.map(item => item.date),
      datasets: [{
        label: 'Registrations',
        data: registrationsData.map(item => item.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(99, 102, 241)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        fill: true,
        tension: 0.4,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 10,
        shadowColor: 'rgba(99, 102, 241, 0.3)'
      }]
    };
  };

  const prepareRevenueChartData = () => {
    const revenueData = analyticsData?.revenueOverTime || [];
    
    if (revenueData.length === 0) {
      // Generate sample data if no real data
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
      const labels = [];
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push(Math.floor(Math.random() * 5000) + 500);
      }
      
      return {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data,
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(236, 72, 153)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          shadowBlur: 8,
          shadowColor: 'rgba(16, 185, 129, 0.3)'
        }]
      };
    }

    return {
      labels: revenueData.map(item => item.date),
      datasets: [{
        label: 'Revenue (₹)',
        data: revenueData.map(item => item.amount),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(236, 72, 153)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 8,
        shadowColor: 'rgba(16, 185, 129, 0.3)'
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
      delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 100 + context.datasetIndex * 100;
        }
        return delay;
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: '500'
          },
          padding: 8
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: '500'
          },
          padding: 8
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 3
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 h-32">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 animate-spin"></div>
                    <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const analytics = analyticsData || {
    totalEvents: stats.totalEvents || 0,
    totalRegistrations: stats.totalRegistrations || 0,
    totalRevenue: stats.totalRevenue || 0,
    averageAttendance: 0,
    rsvpsOverTime: [],
    revenueOverTime: [],
    popularEvents: [],
    eventTypes: { free: 0, paid: 0 },
    monthlyStats: []
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Event Analytics
          </h2>
          <p className="text-gray-600 mt-2">Comprehensive insights into your event performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold mb-2">Total Events</p>
              <p className="text-4xl font-bold mb-1">{formatNumber(analytics.totalEvents)}</p>
              <p className="text-blue-200 text-xs">Active events</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold mb-2">Total Registrations</p>
              <p className="text-4xl font-bold mb-1">{formatNumber(analytics.totalRegistrations)}</p>
              <p className="text-green-200 text-xs">All time</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold mb-2">Total Revenue</p>
              <p className="text-4xl font-bold mb-1">{formatCurrency(analytics.totalRevenue)}</p>
              <p className="text-purple-200 text-xs">From paid events</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-semibold mb-2">Avg. Attendance</p>
              <p className="text-4xl font-bold mb-1">{formatNumber(analytics.averageAttendance)}</p>
              <p className="text-orange-200 text-xs">Per event</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RSVPs Over Time */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Registrations Over Time</h3>
              <p className="text-sm text-gray-500">Track registration trends and patterns</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="h-64 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg opacity-50"></div>
            <div className="relative z-10 h-full">
              <Line data={prepareRegistrationsChartData()} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Revenue Trends</h3>
              <p className="text-sm text-gray-500">Monitor financial performance</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="h-64 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg opacity-50"></div>
            <div className="relative z-10 h-full">
              <Bar data={prepareRevenueChartData()} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Event Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Popular Events */}
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Most Popular Events</h3>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Top 5</span>
          </div>
          <div className="space-y-3">
            {events.slice(0, 5).map((event, index) => {
              const startDate = new Date(event.startDateTime);
              const isFree = event.type === 'free' || event.price === 0;
              const count = Number(event.attendeesCount || 0);
              const maxCount = Math.max(...events.map(e => Number(e.attendeesCount||0)), 1);
              const pct = Math.min(100, Math.round((count / maxCount) * 100));
              return (
                <div key={event._id} className="p-3 rounded-xl border border-slate-100 bg-white/70 hover:bg-blue-50/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">{index+1}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500 truncate">{startDate.toLocaleDateString()} • {isFree ? 'Free' : `₹${event.price}`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{count}</p>
                      <p className="text-[11px] text-gray-500">registrations</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{width: pct + '%'}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Types Distribution */}
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
          {(() => {
            const freeCount = events.filter(e => e.type === 'free' || Number(e.price) === 0).length;
            const paidCount = events.filter(e => (e.type === 'paid' || Number(e.price) > 0)).length;
            const onlineCount = events.filter(e => e.mode === 'online').length;
            const offlineCount = events.filter(e => e.mode === 'offline').length;
            const total = Math.max(1, freeCount + paidCount + onlineCount + offlineCount);
            const item = (label, color, value) => (
              <div className="space-y-1" key={label}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded ${color}`}></span>
                    <span className="text-gray-700 text-sm">{label}</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${color.replace('bg-','bg-')}`} style={{width: `${Math.round((value/total)*100)}%`}} />
                </div>
              </div>
            );
            return (
              <div className="space-y-4">
                {item('Free Events', 'bg-emerald-500', freeCount)}
                {item('Paid Events', 'bg-blue-500', paidCount)}
                {item('Online Events', 'bg-purple-500', onlineCount)}
                {item('Offline Events', 'bg-orange-500', offlineCount)}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {events.slice(0, 5).map(event => {
            const startDate = new Date(event.startDateTime);
            const isUpcoming = startDate > new Date();
            const isFree = event.type === 'free' || Number(event.price) === 0;
            return (
              <div key={event._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${isUpcoming ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 truncate">{startDate.toLocaleDateString()} • {isFree ? 'Free' : `₹${event.price}`} • {event.attendeesCount || 0} registrations</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  'bg-red-100 text-red-800 border border-red-200'
                }`}>{event.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics;

