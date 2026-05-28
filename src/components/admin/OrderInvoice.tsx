'use client';

import React from 'react';
import { Order, Product } from '@/types/admin';
import { BRANDING } from '@/constants/branding';

interface OrderInvoiceProps {
  order: Order;
  products?: Product[];
}

const OrderInvoice: React.FC<OrderInvoiceProps> = ({ order, products }) => {
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
          line-height: 1.4;
          font-size: 13px;
          font-weight: 700;
          color: #000;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 5mm;
        }

        .receipt-logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2mm;
        }

        .receipt-logo-img {
          width: 50px;
          height: 50px;
          object-fit: contain;
        }

        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5mm;
        }

        .items-table {
          width: 100%;
          margin-top: 4mm;
        }

        .items-header {
          display: flex;
          font-weight: 900;
          border-bottom: 1px dashed #000;
          padding-bottom: 1.5mm;
          margin-bottom: 2mm;
          font-size: 14px;
        }

        .item-row {
          display: flex;
          margin-bottom: 2mm;
          padding-bottom: 1mm;
        }

        .col-qty { width: 15%; font-weight: 900; }
        .col-desc { width: 55%; }
        .col-total { width: 30%; text-align: right; font-weight: 900; }

        .totals-section {
          margin-top: 5mm;
          border-top: 1px dashed #000;
          padding-top: 3mm;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5mm;
        }

        .grand-total {
          font-size: 18px;
          font-weight: 900;
          margin-top: 3mm;
          padding-top: 2mm;
          border-top: 1px dashed #000;
        }

        .payment-badge {
          margin-top: 4mm;
          font-size: 12px;
          font-weight: 900;
          border: 1px dashed #000;
          padding: 2mm;
          text-align: center;
          text-transform: uppercase;
        }

        .footer-note {
          text-align: center;
          margin-top: 8mm;
          font-size: 11px;
          font-weight: 900;
        }
      `}</style>

      <div className="invoice-body">
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-logo-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Xian Restaurant Logo" className="receipt-logo-img" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '1mm' }}>{BRANDING.nameEn.toUpperCase()}</div>
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
            <div className="col-qty">QTY</div>
            <div className="col-desc">ITEM</div>
            <div className="col-total">TOTAL</div>
          </div>
          {order.items.map((item, idx) => {
            const dbProduct = products?.find(p => p.id === item.productId);
            const itemNameEn = dbProduct ? dbProduct.nameEn : item.name;
            
            return (
              <div key={idx} className="item-row">
                <div className="col-qty">{item.quantity}x</div>
                <div className="col-desc">{itemNameEn}</div>
                <div className="col-total">{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            );
          })}
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
              <span>SERVICE CHARGE:</span>
              <span>+{serviceFee.toFixed(2)} JOD</span>
            </div>
          )}
          
          {discountAmount > 0 && (
            <div className="total-row">
              <span>PROMO DISCOUNT ({order.couponCode}):</span>
              <span>-{discountAmount.toFixed(2)} JOD</span>
            </div>
          )}

          <div className="receipt-divider" style={{ marginTop: '2mm' }}></div>
          
          <div className="total-row grand-total" style={{ borderTop: 'none', marginTop: '1mm' }}>
            <span>GRAND TOTAL:</span>
            <span>{finalTotal.toFixed(2)} JOD</span>
          </div>
          
          <div className="receipt-divider" style={{ marginBottom: '2mm', marginTop: '1mm' }}></div>
        </div>

        {/* Payment */}
        <div className="payment-badge">
          Payment: {order.paymentMethod} / {order.paymentStatus}
        </div>

        {/* GPS Location QR Code (Only if customer clicked 'determine my location' and coordinates link is present) */}
        {order.address?.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/) && (
          <div style={{ marginTop: '6mm', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, marginBottom: '2mm', textTransform: 'uppercase' }}>
              SCANNABLE GPS DELIVERY LOCATION
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(order.address.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/)?.[0] || '')}`} 
              alt="Google Maps GPS Location QR Code" 
              style={{ width: '130px', height: '130px', border: '1px solid #000', padding: '5px' }}
            />
            <div style={{ fontSize: '9px', marginTop: '1.5mm', opacity: 0.7 }}>
              Scan with phone camera to navigate
            </div>
          </div>
        )}

        <div className="footer-note">
          <div>THANK YOU FOR YOUR ORDER!</div>
          <div style={{ marginTop: '1.5mm' }}>Visit us: xianjo-order.com</div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoice;
