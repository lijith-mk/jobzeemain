import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

const MyInvoices = () => {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.INVOICES);
      setInvoices(response.data.invoices || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load invoices');
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const viewInvoiceDetails = async (invoiceId) => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.INVOICE_BY_ID(invoiceId));
      setSelectedInvoice(response.data.invoice);
      setShowDetails(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load invoice details');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'issued':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
      case 'void':
        return '#EF4444';
      case 'refunded':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Invoices</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      </View>
    );
  }

  if (showDetails && selectedInvoice) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowDetails(false);
              setSelectedInvoice(null);
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.detailsCard}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceNumber}>{selectedInvoice.invoiceNumber}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(selectedInvoice.status) },
                ]}
              >
                <Text style={styles.statusText}>{selectedInvoice.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Course Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Course</Text>
              <Text style={styles.courseTitle}>{selectedInvoice.courseName}</Text>
            </View>

            {/* Date & Payment ID */}
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{formatDate(selectedInvoice.invoiceDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment ID</Text>
                <Text style={styles.infoValue}>{selectedInvoice.razorpayPaymentId}</Text>
              </View>
            </View>

            {/* Billing Details */}
            {selectedInvoice.billingDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Billing Details</Text>
                <Text style={styles.billingText}>{selectedInvoice.billingDetails.name}</Text>
                <Text style={styles.billingText}>{selectedInvoice.billingDetails.email}</Text>
                <Text style={styles.billingText}>{selectedInvoice.billingDetails.phone}</Text>
              </View>
            )}

            {/* Amount Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Original Price</Text>
                <Text style={styles.amountValue}>₹{selectedInvoice.originalPrice.toFixed(2)}</Text>
              </View>

              {selectedInvoice.discountAmount > 0 && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Discount</Text>
                  <Text style={[styles.amountValue, { color: '#10B981' }]}>
                    - ₹{selectedInvoice.discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Subtotal</Text>
                <Text style={styles.amountValue}>₹{selectedInvoice.subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Tax ({selectedInvoice.taxPercentage}%)</Text>
                <Text style={styles.amountValue}>₹{selectedInvoice.taxAmount.toFixed(2)}</Text>
              </View>

              <View style={[styles.amountRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{selectedInvoice.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Invoices</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Course Purchase Invoices</Text>
          <Text style={styles.pageSubtitle}>
            View and manage your course payment invoices
          </Text>
        </View>

        {invoices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySubtitle}>
              Purchase a course to see your invoices here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/learning-hub')}
            >
              <Text style={styles.browseButtonText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.invoicesList}>
            {invoices.map((invoice) => (
              <TouchableOpacity
                key={invoice._id}
                style={styles.invoiceCard}
                onPress={() => viewInvoiceDetails(invoice._id)}
              >
                <View style={styles.invoiceCardHeader}>
                  <View>
                    <Text style={styles.invoiceNumberText}>{invoice.invoiceNumber}</Text>
                    <Text style={styles.invoiceDate}>
                      📅 {formatDate(invoice.invoiceDate)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(invoice.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{invoice.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.invoiceCardBody}>
                  <Text style={styles.invoiceCourse} numberOfLines={2}>
                    {invoice.courseName}
                  </Text>
                  <View style={styles.invoiceFooter}>
                    <Text style={styles.invoiceAmount}>₹{invoice.totalAmount.toFixed(2)}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  pageHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  invoicesList: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  invoiceCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  invoiceCourse: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  billingText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  amountValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
});

export default MyInvoices;
