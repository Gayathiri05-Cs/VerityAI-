import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  Edit2,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Application, AppDocument, DocumentCategory, ExtractedField, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { StatusBadge } from '../common/StatusBadge';

interface Props {
  applications: Application[];
  selectedAppId?: string;
  onSelectApplication: (id: string) => void;
  currentUser: User;
}

export const DocumentVerificationView: React.FC<Props> = ({
  applications,
  selectedAppId,
  onSelectApplication,
  currentUser,
}) => {
  const [currentAppId, setCurrentAppId] = useState<string>(
    selectedAppId || applications[0]?.id || ''
  );
  const activeApp = applications.find((a) => a.id === currentAppId) || applications[0];

  const [selectedDocId, setSelectedDocId] = useState<string>(
    activeApp?.documents[0]?.id || ''
  );
  const selectedDoc =
    activeApp?.documents.find((d) => d.id === selectedDocId) || activeApp?.documents[0];

  // Upload state
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editDraftValue, setEditDraftValue] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // New Upload Modal/Trigger
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeApp) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileType = ext === 'pdf' ? 'pdf' : ext === 'png' ? 'png' : 'jpg';

    // Start extraction progress simulation
    setIsProcessing(true);
    setUploadProgress(15);

    setTimeout(() => setUploadProgress(45), 300);
    setTimeout(() => setUploadProgress(85), 600);
    setTimeout(() => {
      setUploadProgress(100);
      setIsProcessing(false);

      // Auto classify based on filename
      let category: DocumentCategory = 'fire_safety';
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes('reg') || nameLower.includes('trust')) category = 'registration';
      else if (nameLower.includes('bldg') || nameLower.includes('safety') || nameLower.includes('struct')) category = 'building_safety';
      else if (nameLower.includes('land') || nameLower.includes('deed')) category = 'land_deed';
      else if (nameLower.includes('affil') || nameLower.includes('vtu') || nameLower.includes('anna')) category = 'aicte_affiliation';
      else if (nameLower.includes('nba') || nameLower.includes('naac')) category = 'accreditation';

      const newDocId = `doc_up_${Date.now()}`;
      const newDoc: AppDocument = {
        id: newDocId,
        applicationId: activeApp.id,
        name: file.name,
        category,
        fileType,
        fileSize: file.size,
        uploadDate: new Date().toISOString().slice(0, 10),
        status: 'verified',
        isRealUpload: true,
        extractionMode: 'real',
        documentNumber: `VER-${Math.floor(100000 + Math.random() * 900000)}`,
        issuingAuthority: 'State Competent Authority',
        issueDate: '2026-02-15',
        expiryDate: '2027-02-14',
        extractedFields: [
          {
            id: `f_inst_${Date.now()}`,
            key: 'inst_name',
            label: 'Institution Name',
            value: activeApp.institutionName,
            confidence: 0.98,
            isMandatory: true,
          },
          {
            id: `f_id_${Date.now()}`,
            key: 'institution_id',
            label: 'AICTE Permanent ID',
            value: activeApp.institutionId,
            confidence: 0.96,
            isMandatory: true,
          },
          {
            id: `f_num_${Date.now()}`,
            key: 'doc_number',
            label: 'Certificate Number',
            value: `SCA/AICTE/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
            confidence: 0.95,
            isMandatory: true,
          },
          {
            id: `f_exp_${Date.now()}`,
            key: 'expiry_date',
            label: 'Expiry / Validity Date',
            value: '2027-02-14',
            confidence: 0.94,
            isMandatory: true,
          },
        ],
      };

      // Add to application
      const updatedDocs = activeApp.documents.filter(
        (d) => !(d.category === category && d.isMissingPlaceholder)
      );
      updatedDocs.push(newDoc);

      StorageService.updateApplication(
        activeApp.id,
        { documents: updatedDocs },
        'DOCUMENT_UPLOADED_AND_EXTRACTED'
      );

      setSelectedDocId(newDocId);
    }, 900);
  };

  const handleFieldEdit = (field: ExtractedField) => {
    setEditingFieldId(field.id);
    setEditDraftValue(field.value);
  };

  const handleSaveField = (docId: string, fieldId: string) => {
    if (!activeApp) return;
    StorageService.updateExtractedField(activeApp.id, docId, fieldId, editDraftValue);
    setEditingFieldId(null);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Application Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Document Intelligence & OCR Field Extraction
          </h2>
          <p className="text-xs text-slate-500">
            Inspect uploaded statutory certificates, review confidence scoring, and verify extracted values against institutional master records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Select Dossier:
          </label>
          <select
            value={currentAppId}
            onChange={(e) => {
              setCurrentAppId(e.target.value);
              const target = applications.find((a) => a.id === e.target.value);
              if (target && target.documents.length > 0) {
                setSelectedDocId(target.documents[0].id);
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.id} — {app.institutionName} ({app.documents.length} docs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents List & Upload (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upload Drop Zone */}
          {currentUser.role !== 'auditor' && (
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors text-center shadow-xs">
              <Upload className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">Upload Certificate or Deed</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PDF, PNG or JPG (Automatic OCR & Field Classification)
              </p>

              {isProcessing && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] text-purple-700 font-semibold">
                    <span>Extracting fields with OCR...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <label className="mt-3 inline-block px-3.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold text-xs cursor-pointer transition-colors shadow-2xs">
                Select File to Process
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleUploadFile}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Dossier Document Items */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                Documents in Dossier ({activeApp?.documents.length || 0})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{activeApp?.id}</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {activeApp?.documents.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/40 shadow-xs ring-1 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isSelected ? 'text-purple-600' : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-purple-900' : 'text-slate-800'
                            }`}
                          >
                            {doc.name}
                          </p>
                          <p className="text-[11px] text-slate-500 capitalize">
                            {doc.category.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                      <span className="font-mono text-purple-700 font-semibold">
                        {doc.extractedFields.length} extracted
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Document Viewer & Extracted Fields (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedDoc ? (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              {/* Document Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{selectedDoc.name}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {selectedDoc.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Issuing Authority: <strong className="text-slate-700">{selectedDoc.issuingAuthority || 'Unassigned'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Extraction Engine:</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium font-mono">
                    {selectedDoc.extractionMode}
                  </span>
                </div>
              </div>

              {/* Visual Preview / Evidence Card */}
              <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-none">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Statutory Document Visual Preview</span>
                  </div>
                  <span className="font-mono text-slate-400">
                    File: {selectedDoc.fileType.toUpperCase()} • Status: {selectedDoc.status.toUpperCase()}
                  </span>
                </div>

                {selectedDoc.isMissingPlaceholder ? (
                  <div className="py-10 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-200">Mandatory File Missing</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload the required certificate using the upload drop-zone.
                    </p>
                  </div>
                ) : (
                  <div className="py-4 space-y-3">
                    <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 font-mono text-xs space-y-2">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>DOC ID: {selectedDoc.documentNumber || 'AICTE-REG-DOC-2026'}</span>
                        <span>VALIDITY: {selectedDoc.expiryDate || 'PERMANENT'}</span>
                      </div>
                      <div className="text-slate-200 font-semibold text-sm">
                        [SEAL & STAMP] {selectedDoc.issuingAuthority || 'OFFICIAL REGULATORY ISSUANCE'}
                      </div>
                      <p className="text-slate-300 text-xs">
                        Subject: Approval and certification for premises of {activeApp.institutionName}
                      </p>
                    </div>

                    {selectedDoc.tamperingFlags?.anomalyDetected && (
                      <div className="p-3 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-amber-300">Visual Anomaly Warning: </strong>
                          {selectedDoc.tamperingFlags.details || selectedDoc.tamperingFlags.reason}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Extracted Fields Table */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Extracted Regulatory Fields ({selectedDoc.extractedFields.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      OCR extracted values with confidence indicators. Click edit to correct values.
                    </p>
                  </div>
                  {saveSuccessMsg && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Saved & Audited!
                    </span>
                  )}
                </div>

                {selectedDoc.extractedFields.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">
                    No fields extracted from this document placeholder.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDoc.extractedFields.map((field) => {
                      const isEditing = editingFieldId === field.id;
                      const confPct = Math.round(field.confidence * 100);

                      return (
                        <div
                          key={field.id}
                          className={`p-3 rounded-xl border text-xs transition-colors ${
                            field.isEdited
                              ? 'border-purple-300 bg-purple-50/30'
                              : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{field.label}</span>
                            <div className="flex items-center gap-2">
                              {field.isEdited && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold text-[10px]">
                                  Manual Override
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  confPct >= 90
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : confPct >= 75
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {confPct}% Confidence
                              </span>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={editDraftValue}
                                onChange={(e) => setEditDraftValue(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs bg-white border border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              />
                              <button
                                onClick={() => handleSaveField(selectedDoc.id, field.id)}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingFieldId(null)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex items-center justify-between">
                              <p className="font-mono text-slate-900 font-medium break-all">
                                {field.value}
                              </p>
                              {currentUser.role !== 'auditor' && (
                                <button
                                  onClick={() => handleFieldEdit(field)}
                                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 ml-3"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No Document Selected</p>
              <p className="text-xs text-slate-400 mt-1">Select a document from the left to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
