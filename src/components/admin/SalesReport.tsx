'use client';

import React from 'react';
import { ReportSummary } from '@/types/admin';
import { BRANDING } from '@/constants/branding';

interface SalesReportProps {
  reportData: ReportSummary;
  reportType: string;
}

const SalesReport: React.FC<SalesReportProps> = ({ reportData, reportType }) => {
  const dateStr = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getReportTitle = () => {
    switch(reportType) {
      case 'daily': return 'DAILY SALES REPORT';
      case 'weekly': return 'WEEKLY SALES REPORT';
      case 'monthly': return 'MONTHLY SALES REPORT';
      default: return 'ALL-TIME SALES REPORT';
    }
  };

  return (
    <div className="report-container text-black bg-white" dir="ltr">
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
        }
        
        .report-body {
          width: 80mm;
          padding: 4mm;
          font-family: 'Courier New', Courier, monospace;
          line-height: 1.3;
          font-size: 13px;
          font-weight: 700;
          color: #000;
        }

        .report-header {
          text-align: center;
          margin-bottom: 5mm;
        }

        .report-logo {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 1mm;
          border: 2px solid #000;
          padding: 2mm;
        }

        .report-title {
          font-size: 16px;
          font-weight: 900;
          text-decoration: underline;
          margin-bottom: 3mm;
          margin-top: 2mm;
        }

        .report-divider {
          border-top: 2px solid #000;
          margin: 3mm 0;
        }

        .stats-section {
          margin-bottom: 5mm;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2mm;
          font-weight: 900;
        }

        .items-header {
          display: flex;
          font-weight: 900;
          border-bottom: 2px solid #000;
          padding-bottom: 2mm;
          margin-bottom: 3mm;
          margin-top: 5mm;
        }

        .item-row {
          display: flex;
          margin-bottom: 2mm;
          border-bottom: 1px solid #000;
          padding-bottom: 1mm;
        }

        .col-qty { width: 15%; text-align: right; font-weight: 900; }
        .col-name { width: 55%; padding-left: 0; }
        .col-sub { width: 30%; text-align: right; font-weight: 900; }

        .report-footer {
          text-align: center;
          margin-top: 6mm;
          font-size: 11px;
          font-weight: 900;
          border-top: 2px solid #000;
          padding-top: 3mm;
        }
      `}</style>

      <div className="report-body">
        <div className="report-header">
          <div className="report-logo">{BRANDING.shortNameEn.toUpperCase()}</div>
          <div className="report-title">{getReportTitle()}</div>
          <div>Printed: {dateStr}</div>
        </div>

        <div className="report-divider"></div>

        <div className="items-header">
          <div className="col-name" style={{ paddingLeft: '0' }}>ITEM</div>
          <div className="col-qty">QTY</div>
          <div className="col-sub">SUBTOTAL</div>
        </div>
        
        {reportData.itemBreakdown?.map((item, idx) => (
          <div key={idx} className="item-row">
            <div className="col-name" style={{ paddingLeft: '0' }}>{item.name}</div>
            <div className="col-qty">{item.quantity}</div>
            <div className="col-sub">{item.revenue.toFixed(2)}</div>
          </div>
        ))}

        <div className="report-divider"></div>

        {/* Stats Section moved to bottom as per request */}
        <div className="stats-section" style={{ marginTop: '4mm' }}>
          <div className="stat-row">
            <span>TOTAL ORDERS:</span>
            <span>{reportData.totalOrders}</span>
          </div>
          <div className="stat-row" style={{ fontSize: '14px' }}>
            <span>TOTAL REVENUE:</span>
            <span>{reportData.totalRevenue.toFixed(2)} JOD</span>
          </div>
        </div>

        <div className="report-footer">
          <div>*** END OF SALES REPORT ***</div>
          <div style={{ marginTop: '1mm' }}>{BRANDING.nameEn} - Admin System</div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
