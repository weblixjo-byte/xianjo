'use client';

import React from 'react';
import { ReportSummary } from '@/types/admin';

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
          line-height: 1.2;
          font-size: 12px;
        }

        .report-header {
          text-align: center;
          margin-bottom: 5mm;
        }

        .report-logo {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 1mm;
        }

        .report-title {
          font-size: 14px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 2mm;
        }

        .report-divider {
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }

        .stats-section {
          margin-bottom: 4mm;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
          font-weight: bold;
        }

        .items-header {
          display: flex;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 1mm;
          margin-bottom: 2mm;
          margin-top: 4mm;
        }

        .item-row {
          display: flex;
          margin-bottom: 1mm;
        }

        .col-qty { width: 15%; font-weight: bold; }
        .col-name { width: 85%; }

        .report-footer {
          text-align: center;
          margin-top: 8mm;
          font-size: 10px;
          border-top: 1px solid #000;
          padding-top: 2mm;
        }
      `}</style>

      <div className="report-body">
        <div className="report-header">
          <div className="report-logo">XIAN</div>
          <div className="report-title">{getReportTitle()}</div>
          <div>Printed: {dateStr}</div>
        </div>

        <div className="report-divider"></div>

        <div className="stats-section">
          <div className="stat-row">
            <span>TOTAL REVENUE:</span>
            <span>{reportData.totalRevenue.toFixed(2)} JOD</span>
          </div>
          <div className="stat-row">
            <span>TOTAL ORDERS:</span>
            <span>{reportData.totalOrders}</span>
          </div>
        </div>

        <div className="report-divider"></div>

        <div className="items-header">ITEMIZED BREAKDOWN</div>
        {reportData.itemBreakdown?.map((item, idx) => (
          <div key={idx} className="item-row">
            <div className="col-qty">{item.quantity}x</div>
            <div className="col-name">{item.name}</div>
          </div>
        ))}

        <div className="report-footer">
          <div>END OF REPORT</div>
          <div style={{ marginTop: '1mm' }}>Xian Restaurant - Admin System</div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
