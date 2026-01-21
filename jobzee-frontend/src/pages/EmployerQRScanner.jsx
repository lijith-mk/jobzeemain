import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BrowserMultiFormatReader } from '@zxing/library';

import API_BASE_URL from '../config/api';
const EmployerQRScanner = () => {
  const navigate = useNavigate();
  const [qrData, setQrData] = useState('');
  const [scanning, setScanning] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  const validateQRData = async (qrDataToValidate) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: qrDataToValidate.trim() })
      });

      const data = await res.json();
      
      if (data.success) {
        setTicketDetails(data.ticket);
        toast.success('Ticket validated successfully!');
      } else {
        setTicketDetails(null);
        toast.error(data.message || 'Invalid ticket');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Failed to validate ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async () => {
    if (!qrData.trim()) {
      toast.error('Please enter QR code data');
      return;
    }
    await validateQRData(qrData);
  };

  // Initialize camera and QR reader
  useEffect(() => {
    if (scanMode === 'camera') {
      initializeCamera();
    }
    return () => {
      stopScanning();
    };
  }, [scanMode]);

  const initializeCamera = async () => {
    try {
      readerRef.current = new BrowserMultiFormatReader();
      
      // Get available video devices
      const videoInputDevices = await readerRef.current.listVideoInputDevices();
      setDevices(videoInputDevices);
      
      // Select rear camera if available
      const rearCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const deviceId = rearCamera ? rearCamera.deviceId : videoInputDevices[0]?.deviceId;
      setSelectedDevice(deviceId);
      
      if (deviceId && videoRef.current) {
        await startScanning(deviceId);
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      toast.error('Camera access failed. Please try manual input.');
      setScanMode('manual');
    }
  };

  const startScanning = async (deviceId) => {
    try {
      setScanning(true);
      await readerRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, error) => {
        if (result) {
          console.log('QR Code detected:', result.getText());
          validateQRData(result.getText());
        }
        if (error && !error.name.includes('NotFoundException')) {
          console.error('Scan error:', error);
        }
      });
    } catch (error) {
      console.error('Start scanning error:', error);
      toast.error('Failed to start camera scanning');
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      setScanning(false);
    }
  };

  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
    if (scanning) {
      stopScanning();
      startScanning(deviceId);
    }
  };

  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    toast.error('Camera access failed. Please try manual input.');
    setScanMode('manual');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      {/* Header Card */}
      <div className="relative bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/40 rounded-2xl border border-blue-100 p-6 shadow-sm mb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-60 pointer-events-none grid-pattern" />
        <div className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">QR Code Scanner</h1>
          <p className="text-gray-600 mt-1">Scan attendee tickets to validate entry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Input */}
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Scan Ticket</h2>
            <div className="inline-flex rounded-xl border border-blue-100 bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setScanMode('camera')}
                className={`px-3.5 py-2 text-sm font-semibold ${scanMode==='camera' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                aria-pressed={scanMode==='camera'}
              >Camera</button>
              <div className="w-px h-6 bg-gray-200" />
              <button
                onClick={() => setScanMode('manual')}
                className={`px-3.5 py-2 text-sm font-semibold ${scanMode==='manual' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                aria-pressed={scanMode==='manual'}
              >Manual</button>
            </div>
          </div>
          
          {scanMode === 'camera' ? (
            <div className="space-y-4">
              {/* Camera Selection */}
              {devices.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Camera</label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="w-full pl-3 pr-3 py-2.5 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Video Element */}
              <div className="relative rounded-xl overflow-hidden border-2 border-blue-200 shadow-inner">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the video
                />
                {/* Frame corners */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-blue-500 rounded-tl-md" />
                  <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-blue-500 rounded-tr-md" />
                  <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-blue-500 rounded-bl-md" />
                  <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-blue-500 rounded-br-md" />
                </div>
                {/* Scan line */}
                <div className="pointer-events-none absolute inset-x-0 top-1/4 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-70 animate-pulse" />
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Scanning for QR codes...</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-gray-600">
                Point your camera at the QR code to scan
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Data
                </label>
                <textarea
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="Paste QR code data here..."
                  className="w-full px-3 py-2.5 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <button
                onClick={handleQRScan}
                disabled={loading || !qrData.trim()}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                  loading || !qrData.trim()
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {loading ? 'Validating...' : 'Validate Ticket'}
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50/80 border border-blue-100 rounded-xl">
            <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Camera mode:</strong> Point camera at QR code to scan automatically</li>
              <li>• <strong>Manual mode:</strong> Copy QR code data and paste it above</li>
              <li>• QR codes are automatically validated when detected</li>
            </ul>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Details</h2>
          
          {ticketDetails ? (
            <div className="space-y-4">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-green-600 to-indigo-600 text-white p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{ticketDetails.event?.title}</h3>
                    <p className="text-emerald-100 text-sm">{ticketDetails.event?.organizerCompanyName}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(ticketDetails.status)}`}>
                      {ticketDetails.status.toUpperCase()}
                    </div>
                    <p className="text-emerald-100 text-xs mt-1">#{ticketDetails.ticketId}</p>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Event Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">{formatDate(ticketDetails.event?.startDateTime)}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600 capitalize">{ticketDetails.event?.mode}</span>
                  </div>
                  {ticketDetails.event?.mode === 'offline' && ticketDetails.event?.venueAddress && (
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-gray-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="text-gray-600 text-xs">{ticketDetails.event.venueAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendee Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Attendee Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900">{ticketDetails.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900">{ticketDetails.user?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 text-gray-900">{ticketDetails.user?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Ticket Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 text-gray-900">{ticketDetails.ticketType}</span>
                    {ticketDetails.ticketType === 'Paid' && (
                      <span className="ml-2 text-gray-600">(₹{ticketDetails.ticketPrice})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Issued:</span>
                    <span className="ml-2 text-gray-900">{formatDate(ticketDetails.issuedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setTicketDetails(null);
                    setQrData('');
                  }}
                  className="w-full bg-gray-800 text-white py-2.5 px-4 rounded-xl hover:bg-gray-900 transition-colors"
                >
                  Scan Another Ticket
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ticket scanned</h3>
              <p className="text-gray-500">Enter QR code data and click "Validate Ticket" to see details</p>
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/employer/events')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors"
        >
          Back to Events
        </button>
      </div>
    </div>
  );
};

export default EmployerQRScanner;

