export const STATUS_CYCLE: Record<string, string> = {
  DRAFT: 'PUBLIC',
  PUBLIC: 'PRIVATE',
  PRIVATE: 'DRAFT',
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLIC: 'Public',
  PRIVATE: 'Private',
};

export const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'bg-bg-2 text-text-3 border border-border',
  PUBLIC:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700',
  PRIVATE:
    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700',
};
