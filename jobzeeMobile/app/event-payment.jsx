import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

const EventPayment = () => {
  const router = useRouter();
  const { eventId, title, price, currency = 'INR' } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const webViewRef = useRef(null);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Step 1: Register for event (creates payment order for paid events)
      const response = await api.post(API_ENDPOINTS.EVENTS.REGISTER(eventId));

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment order');
      }

      const { order, key } = response.data;

      // Step 2: Create HTML for Razorpay checkout in WebView
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <script>
            var options = {
              key: "${key}",
              amount: ${order.amount},
              currency: "${order.currency}",
              name: "Jobzee Events",
              description: "Registration for ${decodeURIComponent(title)}",
              order_id: "${order.id}",
              prefill: {
                email: "",
                contact: "",
                name: ""
              },
              theme: {
                color: "#6366F1"
              },
              handler: function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  success: true,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }));
              },
              modal: {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    cancelled: true
                  }));
                }
              }
            };
            
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                failed: true,
                error: response.error
              }));
            });
            
            rzp.open();
          </script>
        </body>
        </html>
      `;

      setPaymentHtml(html);
      setShowWebView(true);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to create payment order. Please try again.'
      );
    }
  };

  const verifyPayment = async (razorpayResponse) => {
    setLoading(true);
    setShowWebView(false);
    
    try {
      const verifyResponse = await api.post(
        `/api/events/${eventId}/verify`,
        {
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        }
      );

      setLoading(false);
      
      if (verifyResponse.data.success) {
        Alert.alert(
          'Payment Successful!',
          'You have been registered for the event successfully. Check your email for the ticket.',
          [
            {
              text: 'View Event',
              onPress: () => router.replace(`/event-details?id=${eventId}`),
            },
          ]
        );
      } else {
        throw new Error(verifyResponse.data.message || 'Payment verification failed');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || error.message || 'Payment verification failed. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.success) {
        // Payment successful - verify on backend
        verifyPayment(data);
      } else if (data.cancelled) {
        // Payment cancelled by user
        setShowWebView(false);
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
      } else if (data.failed) {
        // Payment failed
        setShowWebView(false);
        Alert.alert(
          'Payment Failed',
          data.error?.description || 'Something went wrong. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      setShowWebView(false);
      Alert.alert('Error', 'An error occurred during payment.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="ticket-outline" size={48} color="#6366F1" />
          </View>

          <Text style={styles.eventTitle}>{decodeURIComponent(title || 'Event')}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Registration Fee</Text>
            <Text style={styles.priceAmount}>
              {currency === 'INR' ? '₹' : currency} {parseFloat(price).toFixed(2)}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Secure payment powered by Razorpay
            </Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Confirmed event registration</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>E-ticket sent to your email</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Access to event materials</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>
                Pay {currency === 'INR' ? '₹' : currency}{parseFloat(price).toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By completing this registration, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>

      {/* Razorpay WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowWebView(false);
          Alert.alert('Payment Cancelled', 'You cancelled the payment.');
        }}
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowWebView(false);
                Alert.alert('Payment Cancelled', 'You cancelled the payment.');
              }}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          <WebView
            ref={webViewRef}
            source={{ html: paymentHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.webViewLoadingText}>Loading payment...</Text>
              </View>
            )}
          />
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6366F1',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
  },
  payButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewHeader: {
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default EventPayment;
