/**
 * Red Bull Racing - Recipe Card Component
 * Draggable recipe card for MenuBuilder sidebar
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Leaf, AlertTriangle } from 'lucide-react';

export interface RecipeCardData {
  id: string;
  name: string;
  category: string;
  hasNutrition: boolean;
  allergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  portionSize?: number;
  calories?: number;
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  isDragging?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  APPETIZER: '🥗',
  FIRST_COURSE: '🍝',
  SECOND_COURSE: '🍖',
  SIDE_DISH: '🥦',
  DESSERT: '🍰',
  BEVERAGE: '🥤',
  EXTRA: '✨',
};

const CATEGORY_LABELS: Record<string, string> = {
  APPETIZER: 'Antipasto',
  FIRST_COURSE: 'Primo',
  SECOND_COURSE: 'Secondo',
  SIDE_DISH: 'Contorno',
  DESSERT: 'Dessert',
  BEVERAGE: 'Bevanda',
  EXTRA: 'Extra',
};

export function RecipeCard({ recipe, isDragging = false }: RecipeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: recipe.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 bg-rbr-dark-elevated border-rbr-border hover:border-rbr-navy/50 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <GripVertical className="h-5 w-5 text-rbr-text-muted flex-shrink-0" />

        {/* Category Icon */}
        <div className="text-2xl flex-shrink-0">
          {CATEGORY_ICONS[recipe.category] || '🍽️'}
        </div>

        {/* Recipe Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-rbr-text-primary text-sm truncate">
            {recipe.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className="text-xs border-rbr-border-light text-rbr-text-secondary"
            >
              {CATEGORY_LABELS[recipe.category] || recipe.category}
            </Badge>

            {/* Vegan/Vegetarian Badge */}
            {recipe.isVegan && (
              <div className="flex items-center gap-1 text-green-500" title="Vegana">
                <Leaf className="h-3 w-3" />
              </div>
            )}
            {!recipe.isVegan && recipe.isVegetarian && (
              <div className="flex items-center gap-1 text-green-400" title="Vegetariana">
                <Leaf className="h-3 w-3" />
              </div>
            )}

            {/* Nutrition Status */}
            {recipe.hasNutrition && (
              <Badge
                variant="outline"
                className="text-xs border-green-500/30 text-green-500"
              >
                {recipe.calories ? `${recipe.calories} kcal` : 'Nutri ✓'}
              </Badge>
            )}
          </div>
        </div>

        {/* Allergen Warning */}
        {recipe.allergens && recipe.allergens.length > 0 && (
          <div className="flex-shrink-0" title={`Allergeni: ${recipe.allergens.join(', ')}`}>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
        )}
      </div>
    </Card>
  );
}
