import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './MyInvoices.css';

const MyInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learning/invoices`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoices(data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const viewInvoiceDetails = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learning/invoices/${invoiceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedInvoice(data.invoice);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const downloadInvoice = (invoice) => {
    // Create printable invoice
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateInvoiceHTML(invoice));
    printWindow.document.close();
    printWindow.print();
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin: 20px 0; }
          .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .invoice-table th { background-color: #4f46e5; color: white; }
          .total-row { font-weight: bold; background-color: #f3f4f6; }
          .invoice-footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>JOBZEE LEARNING</h1>
          <h2>INVOICE</h2>
          <p><strong>${invoice.invoiceNumber}</strong></p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          <p><strong>Payment ID:</strong> ${invoice.razorpayPaymentId}</p>
          <p><strong>Bill To:</strong></p>
          <p>${invoice.billingDetails?.name || 'N/A'}<br>
          ${invoice.billingDetails?.email || ''}<br>
          ${invoice.billingDetails?.phone || ''}</p>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.courseName}</td>
              <td>₹${invoice.originalPrice.toFixed(2)}</td>
            </tr>
            ${invoice.discountAmount > 0 ? `
            <tr>
              <td>Discount</td>
              <td>- ₹${invoice.discountAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Subtotal</td>
              <td>₹${invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax (${invoice.taxPercentage}%)</td>
              <td>₹${invoice.taxAmount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount</td>
              <td>₹${invoice.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="invoice-footer">
          <p>Thank you for your purchase!</p>
          <p>For any queries, contact support@jobzee.com</p>
        </div>
      </body>
      </html>
    `;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'issued':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
      case 'void':
        return '#ef4444';
      case 'refunded':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="my-invoices-container">
      <div className="invoices-header">
        <h1>My Invoices</h1>
        <p>View and download your course purchase invoices</p>
      </div>

      {loading ? (
        <div className="loading">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="no-invoices">
          <p>📄 No invoices found</p>
          <p>Purchase a course to see your invoices here</p>
          <button onClick={() => navigate('/learning-hub')} className="browse-btn">
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="invoices-grid">
          {invoices.map((invoice) => (
            <div key={invoice._id} className="invoice-card">
              <div className="invoice-card-header">
                <div className="invoice-number">{invoice.invoiceNumber}</div>
                <div
                  className="invoice-status"
                  style={{ backgroundColor: getStatusColor(invoice.status) }}
                >
                  {invoice.status.toUpperCase()}
                </div>
              </div>

              <div className="invoice-course">
                {invoice.courseId?.thumbnail && (
                  <img
                    src={invoice.courseId.thumbnail}
                    alt={invoice.courseName}
                    className="course-thumbnail-small"
                  />
                )}
                <div>
                  <h3>{invoice.courseName}</h3>
                  <p className="invoice-date">
                    📅 {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
              </div>

              <div className="invoice-amount">
                <span className="amount-label">Total Paid:</span>
                <span className="amount-value">
                  {invoice.currency} ₹{invoice.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="invoice-actions">
                <button
                  className="view-btn"
                  onClick={() => viewInvoiceDetails(invoice._id)}
                >
                  View Details
                </button>
                <button
                  className="download-btn"
                  onClick={() => downloadInvoice(invoice)}
                >
                  📥 Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Details Modal */}
      {showModal && selectedInvoice && (
        <div className="invoice-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowModal(false)}>
              ✕
            </button>

            <div className="modal-header">
              <h2>Invoice Details</h2>
              <p className="invoice-number-large">{selectedInvoice.invoiceNumber}</p>
            </div>

            <div className="modal-content">
              <div className="detail-section">
                <h3>Course Information</h3>
                <p><strong>Course:</strong> {selectedInvoice.courseName}</p>
                <p><strong>Date:</strong> {formatDate(selectedInvoice.invoiceDate)}</p>
                <p><strong>Payment ID:</strong> {selectedInvoice.razorpayPaymentId}</p>
              </div>

              <div className="detail-section">
                <h3>Billing Details</h3>
                <p><strong>Name:</strong> {selectedInvoice.billingDetails?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedInvoice.billingDetails?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedInvoice.billingDetails?.phone || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Payment Breakdown</h3>
                <div className="payment-breakdown">
                  <div className="breakdown-row">
                    <span>Original Price:</span>
                    <span>₹{selectedInvoice.originalPrice.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="breakdown-row discount">
                      <span>Discount:</span>
                      <span>- ₹{selectedInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="breakdown-row">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Tax ({selectedInvoice.taxPercentage}%):</span>
                    <span>₹{selectedInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row total">
                    <span>Total Amount:</span>
                    <span>₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="download-btn-large"
                onClick={() => downloadInvoice(selectedInvoice)}
              >
                📥 Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvoices;
