export interface ComboboxOptionLike {
  id: number;
  label: string;
}

export type ActiveLookupLike = {
  isActive?: boolean;
};

export type ComboboxSelectionState<T extends ComboboxOptionLike> = {
  selectedId: number | null;
  selectedOption: T | null;
  query: string;
};

export function optionById<T extends ComboboxOptionLike>(
  options: ReadonlyArray<T>,
  id: number | null,
): T | null {
  if (id === null) {
    return null;
  }
  return options.find((option) => option.id === id) ?? null;
}

export function selectionFromValueChange<T extends ComboboxOptionLike>(
  option: T | null,
  current: ComboboxSelectionState<T>,
  config?: { preserveOnNull?: boolean },
): ComboboxSelectionState<T> {
  if (!option) {
    if (config?.preserveOnNull) {
      return current;
    }
    return {
      selectedId: null,
      selectedOption: null,
      query: current.query,
    };
  }

  return {
    selectedId: option.id,
    selectedOption: option,
    query: option.label,
  };
}

export function activeLookup<T extends ActiveLookupLike>(items: ReadonlyArray<T>): T[] {
  return items.filter((item) => item.isActive !== false);
}
