import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Shield,
  Edit,
  Save,
  HelpCircle,
  Search,
  Check,
} from 'lucide-react';
import { Application, ComplianceRule, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { evaluateApplication } from '../../services/validationEngine';
import { StatusBadge } from '../common/StatusBadge';

interface Props {
  applications: Application[];
  rules: ComplianceRule[];
  currentUser: User;
  onSelectApplication: (id: string) => void;
}

export const ComplianceCenterView: React.FC<Props> = ({
  applications,
  rules,
  currentUser,
  onSelectApplication,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  const activeApp = applications.find((a) => a.id === selectedAppId) || applications[0];

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleWeightDraft, setRuleWeightDraft] = useState<number>(20);
  const [ruleMandatoryDraft, setRuleMandatoryDraft] = useState<boolean>(true);
  const [reEvaluateSuccess, setReEvaluateSuccess] = useState(false);

  // Evaluate active application
  const evaluation = activeApp ? evaluateApplication(activeApp, rules) : null;

  const handleToggleRule = (ruleId: string, currentEnabled: boolean) => {
    if (currentUser.role !== 'admin') {
      alert('Only administrators can toggle regulatory rule configurations.');
      return;
    }
    StorageService.updateRule(ruleId, { isEnabled: !currentEnabled });
    triggerReEvaluation();
  };

  const handleSaveRuleConfig = (ruleId: string) => {
    StorageService.updateRule(ruleId, {
      weight: ruleWeightDraft,
      isMandatory: ruleMandatoryDraft,
    });
    setEditingRuleId(null);
    triggerReEvaluation();
  };

  const triggerReEvaluation = () => {
    // Re-evaluate all applications against the updated rules
    applications.forEach((app) => {
      const res = evaluateApplication(app, rules);
      StorageService.updateApplication(app.id, {
        complianceChecks: res.complianceChecks,
        riskAssessment: res.riskAssessment,
      });
    });
    setReEvaluateSuccess(true);
    setTimeout(() => setReEvaluateSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Advisory Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
              APH 2026-27 Config Engine
            </span>
            <h2 className="text-base font-bold text-slate-900">
              AICTE Regulatory Compliance & Rules Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Modular rules engine validating mandatory certificates, date validities, and intake requirements.
            Illustrated rules correspond to the AICTE Approval Process Handbook (APH 2026-27).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerReEvaluation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#5145CD] to-[#6941C6] hover:from-[#4338CA] hover:to-[#5832A8] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-Run All Checks</span>
          </button>
        </div>
      </div>

      {reEvaluateSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Regulatory checks re-evaluated across all institutional applications in memory.</span>
        </div>
      )}

      {/* Rules Engine Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Regulatory Rules Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Configurable Regulatory Rules ({rules.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  {currentUser.role === 'admin'
                    ? 'As Administrator, you can adjust scoring weights and toggle rules.'
                    : 'Viewing active rules. Only Administrator can modify weights.'}
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {rules.map((rule) => {
                const isEditing = editingRuleId === rule.id;

                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      rule.isEnabled
                        ? 'border-slate-200 bg-white hover:border-purple-200'
                        : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {rule.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{rule.title}</span>
                          {rule.isMandatory && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                              rule.isEnabled ? 'bg-purple-600' : 'bg-slate-300'
                            }`}
                            title={rule.isEnabled ? 'Disable Rule' : 'Enable Rule'}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                rule.isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Category: <strong className="text-slate-700 capitalize">{rule.category.replace('_', ' ')}</strong></span>
                        <span>•</span>
                        <span>Weight: <strong className="text-slate-900 font-mono">{rule.weight} pts</strong></span>
                      </div>

                      {currentUser.role === 'admin' && (
                        <div>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-slate-600">Weight:</label>
                              <input
                                type="number"
                                min={5}
                                max={50}
                                value={ruleWeightDraft}
                                onChange={(e) => setRuleWeightDraft(Number(e.target.value))}
                                className="w-16 px-1.5 py-0.5 border rounded text-xs text-center"
                              />
                              <button
                                onClick={() => handleSaveRuleConfig(rule.id)}
                                className="px-2 py-0.5 rounded bg-purple-600 text-white text-[11px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRuleId(null)}
                                className="text-[11px] text-slate-500 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRuleId(rule.id);
                                setRuleWeightDraft(rule.weight);
                                setRuleMandatoryDraft(rule.isMandatory);
                              }}
                              className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Configure</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Application Rule Evaluation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inspection Live Evaluation
              </span>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="px-2.5 py-1 text-xs border rounded-lg bg-slate-50 max-w-[200px] truncate"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.id} - {app.institutionName}
                  </option>
                ))}
              </select>
            </div>

            {/* Score Ring / Bar */}
            {evaluation && (
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-900">
                    Compliance Score
                  </span>
                  <p className="text-[11px] text-purple-700">Applicable rules passed</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-purple-900 font-mono">
                    {evaluation.compliancePercentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Application Check List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {evaluation?.complianceChecks.map((chk) => (
                <div
                  key={chk.id}
                  className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">{chk.ruleTitle}</span>
                    <StatusBadge status={chk.outcome} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-600">{chk.reason}</p>
                  {chk.documentName && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Ref: {chk.documentName}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => onSelectApplication(activeApp.id)}
                className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                Open Full Dossier for {activeApp.institutionName}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
