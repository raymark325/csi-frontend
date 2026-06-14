import API from '../api';

export const reportService = {
  /**
   * Fetch data needed for PDF report card generation.
   * Uses the existing report-card API endpoint.
   */
  getReportCard() {
    return API.get('/report-card');
  },

  /**
   * Generate a printable PDF from the current page via browser print.
   * Opens a styled print window for the student's report card.
   */
  printReportCard(studentName, reportData) {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    const rows = (reportData.sections || []).map(sec => `
      <tr>
        <td>${sec.name || '-'}</td>
        <td>${sec.course || '-'}</td>
        <td style="text-align:center; font-weight:700; color:${sec.grade >= 75 ? '#16a34a' : '#dc2626'}">${sec.grade ?? '-'}</td>
      </tr>
    `).join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${studentName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 32px; color: #111; }
          h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
          p  { margin: 0 0 4px; font-size: 13px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { background: #1d4ed8; color: #fff; padding: 10px 12px; text-align: left; font-size: 13px; }
          td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          tr:nth-child(even) td { background: #f9fafb; }
          .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Report Card</h1>
        <p>Student: <strong>${studentName}</strong></p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>Course</th>
              <th>Final Grade (%)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">SMS School Management System &mdash; Official Report</div>
        <script>window.onload = function(){ window.print(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  },
};

export default reportService;
