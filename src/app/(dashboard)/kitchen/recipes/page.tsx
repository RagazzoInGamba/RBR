/**
 * Red Bull Racing - Recipe Management
 * Kitchen Admin interface for managing recipes with REAL API Integration + DataTable
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { RecipeFormDialog } from '@/components/kitchen/RecipeFormDialog';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Users,
  Loader2,
  ChefHat,
  MoreVertical,
  Check,
  Leaf,
  Sprout,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Recipe } from '@prisma/client';
import { StatsCard } from '@/components/ui/StatsCard';

const getCategoryBadge = (category: string) => {
  const styles: Record<string, string> = {
    FIRST_COURSE: 'bg-rbr-red/20 text-rbr-red border-rbr-red/30',
    SECOND_COURSE: 'bg-rbr-navy/20 text-rbr-navy border-rbr-navy/30',
    SIDE_DISH: 'bg-green-500/20 text-green-500 border-green-500/30',
    DESSERT: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
    APPETIZER: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    BEVERAGE: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    EXTRA: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  };

  const labels: Record<string, string> = {
    APPETIZER: 'Antipasto',
    FIRST_COURSE: 'Primo',
    SECOND_COURSE: 'Secondo',
    SIDE_DISH: 'Contorno',
    DESSERT: 'Dessert',
    BEVERAGE: 'Bevanda',
    EXTRA: 'Extra',
  };

  return (
    <Badge className={styles[category] || 'bg-gray-500/20 text-gray-500'}>
      {labels[category] || category}
    </Badge>
  );
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>(undefined);

  // Fetch recipes from API
  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/kitchen/recipes');

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (error) {
      toast.error('Errore nel caricamento ricette');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Handlers
  const handleAddRecipe = () => {
    setSelectedRecipe(undefined);
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDialogOpen(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa ricetta?')) {
      return;
    }

    try {
      const response = await fetch(`/api/kitchen/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      toast.success('Ricetta eliminata con successo');
      fetchRecipes(); // Refresh list
    } catch (error) {
      toast.error('Errore nell\'eliminazione della ricetta');
    }
  };

  const handleDialogSuccess = () => {
    fetchRecipes(); // Refresh list after create/update
    setIsDialogOpen(false);
  };

  // Column Definitions
  const columns: ColumnDef<Recipe>[] = [
    {
      accessorKey: 'name',
      header: 'Nome Ricetta',
      cell: ({ row }) => {
        const recipe = row.original;
        if (!recipe) return <span className="text-rbr-text-muted">N/A</span>;

        return (
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {recipe.isVegan ? '🌱' : recipe.isVegetarian ? '🥗' : '🍽️'}
            </div>
            <div>
              <p className="font-medium text-rbr-text-primary">{recipe.name || 'N/A'}</p>
              {recipe.description && (
                <p className="text-xs text-rbr-text-muted line-clamp-1 max-w-xs">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => {
        const recipe = row.original;
        if (!recipe?.category) return <span className="text-rbr-text-muted">N/A</span>;
        return getCategoryBadge(recipe.category);
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'prepTime',
      header: 'Prep (min)',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-rbr-text-secondary">
          <Clock className="h-3 w-3" />
          <span>{row.original?.prepTime ?? 0}m</span>
        </div>
      ),
    },
    {
      accessorKey: 'cookTime',
      header: 'Cottura (min)',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-rbr-text-secondary">
          <Clock className="h-3 w-3" />
          <span>{row.original?.cookTime ?? 0}m</span>
        </div>
      ),
    },
    {
      accessorKey: 'servings',
      header: 'Porzioni',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-rbr-text-secondary">
          <Users className="h-3 w-3" />
          <span>{row.original?.servings ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'nutritionalValues',
      header: 'Dati Nutrizionali',
      cell: ({ row }) => {
        const recipe = row.original;
        const hasNutritionalData = recipe.nutritionalValues &&
          typeof recipe.nutritionalValues === 'object' &&
          Object.keys(recipe.nutritionalValues).length > 0;

        if (!hasNutritionalData) {
          return <Badge variant="outline" className="text-xs text-rbr-text-muted border-rbr-border">Non disponibili</Badge>;
        }

        const nutritionalData: any = recipe.nutritionalValues;
        const source = recipe.nutritionalSource;

        return (
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className="text-xs border-green-500/30 text-green-500 w-fit"
            >
              {nutritionalData.energy_kcal ? `${nutritionalData.energy_kcal} kcal` : 'Completi'}
            </Badge>
            {source && (
              <span className="text-xs text-rbr-text-muted">
                Fonte: {source}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'allergens',
      header: 'Allergeni',
      cell: ({ row }) => {
        const allergens = row.original.allergens;
        if (!allergens || allergens.length === 0) {
          return <span className="text-rbr-text-muted">-</span>;
        }
        return (
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            {allergens.slice(0, 2).map((allergen) => (
              <Badge
                key={allergen}
                variant="outline"
                className="text-xs border-yellow-500/30 text-yellow-500"
              >
                {allergen}
              </Badge>
            ))}
            {allergens.length > 2 && (
              <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-500">
                +{allergens.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'tags',
      header: 'Tag',
      cell: ({ row }) => {
        const recipe = row.original;
        const tags = [];
        if (recipe.isVegetarian) tags.push('Vegetariana');
        if (recipe.isVegan) tags.push('Vegana');
        if (recipe.isGlutenFree) tags.push('Senza Glutine');

        if (tags.length === 0) {
          return <span className="text-rbr-text-muted">-</span>;
        }

        return (
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            {tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-green-500/30 text-green-500"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isAvailable',
      header: 'Disponibile',
      cell: ({ row }) => (
        <Badge
          variant={row.original.isAvailable ? 'default' : 'secondary'}
          className={
            row.original.isAvailable
              ? 'bg-green-500/20 text-green-500 border-green-500/30'
              : ''
          }
        >
          {row.original.isAvailable ? 'Sì' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => {
        const recipe = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-rbr-text-primary hover:bg-rbr-dark-elevated"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Azioni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-rbr-dark-elevated border-rbr-border">
              <DropdownMenuLabel className="text-rbr-text-primary">Azioni</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-rbr-border" />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-navy/10 text-rbr-text-secondary"
                onClick={() => handleEditRecipe(recipe)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Modifica
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-rbr-red/10 text-rbr-red"
                onClick={() => handleDeleteRecipe(recipe.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Stats calculations
  const stats = {
    total: recipes.length,
    available: recipes.filter((r) => r.isAvailable).length,
    vegetarian: recipes.filter((r) => r.isVegetarian).length,
    vegan: recipes.filter((r) => r.isVegan).length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gestione Ricette" subtitle="Caricamento..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-racing-slide-up">
      <PageHeader
        title="Gestione Ricette"
        subtitle="Crea e gestisci le ricette del ristorante"
        action={
          <Button onClick={handleAddRecipe} className="bg-racing-red-gradient hover:opacity-90 gap-2">
            <Plus className="h-4 w-4" />
            Nuova Ricetta
          </Button>
        }
        breadcrumbs={[{ label: 'Cucina' }, { label: 'Ricette' }]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={ChefHat} label="Totale Ricette" value={stats.total} />
        <StatsCard icon={Check} label="Disponibili" value={stats.available} variant="accent" />
        <StatsCard icon={Leaf} label="Vegetariane" value={stats.vegetarian} variant="navy" />
        <StatsCard icon={Sprout} label="Vegane" value={stats.vegan} variant="accent" />
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={recipes}
        searchPlaceholder="Cerca ricetta per nome, categoria..."
        showExport={true}
        showColumnVisibility={true}
        pageSize={10}
      />

      {/* Recipe Form Dialog */}
      <RecipeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        recipe={selectedRecipe as any}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
