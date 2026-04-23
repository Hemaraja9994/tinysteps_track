import { format } from 'date-fns';

function safeDate(value?: string) {
  if (!value) return 'Not recorded';
  try {
    return format(new Date(value), 'MMM dd, yyyy');
  } catch {
    return value;
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sectionTable(title: string, columns: string[], rows: string[][]) {
  if (!rows.length) {
    return `
      <section class="report-section">
        <h2>${escapeHtml(title)}</h2>
        <p class="empty">No records available.</p>
      </section>
    `;
  }

  const header = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `
    <section class="report-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="table-wrap">
        <table>
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function printComprehensiveReport({
  baby,
  growthData,
  hearingData,
  eyeData,
  milestoneData,
  vaccinationData,
  appointmentData,
  mentalHealthData,
}: {
  baby: any;
  growthData: any[];
  hearingData: any[];
  eyeData: any[];
  milestoneData: any[];
  vaccinationData: any[];
  appointmentData: any[];
  mentalHealthData: any[];
}) {
  const currentAgeWeeks = baby?.dob ? Math.max(0, Math.floor((Date.now() - new Date(baby.dob).getTime()) / (1000 * 60 * 60 * 24 * 7))) : 0;
  const correctedAgeWeeks = Math.max(0, currentAgeWeeks - (40 - (baby?.gestationalAgeAtBirth || 40)));

  const growthSection = sectionTable(
    'Growth Monitoring',
    ['Date', 'Weight (g)', 'Length (cm)', 'Head Circ. (cm)'],
    growthData.map((record) => [
      safeDate(record.date),
      record.weight ?? '-',
      record.length ?? '-',
      record.headCircumference ?? '-',
    ])
  );

  const hearingSection = sectionTable(
    'Hearing Screening',
    ['Date', 'Type', 'Left', 'Right', 'Follow-up'],
    hearingData.map((record) => [
      safeDate(record.date),
      record.testType ?? '-',
      record.resultLeft ?? '-',
      record.resultRight ?? '-',
      record.followUpType ?? '-',
    ])
  );

  const eyeSection = sectionTable(
    'Retinal / ROP Screening',
    ['Date', 'Status', 'Left Eye', 'Right Eye', 'Follow-up'],
    eyeData.map((record) => [
      safeDate(record.date),
      record.reportStatus || record.stage || '-',
      `${record.leftEye?.stage || record.stage || '-'} | Zone ${record.leftEye?.zone || record.zone || '-'}`,
      `${record.rightEye?.stage || record.stage || '-'} | Zone ${record.rightEye?.zone || record.zone || '-'}`,
      record.followUpDate ? safeDate(record.followUpDate) : 'TBD',
    ])
  );

  const milestoneSection = sectionTable(
    'Developmental Milestones',
    ['Date', 'Module', 'Category', 'Skill', 'Status'],
    milestoneData.map((record) => [
      safeDate(record.dateObserved),
      record.module ?? '-',
      record.category ?? '-',
      record.skill ?? '-',
      record.status ?? '-',
    ])
  );

  const vaccineSection = sectionTable(
    'Vaccination Log',
    ['Record', 'Completed At'],
    vaccinationData.map((record) => [
      record.id ?? '-',
      safeDate(record.completedAt),
    ])
  );

  const appointmentSection = sectionTable(
    'Appointments & Care Coordination',
    ['Date', 'Time', 'Specialist', 'Purpose', 'Status'],
    appointmentData.map((record) => [
      safeDate(record.date),
      record.time ?? '-',
      record.specialist ?? '-',
      record.purpose ?? '-',
      record.status ?? '-',
    ])
  );

  const mentalHealthSection = sectionTable(
    'Family / Mental Health Check-ins',
    ['Date', 'Stress Level', 'Support', 'Notes'],
    mentalHealthData.map((record) => [
      safeDate(record.date),
      record.parentStressLevel != null ? `${record.parentStressLevel}/10` : '-',
      record.supportProvided ?? '-',
      record.notes ?? '-',
    ])
  );

  const html = `
    <html>
      <head>
        <title>${escapeHtml(baby?.name || 'Baby')} Comprehensive Report</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            line-height: 1.5;
            font-size: 12px;
            background: #ffffff;
          }
          .report {
            max-width: 980px;
            margin: 0 auto;
          }
          .hero {
            border: 1px solid #dbeafe;
            background: linear-gradient(135deg, #eef2ff, #f8fafc);
            border-radius: 22px;
            padding: 24px;
            margin-bottom: 22px;
          }
          .eyebrow {
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            font-weight: 800;
            color: #4f46e5;
            margin-bottom: 10px;
          }
          h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            line-height: 1.1;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 18px;
          }
          .meta-card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 12px 14px;
            background: #fff;
          }
          .meta-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #64748b;
            font-weight: 800;
          }
          .meta-value {
            margin-top: 6px;
            font-size: 18px;
            font-weight: 800;
          }
          .report-section {
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          h2 {
            font-size: 17px;
            margin: 0 0 10px 0;
            padding-bottom: 6px;
            border-bottom: 2px solid #e2e8f0;
          }
          .two-col {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 14px;
            background: #fff;
          }
          .summary-card h3 {
            margin: 0 0 8px 0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #475569;
          }
          .summary-card p {
            margin: 0;
            font-size: 12px;
          }
          .summary {
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            background: #f8fafc;
            padding: 14px 16px;
            margin-top: 14px;
          }
          .table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            vertical-align: top;
            font-size: 11px;
          }
          th {
            background: #f8fafc;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .empty {
            color: #64748b;
            font-style: italic;
          }
          .footer-note {
            margin-top: 24px;
            color: #64748b;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="hero">
            <div class="eyebrow">TinySteps Comprehensive Clinical Report</div>
            <h1>${escapeHtml(baby?.name || 'Unnamed baby')}</h1>
            <div>
              DOB ${escapeHtml(safeDate(baby?.dob))} | GA at birth ${escapeHtml(baby?.gestationalAgeAtBirth ?? '-')} weeks | Birth weight ${escapeHtml(baby?.birthWeight ?? '-')} g
            </div>
            <div class="meta-grid">
              <div class="meta-card">
                <div class="meta-label">Chronological Age</div>
                <div class="meta-value">${escapeHtml(currentAgeWeeks)} weeks</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Corrected Age</div>
                <div class="meta-value">${escapeHtml(correctedAgeWeeks)} weeks</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">High Risk Factors</div>
                <div class="meta-value" style="font-size:14px;">${escapeHtml(baby?.highRiskFactors?.join(', ') || 'None recorded')}</div>
              </div>
            </div>
            <div class="summary">
              <strong>Clinical overview:</strong> This report compiles growth, hearing, retinal screening, developmental, vaccination, appointment, and family support records into one print-friendly summary.
            </div>
          </div>
          ${growthSection}
          <div class="two-col">
            <div class="summary-card">
              <h3>Neuro-sensory Follow-up</h3>
              <p>Hearing records: ${escapeHtml(String(hearingData.length))} | Retinal reports: ${escapeHtml(String(eyeData.length))}</p>
            </div>
            <div class="summary-card">
              <h3>Development and Prevention</h3>
              <p>Milestones: ${escapeHtml(String(milestoneData.length))} | Vaccination records: ${escapeHtml(String(vaccinationData.length))}</p>
            </div>
          </div>
          ${hearingSection}
          ${eyeSection}
          ${milestoneSection}
          ${vaccineSection}
          ${appointmentSection}
          ${mentalHealthSection}
          <div class="footer-note">
            Generated on ${escapeHtml(safeDate(new Date().toISOString()))} from TinySteps. Use browser print and choose "Save as PDF" for a PDF copy.
          </div>
        </div>
      </body>
    </html>
  `;

  const reportWindow = window.open('', '_blank', 'width=1100,height=900');
  if (!reportWindow) return;
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  setTimeout(() => reportWindow.print(), 300);
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportBabiesRegistryCsv(babies: any[]) {
  downloadCsv(
    `tinysteps-babies-registry-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    [
      ['Name', 'DOB', 'Gestational Age', 'Birth Weight', 'Risk Status', 'District', 'Region', 'MR Number', 'POCD Number'],
      ...babies.map((baby) => [
        baby.name || '',
        safeDate(baby.dob),
        baby.gestationalAgeAtBirth ?? '',
        baby.birthWeight ?? '',
        baby.highRiskFactors?.length ? 'High Risk' : 'Stable',
        baby.district || '',
        baby.region || '',
        baby.mrNumber || '',
        baby.pocdNumber || '',
      ]),
    ]
  );
}

export function exportDashboardStatsCsv(babies: any[]) {
  const total = babies.length;
  const highRisk = babies.filter((baby) => baby.highRiskFactors?.length > 0).length;
  const stable = total - highRisk;
  const avgBirthWeight = total ? Math.round(babies.reduce((sum, baby) => sum + (Number(baby.birthWeight) || 0), 0) / total) : 0;
  const avgGestation = total ? Math.round((babies.reduce((sum, baby) => sum + (Number(baby.gestationalAgeAtBirth) || 0), 0) / total) * 10) / 10 : 0;
  const urban = babies.filter((baby) => baby.region === 'Urban').length;
  const rural = babies.filter((baby) => baby.region === 'Rural').length;

  downloadCsv(
    `tinysteps-dashboard-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    [
      ['Metric', 'Value'],
      ['Total Babies', total],
      ['High Risk Babies', highRisk],
      ['Stable Babies', stable],
      ['Average Birth Weight (g)', avgBirthWeight],
      ['Average Gestational Age (weeks)', avgGestation],
      ['Urban Babies', urban],
      ['Rural Babies', rural],
    ]
  );
}
