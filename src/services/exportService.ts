/**
 * VerityAI CSV Export Service
 * Exports applications and immutable audit trail records for compliance reporting.
 */

import { Application, AuditEvent } from '../types';

function triggerCsvDownload(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportApplicationsToCSV(applications: Application[]): void {
  const headers = [
    'Application ID',
    'Institution Name',
    'AICTE Permanent ID',
    'Application Type',
    'Academic Year',
    'State',
    'Region',
    'Status',
    'Review Priority Score (0-100)',
    'Priority Level',
    'Documents Uploaded',
    'Discrepancies Count',
    'Assigned Reviewer',
    'Submission Date',
    'Last Updated',
  ];

  const rows = applications.map((app) => [
    `"${app.id}"`,
    `"${app.institutionName.replace(/"/g, '""')}"`,
    `"${app.institutionId}"`,
    `"${app.applicationType}"`,
    `"${app.academicYear}"`,
    `"${app.state}"`,
    `"${app.region}"`,
    `"${app.status}"`,
    app.riskAssessment.score,
    `"${app.riskAssessment.level.toUpperCase()}"`,
    app.documents.filter((d) => !d.isMissingPlaceholder).length,
    app.discrepancies.filter((d) => d.status !== 'resolved' && d.status !== 'false_positive').length,
    `"${app.assignedReviewerName}"`,
    `"${app.submissionDate}"`,
    `"${app.lastUpdated}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(csv, `VerityAI_Applications_Report_${timestamp}.csv`);
}

export function exportAuditEventsToCSV(events: AuditEvent[]): void {
  const headers = [
    'Event ID',
    'Timestamp (IST)',
    'User Name',
    'User Role',
    'Action Type',
    'Application ID',
    'Record Identifier',
    'Description',
    'Previous State',
    'New State',
  ];

  const rows = events.map((ev) => [
    `"${ev.id}"`,
    `"${ev.timestamp}"`,
    `"${ev.userName}"`,
    `"${ev.userRole}"`,
    `"${ev.action}"`,
    `"${ev.applicationId}"`,
    `"${(ev.recordIdentifier || '').replace(/"/g, '""')}"`,
    `"${ev.description.replace(/"/g, '""')}"`,
    `"${(ev.oldValue || '').replace(/"/g, '""')}"`,
    `"${(ev.newValue || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(csv, `VerityAI_Audit_Trail_${timestamp}.csv`);
}
