/**
 * VerityAI — AI-Powered AICTE Application Validation & Document Verification Platform
 * Smart India Hackathon (SIH26261)
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { OverviewView } from './components/dashboard/OverviewView';
import { ApplicationsView } from './components/applications/ApplicationsView';
import { DocumentVerificationView } from './components/verification/DocumentVerificationView';
import { ComplianceCenterView } from './components/compliance/ComplianceCenterView';
import { RiskAnomaliesView } from './components/risk/RiskAnomaliesView';
import { ReviewQueueView } from './components/review/ReviewQueueView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { SettingsView } from './components/settings/SettingsView';
import { ApplicationDetailModal } from './components/applications/ApplicationDetailModal';
import { NewApplicationModal } from './components/applications/NewApplicationModal';
import { StorageService, subscribeToStorage } from './services/storageService';
import {
  Application,
  AuditEvent,
  ComplianceRule,
  NotificationItem,
  SystemIntegrationStatus,
  User,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [verificationAppId, setVerificationAppId] = useState<string | undefined>(undefined);
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);

  // Storage synced states
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
  const [applications, setApplications] = useState<Application[]>(StorageService.getApplications());
  const [rules, setRules] = useState<ComplianceRule[]>(StorageService.getRules());
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(StorageService.getAuditEvents());
  const [notifications, setNotifications] = useState<NotificationItem[]>(StorageService.getNotifications());
  const [integrations, setIntegrations] = useState<SystemIntegrationStatus[]>(StorageService.getIntegrations());

  // Subscribe to storage changes for multi-component reactivity
  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      setApplications(StorageService.getApplications());
      setRules(StorageService.getRules());
      setAuditEvents(StorageService.getAuditEvents());
      setNotifications(StorageService.getNotifications());
      setIntegrations(StorageService.getIntegrations());
      setCurrentUser(StorageService.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  const handleUserChange = (newUser: User) => {
    StorageService.setCurrentUser(newUser);
    setCurrentUser(newUser);
  };

  const handleOpenApplicationModal = (appId: string) => {
    setSelectedAppId(appId);
  };

  const handleCloseApplicationModal = () => {
    setSelectedAppId(null);
  };

  const handleNavigateToDocUpload = (appId: string) => {
    setVerificationAppId(appId);
    setActiveTab('verification');
  };

  const selectedApplication = applications.find((a) => a.id === selectedAppId);

  // Badge calculations
  const queueCount = applications.filter(
    (a) => a.status === 'submitted' || a.status === 'under_review' || a.status === 'action_required'
  ).length;

  let anomaliesCount = 0;
  applications.forEach((a) => {
    a.discrepancies.forEach((d) => {
      if (d.status === 'open' || d.status === 'confirmed' || d.status === 'needs_evidence') {
        anomaliesCount++;
      }
    });
  });

  return (
    <div className="flex h-screen bg-[#F5F3FF]/40 text-slate-900 font-sans overflow-hidden">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        queueCount={queueCount}
        anomaliesCount={anomaliesCount}
        currentUser={currentUser}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={currentUser}
          onUserChange={handleUserChange}
          notifications={notifications}
          onSelectApplication={(id) => {
            setSelectedAppId(id);
          }}
          onOpenNewApplication={() => setIsNewAppModalOpen(true)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewView
                applications={applications}
                onSelectApplication={handleOpenApplicationModal}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenNewApplication={() => setIsNewAppModalOpen(true)}
              />
            )}

            {activeTab === 'applications' && (
              <ApplicationsView
                applications={applications}
                onSelectApplication={handleOpenApplicationModal}
                onOpenNewApplication={() => setIsNewAppModalOpen(true)}
                userRole={currentUser.role}
              />
            )}

            {activeTab === 'verification' && (
              <DocumentVerificationView
                applications={applications}
                selectedAppId={verificationAppId}
                onSelectApplication={handleOpenApplicationModal}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'compliance' && (
              <ComplianceCenterView
                applications={applications}
                rules={rules}
                currentUser={currentUser}
                onSelectApplication={handleOpenApplicationModal}
              />
            )}

            {activeTab === 'risk' && (
              <RiskAnomaliesView
                applications={applications}
                currentUser={currentUser}
                onSelectApplication={handleOpenApplicationModal}
              />
            )}

            {activeTab === 'queue' && (
              <ReviewQueueView
                applications={applications}
                currentUser={currentUser}
                onSelectApplication={handleOpenApplicationModal}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrailView events={auditEvents} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                rules={rules}
                integrations={integrations}
                currentUser={currentUser}
                onResetComplete={() => {
                  setApplications(StorageService.getApplications());
                  setSelectedAppId(null);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Application Deep-Dive Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={handleCloseApplicationModal}
          currentUser={currentUser}
          rules={rules}
          onNavigateToDocumentUpload={handleNavigateToDocUpload}
        />
      )}

      {/* New Application Intake Modal */}
      {isNewAppModalOpen && (
        <NewApplicationModal
          onClose={() => setIsNewAppModalOpen(false)}
          currentUser={currentUser}
          allUsers={StorageService.getAllUsers()}
          rules={rules}
          onCreated={(newAppId) => {
            setSelectedAppId(newAppId);
            setActiveTab('applications');
          }}
        />
      )}
    </div>
  );
}
