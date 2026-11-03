import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Check, CheckCheck, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif._id);
    }
    if (notif.tokenId || notif.type === 'approaching' || notif.type === 'called') {
      setIsOpen(false);
      navigate('/my-queue');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative btn-secondary h-9 w-9 px-0 rounded-full flex items-center justify-center text-[#1F2933] hover:bg-[#F0EAE1] transition"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4 text-[#3F4946]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B44A3F] text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E6DED2] bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-[#E6DED2] bg-[#FAF7F0] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1F2933]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#EBF2EE] px-2 py-0.5 text-[11px] font-bold text-[#2F7D6D]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F7D6D] hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#F0EAE1]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#667085]">
                <Bell className="mx-auto mb-2 h-6 w-6 text-[#D5CCC0]" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isCalled = notif.type === 'called';
                const isApproaching = notif.type === 'approaching';

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-[#FAF7F0] ${
                      !notif.read ? 'bg-[#F9F7F2]' : 'bg-white'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        !notif.read
                          ? isCalled
                            ? 'bg-[#2F7D6D] ring-2 ring-[#B9D4C8]'
                            : isApproaching
                            ? 'bg-[#C98A2E] ring-2 ring-[#EAD8B8]'
                            : 'bg-[#2F7D6D]'
                          : 'bg-transparent'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold line-clamp-1 ${!notif.read ? 'text-[#1F2933]' : 'text-[#667085]'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-[#9CA3AF] shrink-0">{formatRelativeTime(notif.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#667085] leading-relaxed line-clamp-2">{notif.message}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                      className="text-[#D5CCC0] hover:text-[#B44A3F] p-1 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-[#E6DED2] bg-[#FAF7F0] px-4 py-2 text-center">
            <span className="text-[11px] text-[#667085]">
              Real-time alerts for turn approaching, called status & venue updates
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
