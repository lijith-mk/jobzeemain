import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const EmployerBilling = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payPage, setPayPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const [payPagination, setPayPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [invPagination, setInvPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [payStatus, setPayStatus] = useState('');
  const [payStart, setPayStart] = useState('');
  const [payEnd, setPayEnd] = useState('');
  const [invStart, setInvStart] = useState('');
  const [invEnd, setInvEnd] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
      return;
    }
    loadPayments(token, payPage);
    loadInvoices(token, invPage);
  }, [navigate, payPage, invPage]);

  const buildQuery = (params) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') search.append(k, v);
    });
    return search.toString();
  };

  const loadPayments = async (token, page = 1) => {
    try {
      const query = buildQuery({ page, limit: 10, status: payStatus, startDate: payStart, endDate: payEnd });
      const res = await fetch(`${API_BASE_URL}/api/payments/history?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
        setPayPagination(data.pagination);
      } else {
        toast.error('Failed to load payments');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async (token, page = 1) => {
    try {
      const query = buildQuery({ page, limit: 10, startDate: invStart, endDate: invEnd });
      const res = await fetch(`${API_BASE_URL}/api/invoices?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
        setInvPagination(data.pagination);
      } else {
        toast.error('Failed to load invoices');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error loading invoices');
    }
  };

  const handleApplyPaymentFilters = () => {
    const token = localStorage.getItem('employerToken');
    if (!token) return;
    setPayPage(1);
    loadPayments(token, 1);
  };

  const handleApplyInvoiceFilters = () => {
    const token = localStorage.getItem('employerToken');
    if (!token) return;
    setInvPage(1);
    loadInvoices(token, 1);
  };

  const forceDownload = (url, filename) => {
    try {
      const link = document.createElement('a');
      link.href = url + (url.includes('?') ? '&' : '?') + 'fl_attachment=true';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const statusBadge = (status) => {
    const map = {
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-yellow-100 text-yellow-800',
      partially_refunded: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-700',
      initiated: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-fuchsia-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-slate-100 via-indigo-100/70 to-slate-200/60 p-6 shadow-lg mb-8">
          <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">Billing & Invoices</h1>
              <p className="text-gray-600 mt-1">View payments history and download invoices</p>
            </div>
            <Link to="/pricing" className="btn-modern bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2.5 rounded-xl shadow hover:from-indigo-700 hover:to-blue-700 active:scale-[0.98]">Upgrade Plan</Link>
          </div>
        </div>

        {/* Payments */}
        <div className="rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-md mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)} className="appearance-none rounded-xl border border-indigo-200 px-3 py-2 text-sm bg-white">
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
                <option value="pending">Pending</option>
                <option value="initiated">Initiated</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input type="date" value={payStart} onChange={(e) => setPayStart(e.target.value)} className="rounded-xl border border-indigo-200 px-3 py-2 text-sm bg-white" />
              <input type="date" value={payEnd} onChange={(e) => setPayEnd(e.target.value)} className="rounded-xl border border-indigo-200 px-3 py-2 text-sm bg-white" />
              <button onClick={handleApplyPaymentFilters} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow">Apply</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-indigo-50">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-50">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-indigo-50/40">
                    <td className="px-6 py-4 text-sm text-gray-700">{new Date(p.initiatedAt || p.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{p.razorpayOrderId}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{p.razorpayPaymentId || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{p.planId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{p.amount} {p.currency}</td>
                    <td className="px-6 py-4 text-sm"><span className={`px-2.5 py-1 rounded-full border text-xs font-semibold shadow-sm ${statusBadge(p.status)}`}>{p.status}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 flex justify-between items-center bg-slate-50/60 border-t border-indigo-100">
            <button disabled={payPage <= 1} onClick={() => setPayPage(payPage - 1)} className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-sm disabled:opacity-50">Previous</button>
            <div className="text-sm text-gray-600">Page {payPagination.current} of {payPagination.pages}</div>
            <button disabled={payPagination.current >= payPagination.pages} onClick={() => setPayPage(payPage + 1)} className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-sm disabled:opacity-50">Next</button>
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={invStart} onChange={(e) => setInvStart(e.target.value)} className="rounded-xl border border-indigo-200 px-3 py-2 text-sm bg-white" />
              <input type="date" value={invEnd} onChange={(e) => setInvEnd(e.target.value)} className="rounded-xl border border-indigo-200 px-3 py-2 text-sm bg-white" />
              <button onClick={handleApplyInvoiceFilters} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow">Apply</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-indigo-50">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PDF</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-50">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-indigo-50/40">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.items?.[0]?.planId || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{inv.totalAmount} {inv.currency}</td>
                    <td className="px-6 py-4 text-sm">
                      {inv.pdfUrl ? (
                        <button className="inline-flex items-center gap-1 text-indigo-700 hover:underline" onClick={() => forceDownload(inv.pdfUrl, `${inv.invoiceNumber}.pdf`)}>
                          <span>⬇</span>
                          <span>Download</span>
                        </button>
                      ) : (
                        <span className="text-gray-500">Generating...</span>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No invoices found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 flex justify-between items-center bg-slate-50/60 border-t border-indigo-100">
            <button disabled={invPage <= 1} onClick={() => setInvPage(invPage - 1)} className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-sm disabled:opacity-50">Previous</button>
            <div className="text-sm text-gray-600">Page {invPagination.current} of {invPagination.pages}</div>
            <button disabled={invPagination.current >= invPagination.pages} onClick={() => setInvPage(invPage + 1)} className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerBilling;
