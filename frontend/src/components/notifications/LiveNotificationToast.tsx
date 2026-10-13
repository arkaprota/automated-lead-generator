'use client';

import React, { useEffect, useState } from 'react';
import { getSocketClient } from '@/lib/socket';
import { Sparkles, X, MailCheck } from 'lucide-react';

interface PositiveReplyNotification {
  workspaceId: string;
  leadId: string;
  businessName: string;
  intent: 'INTERESTED';
  replySnippet: string;
  receivedAt: string;
}

export function LiveNotificationToast({ workspaceId }: { workspaceId: string }) {
  const [notification, setNotification] = useState<PositiveReplyNotification | null>(null);

  useEffect(() => {
    const socket = getSocketClient();

    // Join tenant room
    socket.emit('join:workspace', workspaceId);

    const handlePositiveReply = (data: PositiveReplyNotification) => {
      console.log('[Socket] Received positive reply:', data);
      setNotification(data);
    };

    socket.on('lead:positive_reply', handlePositiveReply);

    return () => {
      socket.off('lead:positive_reply', handlePositiveReply);
    };
  }, [workspaceId]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="glass-panel p-4 rounded-xl border-emerald-500/40 bg-slate-900/90 shadow-2xl shadow-emerald-500/20 text-white relative">
        <button
          onClick={() => setNotification(null)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
            <MailCheck className="w-5 h-5" />
          </div>
          <div className="pr-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-400 text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> High-Intent Lead Reply!
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                INTERESTED
              </span>
            </div>
            <h4 className="font-bold text-white text-base mt-1">
              {notification.businessName}
            </h4>
            <p className="text-xs text-slate-300 mt-1 italic line-clamp-2">
              &quot;{notification.replySnippet}&quot;
            </p>
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400">
              <span>{new Date(notification.receivedAt).toLocaleTimeString()}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Ready for immediate closing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
