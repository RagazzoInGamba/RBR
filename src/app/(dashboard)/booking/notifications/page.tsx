/**
 * Red Bull Racing - Notifications
 * End User notifications interface with real-time data
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  X,
  Trash2,
  CheckCheck,
  Loader2,
  CreditCard,
  Settings
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
  actionUrl?: string | null;
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    SUCCESS: <CheckCircle className="h-5 w-5 text-green-500" />,
    BOOKING: <Clock className="h-5 w-5 text-rbr-navy" />,
    WARNING: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    ERROR: <X className="h-5 w-5 text-rbr-red" />,
    INFO: <Info className="h-5 w-5 text-rbr-accent-blue" />,
    PAYMENT: <CreditCard className="h-5 w-5 text-purple-500" />,
    SYSTEM: <Settings className="h-5 w-5 text-gray-500" />,
  };

  return icons[type] || icons.INFO;
};

const getNotificationStyle = (type: string) => {
  const styles: Record<string, string> = {
    SUCCESS: 'border-green-500/30 bg-green-500/10',
    BOOKING: 'border-rbr-navy/30 bg-rbr-navy/10',
    WARNING: 'border-yellow-500/30 bg-yellow-500/10',
    ERROR: 'border-rbr-red/30 bg-rbr-red/10',
    INFO: 'border-rbr-accent-blue/30 bg-rbr-accent-blue/10',
    PAYMENT: 'border-purple-500/30 bg-purple-500/10',
    SYSTEM: 'border-gray-500/30 bg-gray-500/10',
  };

  return styles[type] || styles.INFO;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('unreadOnly', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        throw new Error(data.error || 'Errore nel caricamento delle notifiche');
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore nel caricamento');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Notifica segnata come letta');
        fetchNotifications();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'operazione');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Notifica eliminata');
        fetchNotifications();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'eliminazione');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Tutte le notifiche segnate come lette');
        fetchNotifications();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'operazione');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-rbr-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Notifiche"
        subtitle="Rimani aggiornato sulle tue prenotazioni"
        action={
          unreadCount > 0 ? (
            <Button
              onClick={handleMarkAllAsRead}
              className="bg-rbr-navy hover:bg-rbr-navy/80 gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Segna Tutte Come Lette
            </Button>
          ) : null
        }
        breadcrumbs={[
          { label: 'Prenotazioni' },
          { label: 'Notifiche' },
        ]}
      />

      {/* Unread Count */}
      {unreadCount > 0 && (
        <div className="racing-card flex items-center gap-3">
          <div className="p-3 rounded-full bg-rbr-red/20">
            <Bell className="h-6 w-6 text-rbr-red" />
          </div>
          <div>
            <p className="font-heading font-bold text-rbr-text-primary">
              Hai {unreadCount} {unreadCount === 1 ? 'notifica non letta' : 'notifiche non lette'}
            </p>
            <p className="text-sm text-rbr-text-muted">
              Controlla gli aggiornamenti importanti
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all">
            Tutte ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Non Lette ({unreadCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`racing-card relative border-l-4 ${getNotificationStyle(notification.type)} ${
              !notification.read ? 'shadow-racing-md' : 'opacity-70'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h4 className="font-heading font-bold text-rbr-text-primary">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <Badge className="mt-1 bg-rbr-red/20 text-rbr-red text-xs">
                        Nuova
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-rbr-text-muted">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: it,
                    })}
                  </span>
                </div>
                <p className="text-sm text-rbr-text-secondary mb-3">
                  {notification.message}
                </p>
                <div className="flex gap-2">
                  {!notification.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Segna Come Letta
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="border-rbr-red text-rbr-red hover:bg-rbr-red hover:text-white"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Elimina
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no notifications) */}
      {notifications.length === 0 && (
        <div className="racing-card text-center py-12">
          <Bell className="h-16 w-16 text-rbr-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-heading font-bold text-rbr-text-primary mb-2">
            {filter === 'unread' ? 'Nessuna Notifica Non Letta' : 'Nessuna Notifica'}
          </h3>
          <p className="text-rbr-text-muted">
            {filter === 'unread'
              ? 'Tutte le notifiche sono state lette'
              : 'Quando riceverai aggiornamenti, appariranno qui'}
          </p>
        </div>
      )}
    </div>
  );
}

