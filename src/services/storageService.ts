/**
 * VerityAI Local Storage & State Management Service
 * Provides persistent local state, reactive event pub/sub, and audit logging.
 */

import {
  Application,
  AuditEvent,
  ComplianceRule,
  Discrepancy,
  ExtractedField,
  NotificationItem,
  ReviewComment,
  SystemIntegrationStatus,
  User,
} from '../types';
import {
  DEMO_USERS,
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_INTEGRATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RULES,
} from '../data/mockData';

const STORAGE_KEYS = {
  APPLICATIONS: 'verityai_applications_v1',
  RULES: 'verityai_rules_v1',
  AUDIT_EVENTS: 'verityai_audit_events_v1',
  NOTIFICATIONS: 'verityai_notifications_v1',
  CURRENT_USER: 'verityai_current_user_v1',
  INTEGRATIONS: 'verityai_integrations_v1',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeToStorage = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying storage listener:', e);
    }
  });
};

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export const StorageService = {
  // --- USERS ---
  getCurrentUser(): User {
    const stored = getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) return stored;
    return DEMO_USERS[1]; // Default to Reviewer (Ananya Deshmukh) for best SIH walkthrough
  },

  setCurrentUser(user: User): void {
    setStoredItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  getAllUsers(): User[] {
    return DEMO_USERS;
  },

  // --- APPLICATIONS ---
  getApplications(): Application[] {
    return getStoredItem<Application[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  },

  getApplicationById(id: string): Application | undefined {
    const apps = this.getApplications();
    return apps.find((a) => a.id === id);
  },

  saveApplication(app: Application): void {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      apps[index] = { ...app, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
    } else {
      apps.unshift({ ...app, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) });
    }
    setStoredItem(STORAGE_KEYS.APPLICATIONS, apps);
  },

  updateApplication(id: string, updates: Partial<Application>, logAction?: string): void {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === id);
    if (index >= 0) {
      const prevStatus = apps[index].status;
      apps[index] = {
        ...apps[index],
        ...updates,
        lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setStoredItem(STORAGE_KEYS.APPLICATIONS, apps);

      if (logAction || (updates.status && updates.status !== prevStatus)) {
        const currentUser = this.getCurrentUser();
        this.logAuditEvent({
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role.toUpperCase(),
          action: logAction || 'APPLICATION_STATUS_UPDATED',
          applicationId: id,
          description: `Updated application ${id}. ${updates.status ? `Status changed to ${updates.status}` : ''}`,
          oldValue: prevStatus,
          newValue: updates.status || 'Updated',
        });
      }
    }
  },

  // --- DISCREPANCY MANAGEMENT ---
  resolveDiscrepancy(
    applicationId: string,
    discrepancyId: string,
    newStatus: Discrepancy['status'],
    notes: string,
    resolvedBy: string
  ): void {
    const app = this.getApplicationById(applicationId);
    if (!app) return;

    const discIndex = app.discrepancies.findIndex((d) => d.id === discrepancyId);
    if (discIndex >= 0) {
      const oldDisc = app.discrepancies[discIndex];
      app.discrepancies[discIndex] = {
        ...oldDisc,
        status: newStatus,
        resolutionNotes: notes,
        resolvedBy,
        resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      // Recalculate risk signals
      const activeDiscrepancies = app.discrepancies.filter(
        (d) => d.status === 'open' || d.status === 'confirmed'
      );
      if (activeDiscrepancies.length === 0 && app.riskAssessment.score > 30) {
        app.riskAssessment = {
          ...app.riskAssessment,
          score: Math.max(10, app.riskAssessment.score - 40),
          level: app.riskAssessment.score - 40 < 30 ? 'low' : 'medium',
        };
      }

      this.saveApplication(app);

      this.logAuditEvent({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        userId: this.getCurrentUser().id,
        userName: this.getCurrentUser().name,
        userRole: this.getCurrentUser().role.toUpperCase(),
        action: 'DISCREPANCY_STATUS_CHANGED',
        applicationId,
        recordIdentifier: oldDisc.title,
        description: `Discrepancy "${oldDisc.title}" marked as ${newStatus}. Note: ${notes}`,
        oldValue: oldDisc.status,
        newValue: newStatus,
      });
    }
  },

  // --- EXTRACTED FIELD UPDATE ---
  updateExtractedField(
    applicationId: string,
    documentId: string,
    fieldId: string,
    newVal: string
  ): void {
    const app = this.getApplicationById(applicationId);
    if (!app) return;

    const doc = app.documents.find((d) => d.id === documentId);
    if (!doc) return;

    const field = doc.extractedFields.find((f) => f.id === fieldId);
    if (field) {
      const oldVal = field.value;
      field.originalValue = field.originalValue || oldVal;
      field.value = newVal;
      field.isEdited = true;
      field.confidence = 1.0; // Manual reviewer override guarantees certainty

      this.saveApplication(app);

      this.logAuditEvent({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        userId: this.getCurrentUser().id,
        userName: this.getCurrentUser().name,
        userRole: this.getCurrentUser().role.toUpperCase(),
        action: 'EXTRACTION_FIELD_CORRECTED',
        applicationId,
        recordIdentifier: `${doc.name} :: ${field.label}`,
        description: `Field "${field.label}" corrected by reviewer.`,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  },

  // --- COMMENTS ---
  addReviewComment(applicationId: string, text: string, isInternal: boolean = true): void {
    const app = this.getApplicationById(applicationId);
    if (!app) return;

    const user = this.getCurrentUser();
    const comment: ReviewComment = {
      id: `c_${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      text,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isInternal,
    };

    app.comments.push(comment);
    this.saveApplication(app);

    this.logAuditEvent({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userId: user.id,
      userName: user.name,
      userRole: user.role.toUpperCase(),
      action: 'REVIEW_COMMENT_ADDED',
      applicationId,
      description: `Added review comment: "${text.substring(0, 60)}..."`,
    });
  },

  // --- AUDIT TRAIL ---
  getAuditEvents(): AuditEvent[] {
    return getStoredItem<AuditEvent[]>(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS);
  },

  logAuditEvent(event: AuditEvent): void {
    const events = this.getAuditEvents();
    events.unshift(event);
    setStoredItem(STORAGE_KEYS.AUDIT_EVENTS, events);
  },

  // --- NOTIFICATIONS ---
  getNotifications(): NotificationItem[] {
    return getStoredItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.isRead = true;
      setStoredItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },

  markAllNotificationsRead(): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => {
      n.isRead = true;
    });
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): void {
    const notifs = this.getNotifications();
    const item: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    notifs.unshift(item);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  // --- RULES CONFIGURATION ---
  getRules(): ComplianceRule[] {
    return getStoredItem<ComplianceRule[]>(STORAGE_KEYS.RULES, INITIAL_RULES);
  },

  updateRule(id: string, updates: Partial<ComplianceRule>): void {
    const rules = this.getRules();
    const index = rules.findIndex((r) => r.id === id);
    if (index >= 0) {
      const oldRule = rules[index];
      rules[index] = { ...oldRule, ...updates };
      setStoredItem(STORAGE_KEYS.RULES, rules);

      const user = this.getCurrentUser();
      this.logAuditEvent({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        userId: user.id,
        userName: user.name,
        userRole: user.role.toUpperCase(),
        action: 'COMPLIANCE_RULE_CONFIGURED',
        applicationId: 'SYSTEM_SETTINGS',
        recordIdentifier: oldRule.code,
        description: `Modified rule ${oldRule.code} (${oldRule.title}).`,
        oldValue: `Weight: ${oldRule.weight}, Active: ${oldRule.isEnabled}`,
        newValue: `Weight: ${updates.weight ?? oldRule.weight}, Active: ${updates.isEnabled ?? oldRule.isEnabled}`,
      });
    }
  },

  // --- INTEGRATIONS ---
  getIntegrations(): SystemIntegrationStatus[] {
    return getStoredItem<SystemIntegrationStatus[]>(STORAGE_KEYS.INTEGRATIONS, INITIAL_INTEGRATIONS);
  },

  updateIntegration(id: string, updates: Partial<SystemIntegrationStatus>): void {
    const list = this.getIntegrations();
    const index = list.findIndex((i) => i.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...updates };
      setStoredItem(STORAGE_KEYS.INTEGRATIONS, list);
    }
  },

  // --- RESET DEMO DATA ---
  resetDemoData(): void {
    setStoredItem(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    setStoredItem(STORAGE_KEYS.RULES, INITIAL_RULES);
    setStoredItem(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setStoredItem(STORAGE_KEYS.INTEGRATIONS, INITIAL_INTEGRATIONS);
    setStoredItem(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[1]);

    this.logAuditEvent({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userId: 'usr_system',
      userName: 'Demo Reset Engine',
      userRole: 'ADMINISTRATOR',
      action: 'DEMO_DATA_RESET',
      applicationId: 'GLOBAL',
      description: 'Restored initial sample applications, rules, and synthetic test dataset.',
    });
  },
};
