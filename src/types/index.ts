/**
 * VerityAI Type Definitions
 * AICTE Application Validation & Document Verification Platform
 */

export type UserRole = 'admin' | 'reviewer' | 'auditor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  designation: string;
  department: string;
}

export type DocumentCategory =
  | 'registration'
  | 'land_deed'
  | 'building_safety'
  | 'fire_safety'
  | 'aicte_affiliation'
  | 'accreditation'
  | 'faculty_list'
  | 'financial_audit'
  | 'other';

export type DocumentStatus =
  | 'verified'
  | 'discrepancy'
  | 'pending'
  | 'expired'
  | 'missing'
  | 'extracting'
  | 'review_needed';

export type ExtractionMode =
  | 'real'
  | 'simulated_ocr'
  | 'pending'
  | 'failed';

export interface ExtractedField {
  id: string;
  key: string;
  label: string;
  value: string;
  confidence: number; // 0 to 1
  isEdited?: boolean;
  originalValue?: string;
  isMandatory?: boolean;
  pageNumber?: number;
}

export interface AppDocument {
  id: string;
  applicationId: string;
  name: string;
  category: DocumentCategory;
  fileType: 'pdf' | 'png' | 'jpg' | 'jpeg';
  fileSize: number; // bytes
  uploadDate: string;
  status: DocumentStatus;
  previewUrl?: string;
  extractedFields: ExtractedField[];
  isRealUpload: boolean;
  extractionMode: ExtractionMode;
  expiryDate?: string;
  issueDate?: string;
  issuingAuthority?: string;
  documentNumber?: string;
  isMissingPlaceholder?: boolean;
  tamperingFlags?: {
    anomalyDetected: boolean;
    reason?: string;
    details?: string;
  };
}

export type DiscrepancySeverity = 'critical' | 'high' | 'medium' | 'low';

export type DiscrepancyStatus =
  | 'open'
  | 'confirmed'
  | 'needs_evidence'
  | 'false_positive'
  | 'resolved';

export interface Discrepancy {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  severity: DiscrepancySeverity;
  status: DiscrepancyStatus;
  fieldName: string;
  sourceDocId: string;
  sourceDocName: string;
  sourceValue: string;
  targetDocId?: string;
  targetDocName?: string;
  targetValue?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type ComplianceCheckOutcome =
  | 'passed'
  | 'warning'
  | 'failed'
  | 'not_evaluated';

export interface ComplianceCheck {
  id: string;
  applicationId: string;
  ruleCode: string;
  ruleTitle: string;
  category: string;
  outcome: ComplianceCheckOutcome;
  reason: string;
  documentId?: string;
  documentName?: string;
  fieldName?: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
}

export type ReviewPriority = 'low' | 'medium' | 'high' | 'critical';

export interface RiskSignal {
  id: string;
  title: string;
  impactScore: number;
  description: string;
  category:
    | 'missing_document'
    | 'expiry'
    | 'mismatch'
    | 'compliance_failure'
    | 'visual_anomaly';
  relatedDocId?: string;
  relatedDiscrepancyId?: string;
}

export interface RiskAssessment {
  score: number; // 0 to 100
  level: ReviewPriority;
  breakdown: RiskSignal[];
  calculatedAt: string;
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'action_required'
  | 'preliminary_passed'
  | 'discrepancy_flagged';

export type ApplicationType =
  | 'New Institution Approval'
  | 'Extension of Approval (EoA)'
  | 'Increase in Intake'
  | 'New Program / Department'
  | 'Closure of Course';

export interface ReviewComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
  isInternal: boolean;
}

export interface Application {
  id: string;
  institutionName: string;
  institutionId: string;
  applicationType: ApplicationType;
  academicYear: string;
  submissionDate: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  state: string;
  district: string;
  region: 'Northern' | 'North-Western' | 'Eastern' | 'Western' | 'Central' | 'Southern' | 'South-Western';
  documents: AppDocument[];
  complianceChecks: ComplianceCheck[];
  discrepancies: Discrepancy[];
  riskAssessment: RiskAssessment;
  status: ApplicationStatus;
  assignedReviewerId: string;
  assignedReviewerName: string;
  lastUpdated: string;
  comments: ReviewComment[];
  appliedRulesCount?: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  applicationId: string;
  recordIdentifier?: string;
  description: string;
  oldValue?: string;
  newValue?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type:
    | 'missing_doc'
    | 'expiry'
    | 'mismatch'
    | 'high_risk'
    | 'status_change'
    | 'new_submission'
    | 'system';
  applicationId?: string;
}

export interface ComplianceRule {
  id: string;
  code: string;
  title: string;
  description: string;
  category: DocumentCategory | 'general';
  isMandatory: boolean;
  weight: number;
  appliesTo: ApplicationType[];
  isEnabled: boolean;
}

export interface SystemIntegrationStatus {
  id: string;
  name: string;
  service: string;
  status: 'connected' | 'not_configured' | 'demo_mode';
  lastPing: string;
  latency?: string;
  note: string;
}
