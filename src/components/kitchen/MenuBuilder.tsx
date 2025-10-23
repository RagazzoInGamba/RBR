/**
 * Red Bull Racing - Menu Builder Component
 * Drag-and-drop interface for building multi-course menus
 */

'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecipeCard, RecipeCardData } from './RecipeCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface SelectedRecipe {
  recipeId: string;
  recipeName: string;
  quantity: number;
  category: string;
}

export interface MenuCourses {
  antipasto: SelectedRecipe[];
  primo: SelectedRecipe[];
  secondo: SelectedRecipe[];
  contorno: SelectedRecipe[];
  dessert: SelectedRecipe[];
  extra: SelectedRecipe[];
}

interface MenuBuilderProps {
  initialCourses?: MenuCourses;
  onChange?: (courses: MenuCourses) => void;
}

const COURSE_KEYS = ['antipasto', 'primo', 'secondo', 'contorno', 'dessert', 'extra'] as const;
type CourseKey = typeof COURSE_KEYS[number];

const COURSE_LABELS: Record<CourseKey, string> = {
  antipasto: 'Antipasto',
  primo: 'Primo',
  secondo: 'Secondo',
  contorno: 'Contorno',
  dessert: 'Dessert',
  extra: 'Extra',
};

// Mapping from Prisma RecipeCategory to MenuCourses keys
// Reserved for future category mapping feature
// const CATEGORY_TO_COURSE: Record<string, CourseKey> = {
//   APPETIZER: 'antipasto',
//   FIRST_COURSE: 'primo',
//   SECOND_COURSE: 'secondo',
//   SIDE_DISH: 'contorno',
//   DESSERT: 'dessert',
//   EXTRA: 'extra',
//   BEVERAGE: 'extra',
// };

