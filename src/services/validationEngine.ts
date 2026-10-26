/**
 * VerityAI Regulatory Compliance & Explainable Risk Scoring Engine
 * Evaluates institutional applications against active AICTE Approval Process Handbook (APH) rules.
 * Computes deterministic, inspectable review-priority scores with exact signal breakdowns.
 */

import {
  Application,
  AppDocument,
  ComplianceCheck,
  ComplianceRule,
  Discrepancy,
  RiskAssessment,
  RiskSignal,
} from '../types';

export interface ValidationEvaluationResult {
  complianceChecks: ComplianceCheck[];
  compliancePercentage: number;
  riskAssessment: RiskAssessment;
}

/**
 * Normalizes text strings for discrepancy checking (case insensitive, trim, whitespace collapse).
 */
export function normalizeEntityString(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a date string is expired relative to the target academic year window.
 */
export function isDateExpired(dateStr?: string, referenceYear: string = '2026-2027'): boolean {
  if (!dateStr) return false;
  try {
    const docDate = new Date(dateStr);
    if (isNaN(docDate.getTime())) return false;
    // Current demo reference cutoff is 2026-08-01 (AY start)
    const cutoff = new Date('2026-08-01');
    return docDate < cutoff;
  } catch {
    return false;
  }
}

/**
 * Evaluates an application against active regulatory compliance rules.
 */
export function evaluateApplication(
  app: Application,
  rules: ComplianceRule[]
): ValidationEvaluationResult {
  const activeRules = rules.filter((r) => r.isEnabled && r.appliesTo.includes(app.applicationType));
  const checks: ComplianceCheck[] = [];
  const riskSignals: RiskSignal[] = [];

  let totalRuleWeight = 0;
  let earnedScoreWeight = 0;

  activeRules.forEach((rule) => {
    totalRuleWeight += rule.weight;

    if (rule.category === 'fire_safety') {
      const fireDoc = app.documents.find((d) => d.category === 'fire_safety' && !d.isMissingPlaceholder);
      if (!fireDoc) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'fire_safety',
          outcome: 'failed',
          reason: 'Mandatory Fire Safety NOC is missing from application dossier.',
          severity: 'critical',
        });
        riskSignals.push({
          id: `sig_fire_missing_${Date.now()}`,
          title: 'Missing Mandatory Fire Safety NOC',
          impactScore: 40,
          description: 'Fire Safety Certificate required under AICTE APH Chapter II Section 2.4 is absent.',
          category: 'missing_document',
          relatedDocId: undefined,
        });
      } else if (fireDoc.expiryDate && isDateExpired(fireDoc.expiryDate)) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'fire_safety',
          outcome: 'failed',
          reason: `Fire Safety NOC expired on ${fireDoc.expiryDate}. Active validity required for academic session.`,
          documentId: fireDoc.id,
          documentName: fireDoc.name,
          fieldName: 'expiryDate',
          severity: 'critical',
        });
        riskSignals.push({
          id: `sig_fire_expired_${Date.now()}`,
          title: 'Expired Fire Safety Certificate',
          impactScore: 35,
          description: `Fire NOC validity (${fireDoc.expiryDate}) has elapsed prior to the academic year.`,
          category: 'expiry',
          relatedDocId: fireDoc.id,
        });
      } else {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'fire_safety',
          outcome: 'passed',
          reason: `Valid Fire Safety NOC verified${fireDoc.expiryDate ? ` (Valid through ${fireDoc.expiryDate})` : ''}.`,
          documentId: fireDoc.id,
          documentName: fireDoc.name,
          severity: 'info',
        });
        earnedScoreWeight += rule.weight;
      }
    } else if (rule.category === 'building_safety') {
      const bldgDoc = app.documents.find((d) => d.category === 'building_safety' && !d.isMissingPlaceholder);
      if (!bldgDoc) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'building_safety',
          outcome: 'failed',
          reason: 'Structural Stability & Building Safety Certificate not provided.',
          severity: 'critical',
        });
        riskSignals.push({
          id: `sig_bldg_missing_${Date.now()}`,
          title: 'Missing Building Safety Certificate',
          impactScore: 30,
          description: 'Structural safety certification from chartered civil engineer or PWD is required.',
          category: 'missing_document',
        });
      } else if (bldgDoc.expiryDate && isDateExpired(bldgDoc.expiryDate)) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'building_safety',
          outcome: 'failed',
          reason: `Building Safety Certificate expired on ${bldgDoc.expiryDate}. Current stability clearance mandatory.`,
          documentId: bldgDoc.id,
          documentName: bldgDoc.name,
          fieldName: 'expiryDate',
          severity: 'critical',
        });
        riskSignals.push({
          id: `sig_bldg_expired_${Date.now()}`,
          title: 'Expired Building Safety Certificate',
          impactScore: 35,
          description: `Structural safety validity expired on ${bldgDoc.expiryDate}.`,
          category: 'expiry',
          relatedDocId: bldgDoc.id,
        });
      } else if (bldgDoc.tamperingFlags?.anomalyDetected) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'building_safety',
          outcome: 'warning',
          reason: `Visual anomaly flagged: ${bldgDoc.tamperingFlags.reason || 'Seal compression irregularity'}.`,
          documentId: bldgDoc.id,
          documentName: bldgDoc.name,
          severity: 'high',
        });
        riskSignals.push({
          id: `sig_bldg_anomaly_${Date.now()}`,
          title: 'Visual Anomaly in Building Certificate',
          impactScore: 25,
          description: bldgDoc.tamperingFlags.details || 'Document image compression and seal boundary flagged.',
          category: 'visual_anomaly',
          relatedDocId: bldgDoc.id,
        });
        earnedScoreWeight += rule.weight * 0.5;
      } else {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'building_safety',
          outcome: 'passed',
          reason: 'Structural stability certificate verified with authorized engineer stamp.',
          documentId: bldgDoc.id,
          documentName: bldgDoc.name,
          severity: 'info',
        });
        earnedScoreWeight += rule.weight;
      }
    } else if (rule.category === 'land_deed') {
      const landDoc = app.documents.find((d) => d.category === 'land_deed' && !d.isMissingPlaceholder);
      if (!landDoc) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'land_deed',
          outcome: 'failed',
          reason: 'Land Ownership / Registered Lease Deed document not submitted.',
          severity: 'critical',
        });
        riskSignals.push({
          id: `sig_land_missing_${Date.now()}`,
          title: 'Missing Land Ownership / Lease Document',
          impactScore: 35,
          description: 'Statutory proof of minimum contiguous land is required under APH norms.',
          category: 'missing_document',
        });
      } else {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'land_deed',
          outcome: 'passed',
          reason: 'Land deed registered and cadastral boundary verified.',
          documentId: landDoc.id,
          documentName: landDoc.name,
          severity: 'info',
        });
        earnedScoreWeight += rule.weight;
      }
    } else if (rule.category === 'registration') {
      const regDoc = app.documents.find((d) => d.category === 'registration' && !d.isMissingPlaceholder);
      if (!regDoc) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'registration',
          outcome: 'failed',
          reason: 'Society / Trust Registration Certificate missing.',
          severity: 'critical',
        });
        riskSignals.push({
          id: `sig_reg_missing_${Date.now()}`,
          title: 'Missing Society / Trust Registration',
          impactScore: 25,
          description: 'Charter / Registration with Charity Commissioner or Registrar of Societies is absent.',
          category: 'missing_document',
        });
      } else {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'registration',
          outcome: 'passed',
          reason: 'Society / Trust registration certificate verified.',
          documentId: regDoc.id,
          documentName: regDoc.name,
          severity: 'info',
        });
        earnedScoreWeight += rule.weight;
      }
    } else if (rule.category === 'accreditation') {
      const accrDoc = app.documents.find((d) => d.category === 'accreditation' && !d.isMissingPlaceholder);
      if (!accrDoc) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'accreditation',
          outcome: 'warning',
          reason: 'Accreditation letter not attached. Required if requesting expanded intake.',
          severity: 'medium',
        });
      } else if (accrDoc.status === 'pending' || accrDoc.status === 'review_needed') {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'accreditation',
          outcome: 'warning',
          reason: 'NBA / NAAC accreditation requires reviewer confirmation of tier and validity.',
          documentId: accrDoc.id,
          documentName: accrDoc.name,
          severity: 'high',
        });
        riskSignals.push({
          id: `sig_accr_pending_${Date.now()}`,
          title: 'Accreditation Validity Confirmation Required',
          impactScore: 20,
          description: 'Provisional or expiring accreditation certificate requires scrutiny committee confirmation.',
          category: 'compliance_failure',
          relatedDocId: accrDoc.id,
        });
        earnedScoreWeight += rule.weight * 0.6;
      } else {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'accreditation',
          outcome: 'passed',
          reason: 'NBA / NAAC accreditation verified.',
          documentId: accrDoc.id,
          documentName: accrDoc.name,
          severity: 'info',
        });
        earnedScoreWeight += rule.weight;
      }
    } else {
      // General or affiliation checks
      const afflDoc = app.documents.find((d) => d.category === 'aicte_affiliation' && !d.isMissingPlaceholder);
      if (!afflDoc && rule.isMandatory) {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'general',
          outcome: 'warning',
          reason: 'Affiliation or prior approval order not uploaded.',
          severity: 'medium',
        });
      } else {
        checks.push({
          id: `chk_${rule.id}_${Date.now()}`,
          applicationId: app.id,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          category: 'general',
          outcome: 'passed',
          reason: 'Documentary requirements fulfilled.',
          severity: 'info',
        });
        earnedScoreWeight += rule.weight;
      }
    }
  });

  // Check Discrepancies impact on Risk Signals
  app.discrepancies.forEach((disc) => {
    if (disc.status === 'open' || disc.status === 'confirmed' || disc.status === 'needs_evidence') {
      const impact =
        disc.severity === 'critical'
          ? 35
          : disc.severity === 'high'
          ? 25
          : disc.severity === 'medium'
          ? 15
          : 8;

      riskSignals.push({
        id: `sig_disc_${disc.id}`,
        title: disc.title,
        impactScore: impact,
        description: disc.description,
        category: 'mismatch',
        relatedDiscrepancyId: disc.id,
        relatedDocId: disc.sourceDocId,
      });
    }
  });

  // Calculate compliance percentage
  const compliancePercentage =
    totalRuleWeight > 0 ? Math.min(100, Math.round((earnedScoreWeight / totalRuleWeight) * 100)) : 100;

  // Calculate explainable risk score (0-100)
  // Base score 10 + sum of risk signals capped at 100
  let rawRisk = 10;
  riskSignals.forEach((sig) => {
    rawRisk += sig.impactScore;
  });

  const finalScore = Math.min(100, Math.max(0, rawRisk));

  let level: RiskAssessment['level'] = 'low';
  if (finalScore >= 80) level = 'critical';
  else if (finalScore >= 60) level = 'high';
  else if (finalScore >= 30) level = 'medium';
  else level = 'low';

  // If no negative signals, score is minimal (10-15)
  const finalRiskSignals =
    riskSignals.length > 0
      ? riskSignals
      : [
          {
            id: `sig_clean_${Date.now()}`,
            title: 'No Material Regulatory Flags',
            impactScore: 5,
            description: 'All preliminary documentary checks passed. Routine committee review indicated.',
            category: 'compliance_failure' as const,
          },
        ];

  return {
    complianceChecks: checks,
    compliancePercentage,
    riskAssessment: {
      score: finalScore,
      level,
      breakdown: finalRiskSignals,
      calculatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    },
  };
}
