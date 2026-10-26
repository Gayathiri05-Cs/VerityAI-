import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import {
  Application,
  ApplicationType,
  DocumentCategory,
  AppDocument,
  User,
  ComplianceRule,
} from '../../types';
import { StorageService } from '../../services/storageService';
import { evaluateApplication } from '../../services/validationEngine';

interface Props {
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  rules: ComplianceRule[];
  onCreated: (newAppId: string) => void;
}

export const NewApplicationModal: React.FC<Props> = ({
  onClose,
  currentUser,
  allUsers,
  rules,
  onCreated,
}) => {
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [applicationType, setApplicationType] = useState<ApplicationType>('New Institution Approval');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [region, setRegion] = useState<Application['region']>('Western');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [assignedReviewerId, setAssignedReviewerId] = useState(
    allUsers.find((u) => u.role === 'reviewer')?.id || currentUser.id
  );

  // Uploaded files list
  const [uploadedDocs, setUploadedDocs] = useState<AppDocument[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle local file drop/upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: AppDocument[] = [];
    Array.from(files).forEach((file, index) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileType = ext === 'pdf' ? 'pdf' : ext === 'png' ? 'png' : 'jpg';

      let defaultCat: DocumentCategory = 'registration';
      const lower = file.name.toLowerCase();
      if (lower.includes('fire')) defaultCat = 'fire_safety';
      else if (lower.includes('build') || lower.includes('safety')) defaultCat = 'building_safety';
      else if (lower.includes('land') || lower.includes('deed')) defaultCat = 'land_deed';
      else if (lower.includes('affil') || lower.includes('univ')) defaultCat = 'aicte_affiliation';
      else if (lower.includes('nba') || lower.includes('naac')) defaultCat = 'accreditation';

      newDocs.push({
        id: `doc_up_${Date.now()}_${index}`,
        applicationId: '',
        name: file.name,
        category: defaultCat,
        fileType,
        fileSize: file.size,
        uploadDate: new Date().toISOString().slice(0, 10),
        status: 'verified',
        isRealUpload: true,
        extractionMode: 'real',
        extractedFields: [
          {
            id: `f_inst_${Date.now()}_${index}`,
            key: 'inst_name',
            label: 'Institution Name',
            value: institutionName || 'Submitted Institution',
            confidence: 0.96,
            isMandatory: true,
          },
          {
            id: `f_docno_${Date.now()}_${index}`,
            key: 'doc_number',
            label: 'Certificate / Deed No.',
            value: `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
            confidence: 0.94,
          },
        ],
      });
    });

    setUploadedDocs((prev) => [...prev, ...newDocs]);
  };

  const handleSubmit = (isDraft: boolean = false) => {
    if (!institutionName.trim()) {
      setErrorMsg('Please provide a valid institution name.');
      return;
    }
    if (!institutionId.trim()) {
      setErrorMsg('Please specify an AICTE Permanent ID (e.g., AICTE-1-XXXXXX).');
      return;
    }
    if (!contactEmail.trim() || !contactPerson.trim()) {
      setErrorMsg('Please provide contact officer name and email.');
      return;
    }

    const newId = `APP-2026-${String(Math.floor(100 + Math.random() * 900)).padStart(3, '0')}`;
    const reviewer = allUsers.find((u) => u.id === assignedReviewerId) || currentUser;

    const linkedDocs = uploadedDocs.map((d) => ({
      ...d,
      applicationId: newId,
    }));

    // If no fire safety doc uploaded, add placeholder
    if (!linkedDocs.some((d) => d.category === 'fire_safety')) {
      linkedDocs.push({
        id: `doc_miss_fire_${Date.now()}`,
        applicationId: newId,
        name: 'Fire_Safety_Certificate.pdf (Missing)',
        category: 'fire_safety',
        fileType: 'pdf',
        fileSize: 0,
        uploadDate: '',
        status: 'missing',
        isRealUpload: false,
        extractionMode: 'pending',
        isMissingPlaceholder: true,
        extractedFields: [],
      });
    }

    const newApp: Application = {
      id: newId,
      institutionName: institutionName.trim(),
      institutionId: institutionId.trim(),
      applicationType,
      academicYear,
      submissionDate: new Date().toISOString().slice(0, 10),
      contactPerson: contactPerson.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || '+91 98000 00000',
      state,
      district,
      region,
      documents: linkedDocs,
      complianceChecks: [],
      discrepancies: [],
      riskAssessment: {
        score: isDraft ? 20 : 45,
        level: isDraft ? 'low' : 'medium',
        breakdown: [],
        calculatedAt: new Date().toISOString().slice(0, 16),
      },
      status: isDraft ? 'submitted' : 'under_review',
      assignedReviewerId: reviewer.id,
      assignedReviewerName: reviewer.name,
      lastUpdated: new Date().toISOString().slice(0, 16),
      comments: [
        {
          id: `c_init_${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          text: `Application dossier created and assigned to ${reviewer.name}.`,
          createdAt: new Date().toISOString().slice(0, 16),
          isInternal: true,
        },
      ],
    };

    // Run preliminary validation
    const evalResult = evaluateApplication(newApp, rules);
    newApp.complianceChecks = evalResult.complianceChecks;
    newApp.riskAssessment = evalResult.riskAssessment;

    StorageService.saveApplication(newApp);

    StorageService.logAuditEvent({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role.toUpperCase(),
      action: 'APPLICATION_CREATED',
      applicationId: newId,
      description: `Created new application ${newId} for ${institutionName}. Assigned to ${reviewer.name}.`,
    });

    StorageService.addNotification({
      title: 'New Application Registered',
      message: `${institutionName} (${newId}) submitted for AY ${academicYear}.`,
      type: 'new_submission',
      applicationId: newId,
    });

    onCreated(newId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#10152F] to-[#2B195E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Register New Institutional Application</h2>
              <p className="text-xs text-slate-300">Intake for AICTE Academic Year 2026-2027</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Core Institution Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-purple-700">
              1. Institutional Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Institution Name *
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g., Apex Institute of Technology"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  AICTE Permanent ID *
                </label>
                <input
                  type="text"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  placeholder="e.g., AICTE-1-9871234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Application Category
                </label>
                <select
                  value={applicationType}
                  onChange={(e) => setApplicationType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                >
                  <option value="New Institution Approval">New Institution Approval</option>
                  <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                  <option value="Increase in Intake">Increase in Intake</option>
                  <option value="New Program / Department">New Program / Department</option>
                  <option value="Closure of Course">Closure of Course</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">AICTE Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                >
                  <option value="Western">Western</option>
                  <option value="Northern">Northern</option>
                  <option value="North-Western">North-Western</option>
                  <option value="Southern">Southern</option>
                  <option value="South-Western">South-Western</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Central">Central</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">District / City</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-purple-700">
              2. Authorized Contact Official
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g., Dr. R. K. Mukherjee (Principal)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="principal@institution.edu.in"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-purple-700">
                3. Regulatory Documents Dossier
              </h3>
              <span className="text-slate-500">{uploadedDocs.length} files attached</span>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-purple-400 bg-slate-50/50 transition-colors">
              <Upload className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">
                Upload Mandatory Certificates & Deeds (PDF, PNG, JPG)
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Upload registration deed, building safety, fire NOC, land records, or affiliation orders
              </p>
              <label className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                Browse Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="space-y-2 mt-2">
                {uploadedDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-slate-800 truncate max-w-xs">{doc.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>

                    <select
                      value={doc.category}
                      onChange={(e) => {
                        const newCat = e.target.value as DocumentCategory;
                        setUploadedDocs((prev) => {
                          const copy = [...prev];
                          copy[idx].category = newCat;
                          return copy;
                        });
                      }}
                      className="px-2 py-1 text-[11px] border rounded bg-white"
                    >
                      <option value="registration">Registration Deed</option>
                      <option value="fire_safety">Fire Safety NOC</option>
                      <option value="building_safety">Building Stability</option>
                      <option value="land_deed">Land Title Deed</option>
                      <option value="aicte_affiliation">Affiliation Order</option>
                      <option value="accreditation">NBA/NAAC Accreditation</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Reviewer */}
          <div className="pt-3 border-t border-slate-200">
            <label className="block font-semibold text-slate-700 mb-1">
              Assign Scrutiny Officer
            </label>
            <select
              value={assignedReviewerId}
              onChange={(e) => setAssignedReviewerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()} - {u.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubmit(true)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#5145CD] to-[#6941C6] hover:from-[#4338CA] hover:to-[#5832A8] text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Submit & Run Validation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
