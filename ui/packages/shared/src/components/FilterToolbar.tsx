import React from 'react';
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

export type StatusFilter = 'all' | 'ready' | 'failed' | 'pending' | 'reconciling';

export interface FilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  /** Manual refresh — always shown; status tabs never trigger API calls */
  onRefresh: () => void;
  searchPlaceholder?: string;
}

const FILTERS: StatusFilter[] = ['all', 'ready', 'failed', 'pending', 'reconciling'];

export function FilterToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  searchPlaceholder = 'Filter by name…',
}: FilterToolbarProps): React.ReactElement {
  return (
    <Toolbar className="sc-filter-bar" id="sc-filter-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <SearchInput
            aria-label="Filter resources"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(_e, v) => onSearchChange(v)}
            onClear={() => onSearchChange('')}
          />
        </ToolbarItem>
        <ToolbarItem>
          <ToggleGroup aria-label="Status filter">
            {FILTERS.map((f) => (
              <ToggleGroupItem
                key={f}
                text={f}
                buttonId={`status-${f}`}
                isSelected={statusFilter === f}
                onChange={() => onStatusFilterChange(f)}
              />
            ))}
          </ToggleGroup>
        </ToolbarItem>
        <ToolbarItem align={{ default: 'alignRight' }}>
          <Button variant="secondary" onClick={onRefresh}>
            Refresh
          </Button>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
}
