/**
 * Red Bull Racing - Group Management
 * Customer Admin interface for managing employee groups/departments
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Users, Edit2, Trash2, Loader2 } from 'lucide-react';
import { GroupFormDialog } from '@/components/customer-admin/GroupFormDialog';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
  };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/customer/groups');
      const data = await response.json();

      if (response.ok) {
        setGroups(data.groups || []);
      } else {
        throw new Error(data.error || 'Errore nel caricamento dei gruppi');
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore nel caricamento');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = () => {
    setSelectedGroup(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/customer/groups/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Gruppo eliminato con successo');
        setDeleteId(null);
        fetchGroups();
      } else {
        throw new Error(data.error || 'Errore durante l\'eliminazione');
      }
    } catch (error: any) {
      toast.error(error.message || 'Si è verificato un errore');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalMembers = groups.reduce((sum, g) => sum + g._count.members, 0);
  const activeGroups = groups.filter((g) => g.isActive).length;

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
        title="Gestione Gruppi"
        subtitle="Organizza i dipendenti in gruppi e reparti"
        action={
          <Button
            onClick={handleCreate}
            className="bg-racing-red-gradient hover:opacity-90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuovo Gruppo
          </Button>
        }
        breadcrumbs={[{ label: 'Admin Cliente' }, { label: 'Gruppi' }]}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="racing-card">
          <p className="text-sm text-rbr-text-muted mb-1">Gruppi Totali</p>
          <p className="text-2xl font-heading font-bold text-rbr-text-primary">
            {groups.length}
          </p>
        </div>
        <div className="racing-card">
          <p className="text-sm text-rbr-text-muted mb-1">Gruppi Attivi</p>
          <p className="text-2xl font-heading font-bold text-rbr-accent-green">
            {activeGroups}
          </p>
        </div>
        <div className="racing-card">
          <p className="text-sm text-rbr-text-muted mb-1">Membri Totali</p>
          <p className="text-2xl font-heading font-bold text-rbr-navy">
            {totalMembers}
          </p>
        </div>
        <div className="racing-card">
          <p className="text-sm text-rbr-text-muted mb-1">Media Membri</p>
          <p className="text-2xl font-heading font-bold text-rbr-accent-blue">
            {groups.length > 0 ? Math.round(totalMembers / groups.length) : 0}
          </p>
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="racing-card text-center py-12">
          <Users className="h-12 w-12 text-rbr-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-heading font-bold text-rbr-text-primary mb-2">
            Nessun gruppo trovato
          </h3>
          <p className="text-rbr-text-secondary mb-4">
            Inizia creando il tuo primo gruppo per organizzare i dipendenti
          </p>
          <Button onClick={handleCreate} className="bg-racing-red-gradient hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Crea Primo Gruppo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => {
            const colors = [
              'from-rbr-navy to-blue-400',
              'from-rbr-red to-pink-400',
              'from-purple-600 to-purple-400',
              'from-green-600 to-green-400',
              'from-orange-600 to-orange-400',
              'from-cyan-600 to-cyan-400',
            ];
            const colorClass = colors[index % colors.length];

            return (
              <div
                key={group.id}
                className={`racing-card group hover:shadow-racing-lg transition-all ${
                  !group.isActive ? 'opacity-60' : ''
                }`}
              >
                <div
                  className={`h-2 w-full rounded-t-lg bg-gradient-to-r ${colorClass} mb-4`}
                />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-heading font-bold text-rbr-text-primary">
                        {group.name}
                      </h3>
                      {!group.isActive && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rbr-dark-elevated text-rbr-text-muted border border-rbr-border">
                          Inattivo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-rbr-text-muted line-clamp-2">
                      {group.description || 'Nessuna descrizione'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-rbr-dark-elevated">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-rbr-text-muted" />
                      <span className="text-sm text-rbr-text-secondary">Membri</span>
                    </div>
                    <span className="font-heading font-bold text-rbr-text-primary">
                      {group._count.members}
                    </span>
                  </div>

                  <div className="text-xs text-rbr-text-muted">
                    Creato il {new Date(group.createdAt).toLocaleDateString('it-IT')}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-rbr-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(group)}
                    className="flex-1 border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(group.id)}
                    className="flex-1 border-rbr-red text-rbr-red hover:bg-rbr-red hover:text-white"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Elimina
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Group Form Dialog */}
      <GroupFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        group={selectedGroup}
        onSuccess={fetchGroups}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-rbr-dark border-rbr-border-light">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rbr-text-primary">
              Conferma Eliminazione
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rbr-text-secondary">
              Sei sicuro di voler eliminare questo gruppo? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary hover:bg-rbr-dark-lighter"
            >
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rbr-red hover:bg-rbr-red/80"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