export function MenuBuilder({ initialCourses, onChange }: MenuBuilderProps) {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeId, setActiveId] = useState<string | null>(null);

  const [selectedRecipes, setSelectedRecipes] = useState<MenuCourses>(
    initialCourses || {
      antipasto: [],
      primo: [],
      secondo: [],
      contorno: [],
      dessert: [],
      extra: [],
    }
  );

  // Fetch recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/kitchen/recipes?available=true');
        if (!response.ok) throw new Error('Failed to fetch recipes');
        const data = await response.json();

        const formattedRecipes: RecipeCardData[] = (data.recipes || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          hasNutrition: !!(r.nutritionalValues && Object.keys(r.nutritionalValues).length > 0),
          allergens: r.allergens || [],
          isVegetarian: r.isVegetarian,
          isVegan: r.isVegan,
          portionSize: r.portionSize,
          calories: r.nutritionalValues?.energy_kcal || r.calories,
        }));

        setRecipes(formattedRecipes);
      } catch (error) {
        toast.error('Errore nel caricamento delle ricette');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Notify parent of changes
  useEffect(() => {
    onChange?.(selectedRecipes);
  }, [selectedRecipes, onChange]);

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || recipe.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Get the recipe being dragged
    const recipe = recipes.find((r) => r.id === active.id);
    if (!recipe) return;

    // Determine target course from over.id
    const targetCourse = over.id as CourseKey;
    if (!COURSE_KEYS.includes(targetCourse)) return;

    // Check if recipe already exists in target course
    const alreadyAdded = selectedRecipes[targetCourse].some(
      (r) => r.recipeId === recipe.id
    );

    if (alreadyAdded) {
      toast.warning('Ricetta già aggiunta a questa portata');
      return;
    }

    // Add recipe to target course
    const newSelectedRecipe: SelectedRecipe = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      quantity: 1,
      category: recipe.category,
    };

    setSelectedRecipes((prev) => ({
      ...prev,
      [targetCourse]: [...prev[targetCourse], newSelectedRecipe],
    }));

    toast.success(`${recipe.name} aggiunto a ${COURSE_LABELS[targetCourse]}`);
  };

  const handleQuantityChange = (course: CourseKey, recipeId: string, delta: number) => {
    setSelectedRecipes((prev) => ({
      ...prev,
      [course]: prev[course].map((r) =>
        r.recipeId === recipeId
          ? { ...r, quantity: Math.max(1, r.quantity + delta) }
          : r
      ),
    }));
  };

  const handleRemoveRecipe = (course: CourseKey, recipeId: string) => {
    setSelectedRecipes((prev) => ({
      ...prev,
      [course]: prev[course].filter((r) => r.recipeId !== recipeId),
    }));
  };

  const activeRecipe = activeId ? recipes.find((r) => r.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR - Recipe List */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 bg-rbr-dark-elevated border-rbr-border">
            <h3 className="text-lg font-semibold text-rbr-text-primary mb-4">
              Ricette Disponibili
            </h3>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-rbr-text-muted" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca ricetta..."
                className="pl-10 bg-rbr-dark border-rbr-border-light text-rbr-text-primary"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-rbr-dark border-rbr-border text-rbr-text-primary mb-4">
                <SelectValue placeholder="Filtra per categoria" />
              </SelectTrigger>
              <SelectContent className="bg-rbr-dark-elevated border-rbr-border">
                <SelectItem value="ALL">Tutte le categorie</SelectItem>
                <SelectItem value="APPETIZER">Antipasti</SelectItem>
                <SelectItem value="FIRST_COURSE">Primi</SelectItem>
                <SelectItem value="SECOND_COURSE">Secondi</SelectItem>
                <SelectItem value="SIDE_DISH">Contorni</SelectItem>
                <SelectItem value="DESSERT">Dessert</SelectItem>
                <SelectItem value="EXTRA">Extra</SelectItem>
              </SelectContent>
            </Select>

            {/* Recipe List */}
            <ScrollArea className="h-[600px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-rbr-red" />
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-12 text-rbr-text-muted">
                  Nessuna ricetta trovata
                </div>
              ) : (
                <SortableContext
                  items={filteredRecipes.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {filteredRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                </SortableContext>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* RIGHT - Drop Zones (6 columns) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COURSE_KEYS.map((courseKey) => (
            <DropZone
              key={courseKey}
              courseKey={courseKey}
              label={COURSE_LABELS[courseKey]}
              selectedRecipes={selectedRecipes[courseKey]}
              onQuantityChange={(recipeId, delta) =>
                handleQuantityChange(courseKey, recipeId, delta)
              }
              onRemove={(recipeId) => handleRemoveRecipe(courseKey, recipeId)}
            />
          ))}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeRecipe ? <RecipeCard recipe={activeRecipe} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Drop Zone Component
interface DropZoneProps {
  courseKey: CourseKey;
  label: string;
  selectedRecipes: SelectedRecipe[];
  onQuantityChange: (recipeId: string, delta: number) => void;
  onRemove: (recipeId: string) => void;
}

function DropZone({
  courseKey,
  label,
  selectedRecipes,
  onQuantityChange,
  onRemove,
}: DropZoneProps) {
  return (
    <Card
      id={courseKey}
      className="p-4 bg-rbr-dark border-rbr-border-light min-h-[300px] transition-colors hover:border-rbr-navy/50"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-rbr-text-primary">{label}</h4>
        <Badge variant="outline" className="text-rbr-text-secondary">
          {selectedRecipes.length}
        </Badge>
      </div>

      <ScrollArea className="h-[250px]">
        <div className="space-y-2">
          {selectedRecipes.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-rbr-border rounded-lg">
              <p className="text-rbr-text-muted text-sm text-center px-4">
                Trascina qui le ricette
              </p>
            </div>
          ) : (
            selectedRecipes.map((recipe) => (
              <Card
                key={recipe.recipeId}
                className="p-3 bg-rbr-dark-elevated border-rbr-border-light"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rbr-text-primary truncate">
                      {recipe.recipeName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 border-rbr-border"
                        onClick={() => onQuantityChange(recipe.recipeId, -1)}
                        disabled={recipe.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm text-rbr-text-primary min-w-[20px] text-center">
                        {recipe.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 border-rbr-border"
                        onClick={() => onQuantityChange(recipe.recipeId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-rbr-red hover:bg-rbr-red/10"
                    onClick={() => onRemove(recipe.recipeId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
