/**
 * VerityAI Cross-Document Discrepancy & Visual Anomaly Detection
 * Compares institutional entities across forms, stamps, and certificates.
 */

import { Application, AppDocument, Discrepancy } from '../types';
import { normalizeEntityString } from './validationEngine';

export interface CrossDocumentAnalysisResult {
  discrepancies: Discrepancy[];
  summary: string;
}

/**
 * Runs cross-document verification across an application's uploaded documents.
 */
export function analyzeCrossDocumentConsistency(app: Application): CrossDocumentAnalysisResult {
  const newDiscrepancies: Discrepancy[] = [];
  const normalizedAppName = normalizeEntityString(app.institutionName);
  const normalizedAppId = normalizeEntityString(app.institutionId);

  // 1. Check each document's extracted institution name against application name
  app.documents.forEach((doc) => {
    if (doc.isMissingPlaceholder) return;

    doc.extractedFields.forEach((field) => {
      // Check Name variations
      if (
        ['inst_name', 'college_name', 'premises_name', 'grantee_name'].includes(field.key) &&
        field.value
      ) {
        const normalizedFieldVal = normalizeEntityString(field.value);

        // If names are distinct and neither is an exact substring of the other
        const isClose =
          normalizedAppName === normalizedFieldVal ||
          (normalizedAppName.includes(normalizedFieldVal) && normalizedFieldVal.length > 8) ||
          (normalizedFieldVal.includes(normalizedAppName) && normalizedAppName.length > 8);

        if (!isClose && normalizedFieldVal.length > 3) {
          // Check if already logged
          const existing = app.discrepancies.find(
            (d) => d.sourceDocId === doc.id && d.fieldName === field.key
          );
          if (!existing) {
            newDiscrepancies.push({
              id: `disc_auto_${doc.id}_${field.key}_${Date.now()}`,
              applicationId: app.id,
              title: `Name Mismatch in ${doc.name}`,
              description: `Extracted name "${field.value}" in ${doc.name} deviates from registered application title "${app.institutionName}".`,
              severity: 'critical',
              status: 'open',
              fieldName: field.key,
              sourceDocId: doc.id,
              sourceDocName: doc.name,
              sourceValue: field.value,
              targetDocName: 'Application Master Record',
              targetValue: app.institutionName,
              createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            });
          }
        }
      }

      // Check Permanent ID variations
      if (['permanent_id', 'inst_id', 'aicte_id'].includes(field.key) && field.value) {
        const cleanFieldId = normalizeEntityString(field.value);
        if (!normalizedAppId.includes(cleanFieldId) && !cleanFieldId.includes(normalizedAppId)) {
          const existing = app.discrepancies.find(
            (d) => d.sourceDocId === doc.id && d.fieldName === field.key
          );
          if (!existing) {
            newDiscrepancies.push({
              id: `disc_auto_id_${doc.id}_${Date.now()}`,
              applicationId: app.id,
              title: `AICTE Identifier Mismatch in ${doc.name}`,
              description: `Extracted ID "${field.value}" does not align with application permanent ID "${app.institutionId}".`,
              severity: 'critical',
              status: 'open',
              fieldName: field.key,
              sourceDocId: doc.id,
              sourceDocName: doc.name,
              sourceValue: field.value,
              targetDocName: 'Application Form Header',
              targetValue: app.institutionId,
              createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            });
          }
        }
      }
    });

    // 2. Check visual anomaly flags
    if (doc.tamperingFlags?.anomalyDetected) {
      const existing = app.discrepancies.find(
        (d) => d.sourceDocId === doc.id && d.fieldName === 'tampering'
      );
      if (!existing) {
        newDiscrepancies.push({
          id: `disc_vis_${doc.id}_${Date.now()}`,
          applicationId: app.id,
          title: `Visual Anomaly Flagged: ${doc.name}`,
          description:
            doc.tamperingFlags.details ||
            'Potential compression inconsistency or seal boundary deviation detected. Requires manual physical inspection.',
          severity: 'high',
          status: 'needs_evidence',
          fieldName: 'tampering',
          sourceDocId: doc.id,
          sourceDocName: doc.name,
          sourceValue: doc.tamperingFlags.reason || 'Compression artifact',
          targetValue: 'Authentic Physical Original',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        });
      }
    }
  });

  return {
    discrepancies: [...app.discrepancies, ...newDiscrepancies],
    summary:
      newDiscrepancies.length > 0
        ? `Found ${newDiscrepancies.length} new potential discrepancies during cross-document analysis.`
        : 'Cross-document entity names and identifiers conform to application baseline.',
  };
}
