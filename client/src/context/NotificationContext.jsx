import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { Bell, CheckCircle, AlertTriangle, Info, X, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext(null);

// Gentle synthesized notification chime using Web Audio API (no external mp3 asset required)
function playNotificationChime(type = 'default') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    if (type === 'called') {
      // Fanfare chime for being called
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5
      osc2.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    } else if (type === 'approaching') {
      // Gentle warning ping
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.setValueAtTime(329.63, now + 0.1); // E4
    } else {
      // Standard subtle notification ping
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.setValueAtTime(554.37, now + 0.08);
      osc2.frequency.setValueAtTime(329.63, now);
      osc2.frequency.setValueAtTime(440, now + 0.08);
    }

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (err) {
    // Audio context may require prior user interaction
  }
}

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore background fetch error
    }
  }, [isAuthenticated]);

  // Push an active in-app toast
  const addToast = useCallback((notif) => {
    const id = notif._id || Date.now() + Math.random().toString();
    const newToast = { ...notif, toastId: id };

    setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep at most 4 toasts visible
    playNotificationChime(notif.type);

    // Also attempt native system notification if tab is backgrounded
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }

    // Auto dismiss toast after 6.5s
    setTimeout(() => {
      removeToast(id);
    }, 6500);
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Initial request for desktop notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Fetch initial notifications when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Real-time socket sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const authToken = localStorage.getItem('token') || localStorage.getItem('queueflow_token');
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token: authToken }
    });

    socket.on('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n._id !== notif._id)]);
      setUnreadCount((prev) => prev + 1);
      addToast(notif);
    });

    socket.on('token:approaching', (data) => {
      // Complementary approaching sync
      fetchNotifications();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, addToast, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addToast,
        removeToast
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} onMarkRead={markAsRead} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Global Toast Banner Overlay
const ToastContainer = ({ toasts, onDismiss, onMarkRead }) => {
  const navigate = useNavigate();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isCalled = toast.type === 'called';
        const isApproaching = toast.type === 'approaching';

        let badgeStyle = 'border-[#E6DED2] bg-white text-[#1F2933] shadow-lg';
        let icon = <Info className="h-5 w-5 text-[#2F7D6D]" />;

        if (isCalled) {
          badgeStyle = 'border-2 border-[#2F7D6D] bg-[#F4F9F6] text-[#1F2933] shadow-xl';
          icon = <CheckCircle className="h-5 w-5 text-[#2F7D6D] animate-bounce" />;
        } else if (isApproaching) {
          badgeStyle = 'border-2 border-[#C98A2E] bg-[#FFFBF2] text-[#1F2933] shadow-lg';
          icon = <AlertTriangle className="h-5 w-5 text-[#C98A2E]" />;
        }

        return (
          <div
            key={toast.toastId}
            className={`pointer-events-auto rounded-xl p-4 transition-all duration-300 transform translate-y-0 opacity-100 ${badgeStyle}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#1F2933] line-clamp-1">{toast.title}</h4>
                  <button
                    onClick={() => onDismiss(toast.toastId)}
                    className="text-[#9CA3AF] hover:text-[#1F2933] transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#667085] leading-relaxed">{toast.message}</p>

                {(isCalled || isApproaching || toast.tokenId) && (
                  <button
                    onClick={() => {
                      onDismiss(toast.toastId);
                      if (toast._id) onMarkRead(toast._id);
                      navigate('/my-queue');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D6D] hover:underline"
                  >
                    <span>View My Token</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
