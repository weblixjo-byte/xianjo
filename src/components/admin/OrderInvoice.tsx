'use client';

import React from 'react';
import { Order } from '@/types/admin';
import { BRANDING } from '@/constants/branding';

interface OrderInvoiceProps {
  order: Order;
}

const OrderInvoice: React.FC<OrderInvoiceProps> = ({ order }) => {
  // Format Date
  const dateStr = new Date(order.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate matching values (Independent Math as requested)
  const calculatedSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = order.deliveryFee || 0;
  const serviceFee = order.serviceFee || 0;
  const discountAmount = order.discountAmount || 0;
  const finalTotal = calculatedSubtotal + deliveryFee + serviceFee - discountAmount;

  return (
    <div className="invoice-container text-black bg-white" dir="ltr">
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .invoice-body {
          width: 80mm;
          padding: 4mm;
          font-family: 'Courier New', Courier, monospace;
          line-height: 1.2;
          font-size: 12px;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 5mm;
        }

        .receipt-logo {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 1mm;
        }

        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }

        .items-table {
          width: 100%;
          margin-top: 3mm;
        }

        .items-header {
          display: flex;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 1mm;
          margin-bottom: 1mm;
        }

        .item-row {
          display: flex;
          margin-bottom: 1mm;
        }

        .col-qty { width: 10%; }
        .col-desc { width: 60%; }
        .col-total { width: 30%; text-align: right; }

        .totals-section {
          margin-top: 4mm;
          border-top: 1px solid #000;
          padding-top: 2mm;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }

        .grand-total {
          font-size: 16px;
          font-weight: bold;
          margin-top: 2mm;
          padding-top: 1mm;
          border-top: 1px dashed #000;
        }

        .footer-note {
          text-align: center;
          margin-top: 6mm;
          font-size: 10px;
        }
      `}</style>

      <div className="invoice-body">
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-logo">{BRANDING.shortNameEn.toUpperCase()}</div>
          <div>{BRANDING.sloganEn}</div>
          <div>{BRANDING.contact.addressEn}</div>
          <div>Tel: {BRANDING.contact.phone}</div>
        </div>

        <div className="receipt-divider"></div>

        {/* Order Info */}
        <div className="info-row">
          <span>Order #:</span>
          <span>{order.id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="info-row">
          <span>Date:</span>
          <span>{dateStr}</span>
        </div>
        <div className="info-row">
          <span>Name:</span>
          <span>{order.customerName}</span>
        </div>
        <div className="info-row">
          <span>Phone:</span>
          <span>{order.phoneNumber}</span>
        </div>
        <div className="info-row">
          <span>Type:</span>
          <span>{order.orderType}</span>
        </div>
        {order.deliveryArea && (
          <div className="info-row">
            <span>Area:</span>
            <span>{order.deliveryArea}</span>
          </div>
        )}

        <div className="receipt-divider"></div>

        {/* Items */}
        <div className="items-table">
          <div className="items-header">
            <div className="col-qty">#</div>
            <div className="col-desc">ITEM</div>
            <div className="col-total">TOTAL</div>
          </div>
          {order.items.map((item, idx) => (
            <div key={idx} className="item-row">
              <div className="col-qty">{item.quantity}</div>
              <div className="col-desc">{item.name}</div>
              <div className="col-total">{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="receipt-divider"></div>

        {/* Totals Section */}
        <div className="totals-section">
          <div className="total-row">
            <span>SUBTOTAL:</span>
            <span>{calculatedSubtotal.toFixed(2)} JOD</span>
          </div>
          
          {deliveryFee > 0 && (
            <div className="total-row">
              <span>DELIVERY FEE:</span>
              <span>+{deliveryFee.toFixed(2)} JOD</span>
            </div>
          )}
          
          {serviceFee > 0 && (
            <div className="total-row">
              <span>FEES/SERVICE CHARGE:</span>
              <span>+{serviceFee.toFixed(2)} JOD</span>
            </div>
          )}
          
          {discountAmount > 0 && (
            <div className="total-row" style={{ color: '#000' }}>
              <span>PROMO DISCOUNT ({order.couponCode}):</span>
              <span>-{discountAmount.toFixed(2)} JOD</span>
            </div>
          )}

          <div className="receipt-divider" style={{ borderTopStyle: 'solid', marginTop: '2mm' }}></div>
          
          <div className="total-row grand-total" style={{ fontSize: '18px', borderTop: 'none', marginTop: '1mm' }}>
            <span>GRAND TOTAL:</span>
            <span>{finalTotal.toFixed(2)} JOD</span>
          </div>
          
          <div className="receipt-divider" style={{ borderTopStyle: 'solid', marginBottom: '2mm', marginTop: '1mm' }}></div>
        </div>

        {/* Payment */}
        <div style={{ marginTop: '3mm', fontStyle: 'italic', fontSize: '10px' }}>
          Payment: {order.paymentMethod} / {order.paymentStatus}
        </div>

        <div className="footer-note">
          <div>THANK YOU FOR YOUR ORDER!</div>
          <div style={{ marginTop: '1mm' }}>Visit us: {BRANDING.shortNameEn.toLowerCase()}jo.com</div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoice;
