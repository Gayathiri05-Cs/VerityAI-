import React, { useState } from 'react';
import { NotificationItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { Bell, CheckCheck, ExternalLink, AlertOctagon, FileWarning, Clock, ShieldCheck } from 'lucide-react';

interface Props {
  notifications: NotificationItem[];
  onSelectApplication: (appId: string) => void;
}

export const NotificationDropdown: React.FC<Props> = ({
  notifications,
  onSelectApplication,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (item: NotificationItem) => {
    StorageService.markNotificationRead(item.id);
    if (item.applicationId) {
      onSelectApplication(item.applicationId);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.markAllNotificationsRead();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'mismatch':
      case 'high_risk':
        return <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'missing_doc':
      case 'expiry':
        return <FileWarning className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'status_change':
        return <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-cyan-600 shrink-0" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10 z-50 overflow-hidden border border-slate-100 divide-y divide-slate-100">
            <div className="p-3.5 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">Notifications & Alerts</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No active notifications
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start ${
                      !item.isRead ? 'bg-purple-50/40' : ''
                    }`}
                  >
                    <div className="mt-0.5">{getIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs ${!item.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-600 whitespace-nowrap">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {item.message}
                      </p>
                      {item.applicationId && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-600 font-medium">
                          <span>Open {item.applicationId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
