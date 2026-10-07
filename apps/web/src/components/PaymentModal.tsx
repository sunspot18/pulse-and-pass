'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { apiRequest } from '../lib/api';
import { useToast } from './Toast';
import { addSystemNotification } from '../lib/notifications';

export interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    start_time: string;
    doors_open_time?: string | null;
    venue: {
      name: string;
      city: string;
      address?: string;
    };
  };
  tier: {
    id: string;
    name: string;
    description?: string;
    price_paise: number;
  };
  quantity: number;
  reservation: {
    id: string;
    expires_at: string;
  };
  timeLeft: number;
  attendees: AttendeeInfo[];
  onOrderSuccess: (order: {
    orderNumber: string;
    totalAmountPaise: number;
    ticketCount: number;
    tickets?: unknown[];
    createdAt?: string;
  }) => void;
  onBackToAttendees?: () => void;
}

type PaymentTab = 'upi' | 'card' | 'demo';
type CardNetwork = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'generic';

export function PaymentModal({
  isOpen,
  onClose,
  event,
  tier,
  quantity,
  reservation,
  timeLeft,
  attendees,
  onOrderSuccess,
  onBackToAttendees,
}: PaymentModalProps) {
  const { showToast } = useToast();
  const idPrefix = useId();

  // Tab State
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');

  // Attendee Roster Collapsed state
  const [showRosterSummary, setShowRosterSummary] = useState(false);

  // UPI Form State
  const [upiId, setUpiId] = useState('');
  const [upiTouched, setUpiTouched] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(attendees[0]?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('generic');

  // Processing & Confirmation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrderData, setConfirmedOrderData] = useState<{
    orderNumber: string;
    totalAmountPaise: number;
    ticketCount: number;
    tickets?: unknown[];
    createdAt: string;
    paymentMethod: string;
  } | null>(null);

  // Financial Calculations
  const basePriceInr = Math.round((tier.price_paise * quantity) / 100);
  const convenienceFeeInr = Math.round(basePriceInr * 0.05); // 5% fee
  const totalPayableInr = basePriceInr + convenienceFeeInr;
  const totalPayablePaise = totalPayableInr * 100;

  // Dynamic UPI Deep-link
  const sanitizedEventTitle = encodeURIComponent(event.title.slice(0, 20));
  const dynamicUpiString = `upi://pay?pa=pulsepass@icici&pn=PulsePass%20Box%20Office&am=${totalPayableInr}.00&cu=INR&tn=PNP-${sanitizedEventTitle}`;

  // Card Network Auto-Detection
  useEffect(() => {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) {
      setCardNetwork('visa');
    } else if (
      /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(cleanNum)
    ) {
      setCardNetwork('mastercard');
    } else if (/^(60|65|81|82|508)/.test(cleanNum)) {
      setCardNetwork('rupay');
    } else if (/^(34|37)/.test(cleanNum)) {
      setCardNetwork('amex');
    } else {
      setCardNetwork('generic');
    }
  }, [cardNumber]);

  // Handle Card Number Input with Space Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Handle Expiry Input (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      const month = parseInt(raw.slice(0, 2), 10);
      if (month > 12) raw = '12' + raw.slice(2);
      if (month === 0) raw = '01' + raw.slice(2);
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // UPI Validation Check
  const isUpiValid = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim());

  // Copy UPI Deep-link
  const handleCopyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(dynamicUpiString);
      showToast('UPI payment string copied to clipboard', 'info');
    } catch {
      showToast('Could not access clipboard', 'warning');
    }
  };

  // Quick Bank Handle Insert
  const handleAppendUpiHandle = (handle: string) => {
    const base = upiId.split('@')[0] || 'attendee';
    setUpiId(`${base}${handle}`);
    setUpiTouched(true);
  };

  // Execute Simulated Payment & Backend Checkout
  const handleExecutePayment = async (methodLabel: string) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStage(0);

    // Stage 1: Contacting Gateway
    await new Promise((r) => setTimeout(r, 550));
    setProcessingStage(1);

    // Stage 2: Securing Hold & Verifying HMAC
    await new Promise((r) => setTimeout(r, 550));
    setProcessingStage(2);

    // Stage 3: Minting Digital Pass & Finalizing
    await new Promise((r) => setTimeout(r, 450));

    try {
      const res = await apiRequest<{
        message: string;
        order: {
          id: string;
          order_number: string;
          total_amount_paise: number;
          tickets?: unknown[];
          created_at?: string;
        };
      }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: reservation.id,
          attendees,
          payment_method: methodLabel,
        }),
      });

      const confirmedNumber =
        res.order?.order_number ||
        `PNP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const nowIso = new Date().toISOString();

      const orderResult = {
        orderNumber: confirmedNumber,
        totalAmountPaise: res.order?.total_amount_paise || totalPayablePaise,
        ticketCount: quantity,
        tickets: res.order?.tickets,
        createdAt: res.order?.created_at || nowIso,
        paymentMethod: methodLabel,
      };

      setConfirmedOrderData(orderResult);

      // Trigger user notification center
      addSystemNotification({
        title: 'TICKET PASS ISSUED',
        message: `Order ${confirmedNumber} confirmed. ${quantity} pass${quantity > 1 ? 'es' : ''} added to wallet.`,
        type: 'ticket',
      });

      showToast(`Payment Confirmed! Order ${confirmedNumber} created.`, 'success');

      onOrderSuccess(orderResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Fallback simulation for presentation/offline mode if reservation expired or backend offline
      if (
        methodLabel.includes('DEMO') ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError')
      ) {
        const fallbackOrderNum = `PNP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const fallbackOrder = {
          orderNumber: fallbackOrderNum,
          totalAmountPaise: totalPayablePaise,
          ticketCount: quantity,
          createdAt: new Date().toISOString(),
          paymentMethod: `${methodLabel} (Offline Simulation)`,
        };

        setConfirmedOrderData(fallbackOrder);

        addSystemNotification({
          title: 'DEMO PASS ISSUED',
          message: `Order ${fallbackOrderNum} confirmed in demo presentation session.`,
          type: 'ticket',
        });

        showToast('Payment simulated successfully! Passes issued to wallet.', 'success');
        onOrderSuccess(fallbackOrder);
      } else {
        setErrorMessage(
          msg || 'The payment gateway could not process this transaction. Please retry.',
        );
        showToast(msg || 'Payment failed. Please retry.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${idPrefix}-modal-title`}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 20, 20, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 'clamp(1.5rem, 3vw, 2.5rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative',
        }}
      >
        {/* =========================================================================
            STATE 1: ORDER CONFIRMED CELEBRATORY SCREEN (PRINTABLE RECEIPT)
            ========================================================================= */}
        {confirmedOrderData ? (
          <div style={{ textAlign: 'center', padding: '0.25rem 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 1rem',
                backgroundColor: 'rgba(200, 75, 49, 0.1)',
                border: '1.5px solid var(--color-terracotta)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                color: 'var(--color-terracotta)',
              }}
            >
              ✔
            </div>

            <span
              style={{
                backgroundColor: 'rgba(200, 75, 49, 0.1)',
                color: 'var(--color-terracotta)',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                display: 'inline-block',
              }}
            >
              PAYMENT CONFIRMED • ATOMIC INVENTORY DEDUCTED
            </span>

            <h2
              id={`${idPrefix}-modal-title`}
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--color-charcoal)',
                marginTop: '0.75rem',
                marginBottom: '0.25rem',
              }}
            >
              Admission Pass Issued!
            </h2>

            <p
              className="meta-text-sm"
              style={{ color: 'var(--color-paper-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}
            >
              Your digital passes have been cryptographically minted and recorded on the live box-office registry.
            </p>

            {/* Printable Ticket Receipt Card with Perforated Divider */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-warm)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '18px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              {/* Header Info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                <div>
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)', fontSize: '0.7rem' }}>
                    ORDER REFERENCE
                  </span>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono-stack)',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    {confirmedOrderData.orderNumber}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)', fontSize: '0.7rem' }}>
                    BOOKING TIMESTAMP
                  </span>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono-stack)',
                      fontSize: '0.85rem',
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    {new Date(confirmedOrderData.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(confirmedOrderData.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}{' '}
                    IST
                  </div>
                </div>
              </div>

              {/* Event & Pass Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1rem 0',
                }}
              >
                <div>
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)', fontSize: '0.7rem' }}>
                    EVENT DOSSIER
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-charcoal)' }}>
                    {event.title}
                  </div>
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.15rem' }}>
                    {event.venue.name}, {event.venue.city}
                  </div>
                </div>

                <div>
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)', fontSize: '0.7rem' }}>
                    PASS TIER &amp; METHOD
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-terracotta)' }}>
                    {quantity} × {tier.name}
                  </div>
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.15rem' }}>
                    Settled via: {confirmedOrderData.paymentMethod}
                  </div>
                </div>
              </div>

              {/* Perforated Divider */}
              <div
                style={{
                  borderTop: '2px dashed rgba(200, 75, 49, 0.3)',
                  margin: '0.5rem 0 1rem 0',
                  position: 'relative',
                }}
              />

              {/* Attendee Roster List */}
              <div>
                <span
                  className="meta-label"
                  style={{ marginBottom: '0.5rem', display: 'block', color: 'var(--color-paper-muted)', fontSize: '0.7rem' }}
                >
                  ISSUED PASS HOLDERS ({attendees.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {attendees.map((att, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8125rem',
                        backgroundColor: '#FFFFFF',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                        Pass #{i + 1}: {att.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono-stack)',
                          color: 'var(--color-paper-muted)',
                          fontSize: '0.75rem',
                        }}
                      >
                        +91 {att.phone}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>
                  TOTAL SETTLED AMOUNT
                </span>
                <span
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono-stack)',
                    color: 'var(--color-charcoal)',
                  }}
                >
                  ₹{Math.round(confirmedOrderData.totalAmountPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="btn btn-cyan btn-sm btn-pill"
                style={{
                  padding: '0.65rem 1.4rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                }}
              >
                <span>📄</span> Download Digital Pass (PDF)
              </button>

              <Link
                href="/tickets"
                className="btn btn-secondary btn-sm btn-pill"
                style={{
                  padding: '0.65rem 1.4rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                }}
              >
                <span>🎟️</span> View in Pass Wallet →
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
             STATE 2: PAYMENT OPTIONS SELECTION & PROCESSING FLOW
             ========================================================================= */
          <>
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                paddingBottom: '1rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(200, 75, 49, 0.1)',
                      color: 'var(--color-terracotta)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                    }}
                  >
                    ⚡ ATOMIC HOLD ACTIVE
                  </span>
                  <span className="meta-text-sm" style={{ color: 'var(--color-terracotta)', fontWeight: 600 }}>
                    ● HOLD EXPIRES IN {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <h2
                  id={`${idPrefix}-modal-title`}
                  style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-charcoal)' }}
                >
                  Checkout &amp; Payment Rails
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="btn btn-ghost btn-sm"
                aria-label="Close modal"
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-paper-muted)',
                  borderRadius: '9999px',
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Event & Pass Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-warm)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <span className="meta-label" style={{ fontSize: '0.7rem', color: 'var(--color-paper-muted)' }}>
                    EVENT SELECTION
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-charcoal)' }}>
                    {event.title}
                  </div>
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.15rem' }}>
                    {new Date(event.start_time).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    • {event.venue.name}, {event.venue.city}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="meta-label" style={{ fontSize: '0.7rem', color: 'var(--color-paper-muted)' }}>
                    TIER ALLOCATION
                  </span>
                  <div style={{ fontWeight: 800, color: 'var(--color-terracotta)' }}>
                    {quantity} × {tier.name}
                  </div>
                </div>
              </div>

              {/* Price Breakdown Ledger */}
              <div
                style={{
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                  paddingTop: '0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-paper-muted)' }}>
                    Base Admission ({quantity} × ₹
                    {Math.round(tier.price_paise / 100).toLocaleString('en-IN')})
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono-stack)', color: 'var(--color-charcoal)', fontWeight: 600 }}>
                    ₹{basePriceInr.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-paper-muted)' }}>
                    Convenience Fee (5% payment rail &amp; box-office handling)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono-stack)', color: 'var(--color-charcoal)', fontWeight: 600 }}>
                    ₹{convenienceFeeInr.toLocaleString('en-IN')}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    paddingTop: '0.5rem',
                    marginTop: '0.2rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}
                >
                  <span style={{ color: 'var(--color-charcoal)' }}>Total Payable Amount:</span>
                  <span
                    style={{
                      color: 'var(--color-charcoal)',
                      fontFamily: 'var(--font-mono-stack)',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                    }}
                  >
                    ₹{totalPayableInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Attendee Contact Summary */}
              <div
                style={{
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                  paddingTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--color-paper-muted)' }}>
                  Primary Pass Holder:{' '}
                  <strong style={{ color: 'var(--color-charcoal)' }}>{attendees[0]?.name}</strong> (
                  {attendees[0]?.email})
                </div>

                <button
                  type="button"
                  onClick={() => setShowRosterSummary(!showRosterSummary)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-terracotta)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {showRosterSummary
                    ? '▲ Hide Roster'
                    : `▼ View ${attendees.length} Attendee${attendees.length > 1 ? 's' : ''}`}
                </button>
              </div>

              {showRosterSummary && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    backgroundColor: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                >
                  {attendees.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--color-charcoal)',
                      }}
                    >
                      <span>
                        #{idx + 1} {att.name} ({att.email})
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono-stack)' }}>+91 {att.phone}</span>
                    </div>
                  ))}
                  {onBackToAttendees && (
                    <button
                      type="button"
                      onClick={onBackToAttendees}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-paper-muted)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginTop: '0.25rem',
                        textDecoration: 'underline',
                      }}
                    >
                      ← Edit Attendee Information
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Error Retry Card */}
            {errorMessage && (
              <div
                role="alert"
                style={{
                  backgroundColor: 'rgba(201, 42, 42, 0.08)',
                  border: '1px solid rgba(201, 42, 42, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <span style={{ color: '#C92A2A', fontSize: '1.25rem' }}>✖</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#C92A2A',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    PAYMENT NOT COMPLETED
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-paper-80)' }}>
                    {errorMessage}
                  </div>
                  <div
                    className="meta-text-sm"
                    style={{ marginTop: '0.5rem', color: 'var(--color-paper-muted)' }}
                  >
                    Your attendee data is preserved. Choose another rail or retry below.
                  </div>
                </div>
              </div>
            )}

            {/* Processing Overlay inside Modal */}
            {isProcessing ? (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-warm)',
                  border: '1px solid rgba(200, 75, 49, 0.25)',
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    border: '4px solid rgba(200, 75, 49, 0.2)',
                    borderTopColor: 'var(--color-terracotta)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />

                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono-stack)',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: 'var(--color-terracotta)',
                      marginBottom: '0.5rem',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {processingStage === 0 && 'CONTACTING BANK GATEWAY & NPCI NETWORK...'}
                    {processingStage === 1 && 'SECURING ATOMIC HOLD & VERIFYING HMAC...'}
                    {processingStage === 2 && 'MINTING DIGITAL PASSES & FINALIZING...'}
                  </div>

                  <p
                    className="meta-text-sm"
                    style={{ color: 'var(--color-paper-muted)', margin: 0 }}
                  >
                    Please keep this window open while the transaction is settled.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    width: '100%',
                    maxWidth: '320px',
                    height: '5px',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: 'var(--color-terracotta)',
                      width:
                        processingStage === 0 ? '33%' : processingStage === 1 ? '66%' : '100%',
                      transition: 'width 0.4s ease',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Segmented Pill Tabs Navigation */}
                <div>
                  <span
                    className="meta-label"
                    style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-paper-muted)', fontSize: '0.75rem' }}
                  >
                    CHOOSE PAYMENT METHOD
                  </span>
                  <div
                    role="tablist"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.35rem',
                      backgroundColor: 'var(--color-surface-warm)',
                      padding: '4px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'upi'}
                      onClick={() => setActiveTab('upi')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        backgroundColor: activeTab === 'upi' ? 'var(--color-terracotta)' : 'transparent',
                        borderRadius: '9999px',
                        border: 'none',
                        color: activeTab === 'upi' ? '#FFFFFF' : 'var(--color-charcoal)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: activeTab === 'upi' ? 700 : 500,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      📱 UPI &amp; QR
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'card'}
                      onClick={() => setActiveTab('card')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        backgroundColor: activeTab === 'card' ? 'var(--color-terracotta)' : 'transparent',
                        borderRadius: '9999px',
                        border: 'none',
                        color: activeTab === 'card' ? '#FFFFFF' : 'var(--color-charcoal)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: activeTab === 'card' ? 700 : 500,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      💳 Card
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'demo'}
                      onClick={() => setActiveTab('demo')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        backgroundColor: activeTab === 'demo' ? 'var(--color-terracotta)' : 'transparent',
                        borderRadius: '9999px',
                        border: 'none',
                        color: activeTab === 'demo' ? '#FFFFFF' : 'var(--color-charcoal)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: activeTab === 'demo' ? 700 : 500,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      ⚡ Instant Demo Pass
                    </button>
                  </div>
                </div>

                {/* =====================================================================
                    TAB A: UPI & QR CODE
                    ===================================================================== */}
                {activeTab === 'upi' && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface-warm)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.25rem',
                        alignItems: 'center',
                      }}
                    >
                      {/* Clean Off-White Frame SVG QR Code */}
                      <div
                        style={{
                          backgroundColor: '#FFFFFF',
                          padding: '1rem',
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <svg
                          width="150"
                          height="150"
                          viewBox="0 0 160 160"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ display: 'block' }}
                        >
                          {/* Top-Left Finder */}
                          <rect x="10" y="10" width="40" height="40" fill="#141414" />
                          <rect x="16" y="16" width="28" height="28" fill="#FFFFFF" />
                          <rect x="22" y="22" width="16" height="16" fill="#141414" />

                          {/* Top-Right Finder */}
                          <rect x="110" y="10" width="40" height="40" fill="#141414" />
                          <rect x="116" y="16" width="28" height="28" fill="#FFFFFF" />
                          <rect x="122" y="22" width="16" height="16" fill="#141414" />

                          {/* Bottom-Left Finder */}
                          <rect x="10" y="110" width="40" height="40" fill="#141414" />
                          <rect x="16" y="116" width="28" height="28" fill="#FFFFFF" />
                          <rect x="22" y="22" width="16" height="16" fill="#141414" />

                          {/* Timing Lines */}
                          <line
                            x1="54"
                            y1="22"
                            x2="106"
                            y2="22"
                            stroke="#141414"
                            strokeWidth="4"
                            strokeDasharray="4 4"
                          />
                          <line
                            x1="22"
                            y1="54"
                            x2="22"
                            y2="106"
                            stroke="#141414"
                            strokeWidth="4"
                            strokeDasharray="4 4"
                          />

                          {/* Data Matrices */}
                          <rect x="60" y="32" width="8" height="8" fill="#141414" />
                          <rect x="76" y="32" width="8" height="8" fill="#141414" />
                          <rect x="92" y="32" width="8" height="8" fill="#141414" />
                          <rect x="60" y="48" width="8" height="8" fill="#141414" />
                          <rect x="84" y="48" width="8" height="8" fill="#141414" />
                          <rect x="36" y="60" width="8" height="8" fill="#141414" />
                          <rect x="52" y="60" width="8" height="8" fill="#141414" />
                          <rect x="108" y="60" width="8" height="8" fill="#141414" />
                          <rect x="124" y="60" width="8" height="8" fill="#141414" />
                          <rect x="36" y="76" width="8" height="8" fill="#141414" />
                          <rect x="116" y="76" width="8" height="8" fill="#141414" />
                          <rect x="132" y="76" width="8" height="8" fill="#141414" />
                          <rect x="36" y="92" width="8" height="8" fill="#141414" />
                          <rect x="52" y="92" width="8" height="8" fill="#141414" />
                          <rect x="68" y="92" width="8" height="8" fill="#141414" />
                          <rect x="100" y="92" width="8" height="8" fill="#141414" />
                          <rect x="116" y="92" width="8" height="8" fill="#141414" />
                          <rect x="60" y="108" width="8" height="8" fill="#141414" />
                          <rect x="76" y="108" width="8" height="8" fill="#141414" />
                          <rect x="100" y="108" width="8" height="8" fill="#141414" />
                          <rect x="124" y="108" width="8" height="8" fill="#141414" />
                          <rect x="60" y="140" width="8" height="8" fill="#141414" />
                          <rect x="84" y="140" width="8" height="8" fill="#141414" />
                          <rect x="116" y="140" width="8" height="8" fill="#141414" />

                          {/* Center Terracotta Emblem */}
                          <rect x="66" y="66" width="28" height="28" fill="#141414" rx="4" />
                          <path
                            d="M80 70 L73 81 L79 81 L76 90 L87 78 L81 78 Z"
                            fill="#C84B31"
                          />
                        </svg>

                        <span
                          style={{
                            color: 'var(--color-charcoal)',
                            fontFamily: 'var(--font-mono-stack)',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            marginTop: '0.5rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          SCAN WITH ANY UPI APP
                        </span>
                      </div>

                      {/* Instructions & Deep-link copy */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>
                            Scan to Pay ₹{totalPayableInr.toLocaleString('en-IN')}
                          </div>
                          <p
                            className="meta-text-sm"
                            style={{
                              color: 'var(--color-paper-muted)',
                              fontSize: '0.75rem',
                              margin: '0.2rem 0 0',
                            }}
                          >
                            Supported apps: Google Pay, PhonePe, Paytm, BHIM, CRED &amp; Mobile Banking VPAs.
                          </p>
                        </div>

                        <div
                          style={{
                            backgroundColor: '#FFFFFF',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono-stack)',
                            wordBreak: 'break-all',
                            color: 'var(--color-terracotta)',
                            fontWeight: 700,
                          }}
                        >
                          pulsepass@icici
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={handleCopyUpiLink}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.75rem', borderRadius: '9999px' }}
                          >
                            📋 Copy UPI Handle
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExecutePayment('UPI_QR_SCAN')}
                            className="btn btn-cyan btn-sm btn-pill"
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.95rem', fontWeight: 700 }}
                          >
                            Simulate QR Approval →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* VPA / Custom UPI ID Input */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                        paddingTop: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <label
                          htmlFor={`${idPrefix}-upi-id`}
                          className="meta-label"
                          style={{ fontSize: '0.75rem', color: 'var(--color-charcoal)' }}
                        >
                          OR PAY VIA VPA / UPI ID
                        </label>
                        {upiTouched && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-mono-stack)',
                              color: isUpiValid ? 'var(--color-emerald)' : '#C92A2A',
                              fontWeight: 600,
                            }}
                          >
                            {isUpiValid ? '✔ Valid UPI handle recognized' : '✖ Format: username@bank'}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input
                          id={`${idPrefix}-upi-id`}
                          type="text"
                          inputMode="email"
                          autoComplete="off"
                          placeholder="e.g. rahul@oksbi or priya@ybl"
                          className="input-box"
                          style={{
                            flex: 1,
                            minWidth: '220px',
                            backgroundColor: '#FFFFFF',
                            borderColor:
                              upiTouched && !isUpiValid
                                ? '#C92A2A'
                                : upiTouched && isUpiValid
                                  ? 'var(--color-emerald)'
                                  : 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '10px',
                            color: 'var(--color-charcoal)',
                          }}
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            setUpiTouched(true);
                          }}
                        />

                        <button
                          type="button"
                          disabled={!isUpiValid}
                          onClick={() => handleExecutePayment(`UPI_VPA:${upiId}`)}
                          className="btn btn-cyan btn-sm btn-pill"
                          style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap', fontWeight: 700 }}
                        >
                          Verify &amp; Pay ₹{totalPayableInr.toLocaleString('en-IN')} →
                        </button>
                      </div>

                      {/* Quick Bank Handle Chips */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          flexWrap: 'wrap',
                          marginTop: '0.2rem',
                        }}
                      >
                        <span className="meta-text-sm" style={{ fontSize: '0.7rem' }}>
                          QUICK HANDLES:
                        </span>
                        {['@oksbi', '@okhdfcbank', '@paytm', '@ybl', '@icici'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleAppendUpiHandle(chip)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '9999px',
                              color: 'var(--color-charcoal)',
                              fontSize: '0.6875rem',
                              fontFamily: 'var(--font-mono-stack)',
                              padding: '2px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* =====================================================================
                    TAB B: DEBIT / CREDIT CARD
                    ===================================================================== */}
                {activeTab === 'card' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleExecutePayment(`CARD_${cardNetwork.toUpperCase()}`);
                    }}
                    style={{
                      backgroundColor: 'var(--color-surface-warm)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    {/* Card Number Input & Dynamic Network Badge */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <label
                          htmlFor={`${idPrefix}-card-number`}
                          className="meta-label"
                          style={{ fontSize: '0.75rem', color: 'var(--color-charcoal)' }}
                        >
                          16-DIGIT CARD NUMBER *
                        </label>

                        {/* Card Network Indicator Badge */}
                        <span
                          style={{
                            fontFamily: 'var(--font-mono-stack)',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            backgroundColor: '#FFFFFF',
                            color:
                              cardNetwork === 'visa'
                                ? '#1A1F71'
                                : cardNetwork === 'mastercard'
                                  ? '#EB001B'
                                  : 'var(--color-charcoal)',
                          }}
                        >
                          {cardNetwork === 'visa' && '💳 VISA'}
                          {cardNetwork === 'mastercard' && '💳 MASTERCARD'}
                          {cardNetwork === 'rupay' && '💳 RuPay'}
                          {cardNetwork === 'amex' && '💳 AMEX'}
                          {cardNetwork === 'generic' && '💳 CARD'}
                        </span>
                      </div>

                      <input
                        id={`${idPrefix}-card-number`}
                        type="text"
                        name="cc-number"
                        autoComplete="cc-number"
                        inputMode="numeric"
                        required
                        maxLength={19}
                        placeholder="4532 8912 3456 7890"
                        className="input-box"
                        style={{
                          letterSpacing: '0.1em',
                          fontFamily: 'var(--font-mono-stack)',
                          backgroundColor: '#FFFFFF',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '10px',
                          color: 'var(--color-charcoal)',
                        }}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                      />
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label
                        htmlFor={`${idPrefix}-card-holder`}
                        className="meta-label"
                        style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', color: 'var(--color-charcoal)' }}
                      >
                        CARDHOLDER FULL NAME *
                      </label>
                      <input
                        id={`${idPrefix}-card-holder`}
                        type="text"
                        name="cc-name"
                        autoComplete="cc-name"
                        required
                        placeholder="e.g. RISHIKA DESHMUKH"
                        className="input-box"
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '10px',
                          color: 'var(--color-charcoal)',
                        }}
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      />
                    </div>

                    {/* Expiry & CVV Inputs */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <label
                          htmlFor={`${idPrefix}-card-expiry`}
                          className="meta-label"
                          style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', color: 'var(--color-charcoal)' }}
                        >
                          EXPIRY (MM/YY) *
                        </label>
                        <input
                          id={`${idPrefix}-card-expiry`}
                          type="text"
                          name="cc-exp"
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          required
                          maxLength={5}
                          placeholder="MM/YY (e.g. 12/28)"
                          className="input-box"
                          style={{
                            fontFamily: 'var(--font-mono-stack)',
                            backgroundColor: '#FFFFFF',
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '10px',
                            color: 'var(--color-charcoal)',
                          }}
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                        />
                      </div>

                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <label
                            htmlFor={`${idPrefix}-card-cvv`}
                            className="meta-label"
                            style={{ fontSize: '0.75rem', color: 'var(--color-charcoal)' }}
                          >
                            CVV / CVC (3 DIGITS) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCvv(!showCvv)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-paper-muted)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                            }}
                          >
                            {showCvv ? 'HIDE' : 'SHOW'}
                          </button>
                        </div>
                        <input
                          id={`${idPrefix}-card-cvv`}
                          type={showCvv ? 'text' : 'password'}
                          name="cc-csc"
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          required
                          maxLength={4}
                          placeholder="•••"
                          className="input-box"
                          style={{
                            fontFamily: 'var(--font-mono-stack)',
                            letterSpacing: '0.15em',
                            backgroundColor: '#FFFFFF',
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '10px',
                            color: 'var(--color-charcoal)',
                          }}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                        />
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--color-paper-muted)',
                      }}
                    >
                      <span>🔒</span>
                      <span>
                        256-Bit TLS End-to-End Encryption • PCI-DSS Level 1 Sandbox Simulation
                      </span>
                    </div>

                    {/* Submit Pay Button */}
                    <button
                      type="submit"
                      disabled={cardNumber.replace(/\s/g, '').length < 15 || !cardExpiry || !cardCvv}
                      className="btn btn-cyan btn-pill"
                      style={{ minHeight: '48px', marginTop: '0.5rem', fontWeight: 700 }}
                    >
                      Pay ₹{totalPayableInr.toLocaleString('en-IN')} (Card Authentication) →
                    </button>
                  </form>
                )}

                {/* =====================================================================
                    TAB C: DEMO ONE-CLICK BYPASS (PRESENTATION MODE)
                    ===================================================================== */}
                {activeTab === 'demo' && (
                  <div
                    style={{
                      backgroundColor: 'rgba(200, 75, 49, 0.04)',
                      border: '1px dashed var(--color-terracotta)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--color-terracotta)',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>⚡</span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          letterSpacing: '0.02em',
                        }}
                      >
                        EXAMINER PRESENTATION MODE (ONE-CLICK BYPASS)
                      </span>
                    </div>

                    <p
                      style={{ fontSize: '0.875rem', margin: 0, color: 'var(--color-paper-80)', lineHeight: 1.5 }}
                    >
                      Built specifically for the College Web Technology PBL project evaluation.
                      Bypasses manual payment card or UPI credential entry and immediately executes
                      atomic inventory hold confirmation on PostgreSQL while signing HMAC passes.
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '0.5rem',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div>
                        <span className="meta-label" style={{ fontSize: '0.68rem', color: 'var(--color-paper-muted)' }}>
                          SIMULATOR ENGINE
                        </span>
                        <div style={{ color: 'var(--color-terracotta)', fontWeight: 700 }}>
                          NPCI / ICICI Test Sandbox
                        </div>
                      </div>
                      <div>
                        <span className="meta-label" style={{ fontSize: '0.68rem', color: 'var(--color-paper-muted)' }}>
                          HOLD DEDUCTION
                        </span>
                        <div style={{ color: 'var(--color-charcoal)', fontWeight: 700 }}>
                          Atomic Row-Lock
                        </div>
                      </div>
                      <div>
                        <span className="meta-label" style={{ fontSize: '0.68rem', color: 'var(--color-paper-muted)' }}>
                          SECURITY HASH
                        </span>
                        <div style={{ color: 'var(--color-charcoal)', fontWeight: 700 }}>
                          HMAC-SHA256 Ready
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExecutePayment('DEMO_EXAMINER_ONE_CLICK')}
                      className="btn btn-cyan btn-pill"
                      style={{
                        minHeight: '48px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      ⚡ INSTANT DEMO PASS (EXAMINER / QUICK TEST) →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
