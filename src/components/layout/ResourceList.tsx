import { Search } from "lucide-react";
import * as React from "react";
import { Input } from "../ui/Input";

export interface ResourceListProps<T> {
  items: T[];
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

/**
 * Reusable resource listing component with search, filter tabs, action slots, and empty state.
 * @param props - Resource items, slots for filtering/actions, and render callback.
 * @returns Generic catalog list.
 */
export function ResourceList<T>(props: ResourceListProps<T>) {
  const {
    items,
    isLoading = false,
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    filterSlot,
    actionSlot,
    renderItem,
    keyExtractor,
    emptyMessage = "No se encontraron elementos.",
  } = props;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          {onSearchChange !== undefined && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {filterSlot}
        </div>
        {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-medium">
          Cargando catálogo...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-none border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <React.Fragment key={keyExtractor(item)}>
              {renderItem(item)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
