import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  Sliders,
  Server,
  Database,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ComplianceRule, SystemIntegrationStatus, User } from '../../types';
import { StorageService } from '../../services/storageService';

interface Props {
  rules: ComplianceRule[];
  integrations: SystemIntegrationStatus[];
  currentUser: User;
  onResetComplete: () => void;
}

export const SettingsView: React.FC<Props> = ({
  rules,
  integrations,
  currentUser,
  onResetComplete,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [retentionDays, setRetentionDays] = useState(180);

  // Simulated Source Verification Test
  const [simulatedDocId, setSimulatedDocId] = useState('NOC-FIRE-MAH-2026-901');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'success' | 'failed' | null;
    message: string;
    isSimulated: boolean;
  }>({ status: null, message: '', isSimulated: true });

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationResult({
      status: 'success',
      message: `[DEMO SIMULATED RESPONSE] Authority DigiLocker Gateway: Certificate ${simulatedDocId} is matched with Maharashtra State Fire Services Registry. Authenticity confidence: 99.2% (Synthetic response for Hackathon prototype).`,
      isSimulated: true,
    });
  };

  const handleResetData = () => {
    StorageService.resetDemoData();
    setShowResetConfirm(false);
    setResetSuccess(true);
    onResetComplete();
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const getStatusBadge = (status: SystemIntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Connected
          </span>
        );
      case 'demo_mode':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            Demo Mode (Simulated)
          </span>
        );
      case 'not_configured':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Not Configured
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
              System Configuration
            </span>
            <h2 className="text-base font-bold text-slate-900">
              VerityAI Regulatory Settings & Environment Controls
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure APH 2026 scrutiny parameters, external gateway connection states, and restore synthetic demonstration data.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All 8 fictional applications, rules, and audit history restored to pristine state.</span>
        </div>
      )}

      {/* External Integration Gateways Status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              External Regulatory Verification Gateways
            </h3>
            <p className="text-[11px] text-slate-500">
              Honest status indicators for national issuing authority APIs and data exchange pipelines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                  <p className="text-[11px] text-purple-700 font-medium">{item.service}</p>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">{item.note}</p>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Last Activity: {item.lastPing}</span>
                {item.latency && <span>Latency: {item.latency}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated Source-Verification Sandbox */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Simulated Source-Verification Sandbox (Demo Mode)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Demonstrates how verified third-party responses integrate into the scrutiny workflow without making unauthorized external calls.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunSimulation} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={simulatedDocId}
              onChange={(e) => setSimulatedDocId(e.target.value)}
              placeholder="Enter Certificate or Registration Number..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#5145CD] to-[#6941C6] hover:from-[#4338CA] hover:to-[#5832A8] text-white text-xs font-semibold shadow-xs"
            >
              Test Simulated Gateway Query
            </button>
          </div>
        </form>

        {verificationResult.message && (
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-xs text-cyan-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-800">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
              <span>Simulated Response Received</span>
            </div>
            <p className="leading-relaxed">{verificationResult.message}</p>
          </div>
        )}
      </div>

      {/* Retention & Governance */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Data Governance & Regulatory Retention
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Dossier Cache Retention Window</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
              />
              <span className="text-slate-500">days following statutory approval cycle</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">Current User Authorization</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.designation}</p>
              </div>
              <span className="text-[11px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Restore Initial Demo Dataset?</h3>
                <p className="text-xs text-slate-500">Smart India Hackathon demonstration reset</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This will reset all 8 sample applications (Greenfield, Meridian, Horizon, Riverstone, Bluepeak, Silverline, Oakbridge, Sunrise), restore initial APH 2026 compliance weights, and reset notifications to their original evaluation baseline.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 rounded-lg border text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Yes, Reset Sample Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
