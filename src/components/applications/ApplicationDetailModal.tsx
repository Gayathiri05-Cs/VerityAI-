import React, { useState } from 'react';
import {
  X,
  FileText,
  FileCheck2,
  AlertTriangle,
  History,
  ShieldAlert,
  SlidersHorizontal,
  Clock,
  User,
  Building2,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileUp,
  MessageSquare,
  Sparkles,
  Edit2,
  Save,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  Application,
  ApplicationStatus,
  AppDocument,
  Discrepancy,
  User as UserType,
  ComplianceRule,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { StorageService } from '../../services/storageService';
import { evaluateApplication } from '../../services/validationEngine';

interface Props {
  application: Application;
  onClose: () => void;
  currentUser: UserType;
  rules: ComplianceRule[];
  onNavigateToDocumentUpload?: (appId: string) => void;
}

export const ApplicationDetailModal: React.FC<Props> = ({
  application,
  onClose,
  currentUser,
  rules,
  onNavigateToDocumentUpload,
}) => {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'documents' | 'extracted' | 'compliance' | 'discrepancies' | 'history'
  >('summary');

  // Local state for edits
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldValueDraft, setFieldValueDraft] = useState('');
  const [newComment, setNewComment] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState<string | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<AppDocument | null>(
    application.documents[0] || null
  );

  // Status Action Handler
  const handleStatusChange = (newStatus: ApplicationStatus, label: string) => {
    StorageService.updateApplication(
      application.id,
      { status: newStatus },
      `STATUS_TRANSITION_TO_${newStatus.toUpperCase()}`
    );
  };

  // Re-run compliance
  const handleReRunCompliance = () => {
    const res = evaluateApplication(application, rules);
    StorageService.updateApplication(
      application.id,
      {
        complianceChecks: res.complianceChecks,
        riskAssessment: res.riskAssessment,
      },
      'COMPLIANCE_CHECKS_RE_EVALUATED'
    );
  };

  // Save Extracted Field
  const handleSaveField = (docId: string, fieldId: string) => {
    StorageService.updateExtractedField(application.id, docId, fieldId, fieldValueDraft);
    setEditingFieldId(null);
  };

  // Resolve Discrepancy
  const handleResolveDiscrepancy = (status: Discrepancy['status']) => {
    if (!selectedDiscrepancyId) return;
    if (!resolutionNote.trim()) {
      alert('Please provide a mandatory reviewer note explaining this discrepancy decision.');
      return;
    }
    StorageService.resolveDiscrepancy(
      application.id,
      selectedDiscrepancyId,
      status,
      resolutionNote,
      currentUser.name
    );
    setSelectedDiscrepancyId(null);
    setResolutionNote('');
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    StorageService.addReviewComment(application.id, newComment);
    setNewComment('');
  };

  // Audit events for this application
  const appAuditEvents = StorageService.getAuditEvents().filter(
    (ev) => ev.applicationId === application.id
  );

  const openDiscrepancies = application.discrepancies.filter(
    (d) => d.status === 'open' || d.status === 'confirmed' || d.status === 'needs_evidence'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:px-6 bg-gradient-to-r from-[#10152F] to-[#1E2548] text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 font-bold text-cyan-300">
                {application.id}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-200">{application.applicationType}</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-200">AY {application.academicYear}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 text-white">
              {application.institutionName}
            </h2>
            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1">
              <span>Permanent AICTE ID: <strong className="text-white font-mono">{application.institutionId}</strong></span>
              <span>•</span>
              <span>{application.district}, {application.state} ({application.region} Region)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RiskBadge
              score={application.riskAssessment.score}
              level={application.riskAssessment.level}
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Status Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Preliminary State:</span>
            <StatusBadge status={application.status} size="sm" />
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">Assigned Reviewer:</span>
            <span className="font-semibold text-slate-800">{application.assignedReviewerName}</span>
          </div>

          {currentUser.role !== 'auditor' && (
            <div className="flex items-center gap-2">
              {application.status !== 'under_review' && (
                <button
                  onClick={() => handleStatusChange('under_review', 'Under Review')}
                  className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold"
                >
                  Mark In Review
                </button>
              )}
              {application.status !== 'action_required' && (
                <button
                  onClick={() => handleStatusChange('action_required', 'Action Required')}
                  className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold"
                >
                  Request Additional Docs
                </button>
              )}
              {application.status !== 'preliminary_passed' && (
                <button
                  onClick={() => handleStatusChange('preliminary_passed', 'Preliminary Passed')}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Preliminary Checks Complete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto shrink-0 select-none">
          {[
            { id: 'summary', label: 'Summary & Risk', icon: FileText },
            {
              id: 'documents',
              label: 'Documents',
              icon: FileCheck2,
              badge: application.documents.length,
            },
            { id: 'extracted', label: 'Extracted Fields', icon: Edit2 },
            {
              id: 'compliance',
              label: 'Compliance Checks',
              icon: SlidersHorizontal,
              badge: application.complianceChecks.length,
            },
            {
              id: 'discrepancies',
              label: 'Discrepancies',
              icon: AlertTriangle,
              badge: openDiscrepancies.length > 0 ? openDiscrepancies.length : undefined,
              badgeColor: 'bg-rose-500 text-white',
            },
            { id: 'history', label: 'Review & Audit', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      tab.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Statutory Disclaimer Pill */}
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Scrutiny Assistance Notice: </span>
                  Preliminary validation does not constitute final statutory approval or accreditation. AICTE Approval Bureau and Expert Visit Committees make independent statutory determinations.
                </div>
              </div>

              {/* Institution Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Contact Official</span>
                  <p className="text-xs font-bold text-slate-900">{application.contactPerson}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{application.contactEmail}</span>
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{application.contactPhone}</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Jurisdiction</span>
                  <p className="text-xs font-bold text-slate-900">{application.region} Regional Office</p>
                  <p className="text-xs text-slate-600">{application.district}, {application.state}</p>
                  <p className="text-xs text-slate-600 pt-1">Submitted on: <span className="font-mono">{application.submissionDate}</span></p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Dossier Health</span>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {application.documents.filter((d) => !d.isMissingPlaceholder).length} / {application.documents.length}
                    </span>
                    <span className="text-xs text-slate-500">documents received</span>
                  </div>
                  <p className="text-xs text-rose-600 font-medium">
                    {openDiscrepancies.length} active discrepanc{openDiscrepancies.length === 1 ? 'y' : 'ies'} flagged
                  </p>
                </div>
              </div>

              {/* Explainable Review-Priority Scoring Panel */}
              <div className="p-5 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Explainable Review-Priority Score: {application.riskAssessment.score} / 100
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Deterministic inspection score derived from missing mandatory certificates, expired documents, and cross-document inconsistencies.
                    </p>
                  </div>
                  <RiskBadge
                    score={application.riskAssessment.score}
                    level={application.riskAssessment.level}
                  />
                </div>

                {/* Score Breakdown List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Contributing Risk Signals:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {application.riskAssessment.breakdown.map((sig) => (
                      <div
                        key={sig.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-start gap-2.5 hover:border-purple-300 transition-colors"
                      >
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            sig.impactScore >= 30
                              ? 'bg-rose-100 text-rose-700'
                              : sig.impactScore >= 15
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          +{sig.impactScore}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900">{sig.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{sig.description}</p>
                          {sig.relatedDiscrepancyId && (
                            <button
                              onClick={() => {
                                setSelectedDiscrepancyId(sig.relatedDiscrepancyId || null);
                                setActiveTab('discrepancies');
                              }}
                              className="text-[11px] font-semibold text-purple-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <span>Inspect Discrepancy Evidence</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submitted Documents</h3>
                  <p className="text-xs text-slate-500">
                    Uploaded regulatory certificates, deeds, and statutory compliance orders.
                  </p>
                </div>
                {onNavigateToDocumentUpload && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToDocumentUpload(application.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload & Extract</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocForPreview(doc)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedDocForPreview?.id === doc.id
                        ? 'border-purple-500 bg-purple-50/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{doc.name}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{doc.category.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">Authority:</span>{' '}
                        <span className="font-medium text-slate-800 truncate block">
                          {doc.issuingAuthority || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Validity Expiry:</span>{' '}
                        <span className={`font-mono font-medium ${doc.status === 'expired' ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                          {doc.expiryDate || 'Permanent / Undated'}
                        </span>
                      </div>
                    </div>

                    {doc.tamperingFlags?.anomalyDetected && (
                      <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                        <strong className="text-amber-800">Visual Flag:</strong> {doc.tamperingFlags.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Document Preview Box */}
              {selectedDocForPreview && (
                <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Document Inspector: {selectedDocForPreview.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Category: {selectedDocForPreview.category} • Size: {(selectedDocForPreview.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  {selectedDocForPreview.isMissingPlaceholder ? (
                    <div className="p-8 text-center bg-white rounded-lg border border-dashed border-slate-300">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">Mandatory File Not Uploaded</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the Document Intelligence workspace to upload the required certificate.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-inner min-h-[160px] flex flex-col justify-center">
                      <div className="flex items-center justify-between border-b pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-slate-900">
                            Digital Dossier Entry Authenticated
                          </span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          Mode: {selectedDocForPreview.extractionMode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>Document Number: <strong className="text-slate-900">{selectedDocForPreview.documentNumber || 'N/A'}</strong></p>
                        <p>Issuing Entity: <strong className="text-slate-900">{selectedDocForPreview.issuingAuthority || 'N/A'}</strong></p>
                        <p>Extracted Fields: <strong className="text-slate-900">{selectedDocForPreview.extractedFields.length} attributes</strong></p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXTRACTED FIELDS */}
          {activeTab === 'extracted' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Extracted Document Data</h3>
                  <p className="text-xs text-slate-500">
                    Review and verify OCR field values. Reviewer manual edits override confidence scores and are logged to the audit ledger.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {application.documents.map((doc) => {
                  if (doc.extractedFields.length === 0) return null;
                  return (
                    <div key={doc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{doc.name}</span>
                        <span className="text-[11px] text-slate-500 capitalize">{doc.category}</span>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {doc.extractedFields.map((field) => {
                          const isEditing = editingFieldId === field.id;
                          return (
                            <div
                              key={field.id}
                              className={`p-3 rounded-lg border text-xs ${
                                field.isEdited
                                  ? 'bg-purple-50/30 border-purple-200'
                                  : 'bg-slate-50/50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700">{field.label}</span>
                                <div className="flex items-center gap-1.5">
                                  {field.isEdited && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                                      Edited by Reviewer
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                      field.confidence >= 0.9
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : field.confidence >= 0.75
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {(field.confidence * 100).toFixed(0)}% conf
                                  </span>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={fieldValueDraft}
                                    onChange={(e) => setFieldValueDraft(e.target.value)}
                                    className="flex-1 px-2.5 py-1 text-xs border border-purple-400 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                  <button
                                    onClick={() => handleSaveField(doc.id, field.id)}
                                    className="p-1.5 rounded bg-purple-600 text-white hover:bg-purple-700"
                                    title="Save"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingFieldId(null)}
                                    className="p-1.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-1.5 flex items-center justify-between">
                                  <p className="font-mono text-slate-900 font-medium break-all">
                                    {field.value}
                                  </p>
                                  {currentUser.role !== 'auditor' && (
                                    <button
                                      onClick={() => {
                                        setEditingFieldId(field.id);
                                        setFieldValueDraft(field.value);
                                      }}
                                      className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                                      title="Edit field"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: COMPLIANCE CHECKS */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Regulatory Compliance Checks</h3>
                  <p className="text-xs text-slate-500">
                    Evaluated against AICTE Approval Process Handbook (APH 2026-27) demo rules.
                  </p>
                </div>
                <button
                  onClick={handleReRunCompliance}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-evaluate Rules</span>
                </button>
              </div>

              <div className="space-y-3">
                {application.complianceChecks.map((chk) => (
                  <div
                    key={chk.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {chk.ruleCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{chk.ruleTitle}</span>
                      </div>
                      <p className="text-xs text-slate-600">{chk.reason}</p>
                      {chk.documentName && (
                        <p className="text-[11px] text-slate-400">
                          Source Document: <span className="font-medium text-slate-700">{chk.documentName}</span>
                        </p>
                      )}
                    </div>
                    <StatusBadge status={chk.outcome} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DISCREPANCIES */}
          {activeTab === 'discrepancies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cross-Document Discrepancies</h3>
                  <p className="text-xs text-slate-500">
                    Conflicting institutional entities, registration identifiers, and tampering inspection flags.
                  </p>
                </div>
              </div>

              {application.discrepancies.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">No Discrepancies Identified</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Institution names, registration IDs, and validity windows are mutually consistent.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {application.discrepancies.map((disc) => (
                    <div
                      key={disc.id}
                      className={`p-4 rounded-xl border ${
                        disc.status === 'resolved' || disc.status === 'false_positive'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                disc.severity === 'critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {disc.severity}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900">{disc.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{disc.description}</p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                            disc.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : disc.status === 'false_positive'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {disc.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Side by side value comparison */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 text-xs">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Source Reference</span>
                          <p className="text-[11px] text-slate-600 font-medium truncate">{disc.sourceDocName}</p>
                          <p className="text-xs font-bold text-slate-900 font-mono mt-1">{disc.sourceValue}</p>
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Target / Baseline</span>
                          <p className="text-[11px] text-slate-600 font-medium truncate">{disc.targetDocName || 'Application Master'}</p>
                          <p className="text-xs font-bold text-purple-700 font-mono mt-1">{disc.targetValue || 'Active Mandate'}</p>
                        </div>
                      </div>

                      {/* Resolution controls */}
                      {currentUser.role !== 'auditor' && disc.status === 'open' && (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                          {selectedDiscrepancyId === disc.id ? (
                            <div className="w-full space-y-2">
                              <textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Enter mandatory explanation note for audit ledger..."
                                className="w-full p-2 text-xs border border-purple-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                                rows={2}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleResolveDiscrepancy('confirmed')}
                                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                                >
                                  Confirm Discrepancy
                                </button>
                                <button
                                  onClick={() => handleResolveDiscrepancy('needs_evidence')}
                                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                                >
                                  Request Evidence
                                </button>
                                <button
                                  onClick={() => handleResolveDiscrepancy('false_positive')}
                                  className="px-2.5 py-1 rounded bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold"
                                >
                                  Dismiss (False Positive)
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDiscrepancyId(null);
                                    setResolutionNote('');
                                  }}
                                  className="text-xs text-slate-500 hover:underline ml-2"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedDiscrepancyId(disc.id)}
                              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                            >
                              Resolve / Act on Discrepancy
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: REVIEW HISTORY & AUDIT */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Internal Notes / Comments */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Reviewer Notes & Internal Log</h3>

                {currentUser.role !== 'auditor' && (
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add official scrutiny finding or committee instruction..."
                      rows={2}
                      className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold"
                    >
                      Post Note
                    </button>
                  </form>
                )}

                <div className="space-y-2.5">
                  {application.comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No notes added yet.</p>
                  ) : (
                    application.comments.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{c.authorName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{c.createdAt}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Application Audit Events */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Dossier Audit Ledger</h3>
                <div className="space-y-2">
                  {appAuditEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No historical audit records for this application.</p>
                  ) : (
                    appAuditEvents.map((ev) => (
                      <div key={ev.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-start gap-2.5">
                        <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                          {ev.timestamp}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {ev.action} • <span className="font-normal text-slate-600">{ev.userName} ({ev.userRole})</span>
                          </p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{ev.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
