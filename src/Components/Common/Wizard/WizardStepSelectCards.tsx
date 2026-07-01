import type { ReactNode } from 'react';
import { Box, Typography, TextField, Chip, CircularProgress, Paper, InputAdornment } from '@mui/material';
import { Search as SearchIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import WizardStepHeader from './WizardStepHeader';
import { PRIMARY, fieldSx } from './setupWizardTheme';

export type WizardSelectCardItem = {
    id: string;
    name: string;
    description?: string;
    badgeLabel?: string;
    /** e.g. module group label shown on role/plan module pickers */
    groupLabel?: string | null;
};

export interface WizardStepSelectCardsProps {
    showHeader?: boolean;
    icon?: ReactNode;
    title?: string;
    description?: string;
    searchPlaceholder?: string;
    search: string;
    onSearchChange: (v: string) => void;
    selectedIds: Set<string>;
    onClearSelection?: () => void;
    filteredItems: WizardSelectCardItem[];
    onToggleItem: (id: string) => void;
    onToggleAll: () => void;
    selectionCountLabel?: (count: number) => string;
    emptySearchMessage?: string;
    loading?: boolean;
    /** When true, search field is omitted (e.g. rendered in a parent toolbar). */
    hideSearch?: boolean;
    /** Max height of the card grid; enables vertical scroll inside the box only. */
    gridMaxHeight?: number | string;
}

const WizardStepSelectCards = ({
    showHeader = true,
    icon,
    title = 'Select Items',
    description,
    searchPlaceholder = 'Search…',
    search,
    onSearchChange,
    selectedIds,
    onClearSelection,
    filteredItems,
    onToggleItem,
    onToggleAll,
    selectionCountLabel = (count) => `${count} selected`,
    emptySearchMessage = 'No items match your search',
    loading = false,
    hideSearch = false,
    gridMaxHeight,
}: WizardStepSelectCardsProps) => (
    <Box>
        {showHeader && icon && title && (
            <WizardStepHeader icon={icon} title={title} description={description} />
        )}

        {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={22} />
            </Box>
        )}

        <Box
            sx={{
                display: 'flex',
                justifyContent: hideSearch ? 'flex-end' : 'space-between',
                alignItems: 'center',
                mb: 2,
                gap: 2,
                flexWrap: 'wrap',
            }}
        >
            {!hideSearch && (
                <TextField
                    size="small"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    sx={{ width: 260, ...fieldSx }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedIds.size > 0 && onClearSelection && (
                    <Chip
                        label={selectionCountLabel(selectedIds.size)}
                        size="small"
                        color="primary"
                        onDelete={onClearSelection}
                    />
                )}
                {filteredItems.length > 0 && (
                    <Typography
                        variant="caption"
                        color="primary"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={onToggleAll}
                    >
                        {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                    </Typography>
                )}
            </Box>
        </Box>

        <Box
            sx={{
                ...(gridMaxHeight != null
                    ? {
                          maxHeight: gridMaxHeight,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          pr: 0.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          p: 1.5,
                      }
                    : {}),
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        md: 'repeat(3, minmax(0, 1fr))',
                    },
                }}
            >
            {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                    <Paper
                        key={item.id}
                        variant="outlined"
                        onClick={() => onToggleItem(item.id)}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.18s ease',
                            borderColor: isSelected ? PRIMARY : '#ebebeb',
                            borderWidth: isSelected ? 2 : 1,
                            bgcolor: isSelected ? 'rgba(102,126,234,0.05)' : '#fff',
                            boxShadow: isSelected ? '0 0 0 3px rgba(102,126,234,0.12)' : 'none',
                            '&:hover': {
                                borderColor: PRIMARY,
                                bgcolor: 'rgba(102,126,234,0.04)',
                            },
                        }}
                    >
                        {isSelected && (
                            <CheckCircleIcon
                                sx={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    fontSize: 20,
                                    color: PRIMARY,
                                }}
                            />
                        )}

                        <Typography variant="subtitle2" fontWeight={700} color={isSelected ? PRIMARY : 'text.primary'}>
                            {item.name}
                        </Typography>
                        {item.description ? (
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                                {item.description}
                            </Typography>
                        ) : null}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 0.75,
                                mt: 1,
                                minWidth: 0,
                            }}
                        >
                            <Chip
                                label={
                                    item.groupLabel != null && item.groupLabel !== ''
                                        ? item.groupLabel
                                        : 'No group'
                                }
                                size="small"
                                variant={
                                    item.groupLabel != null && item.groupLabel !== ''
                                        ? 'filled'
                                        : 'outlined'
                                }
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    maxWidth: '58%',
                                    flexShrink: 1,
                                    '& .MuiChip-label': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    },
                                    ...(item.groupLabel != null && item.groupLabel !== ''
                                        ? {
                                              bgcolor: 'rgba(102,126,234,0.08)',
                                              color: PRIMARY,
                                              border: '1px solid',
                                              borderColor: 'rgba(102,126,234,0.25)',
                                          }
                                        : { color: 'text.disabled' }),
                                }}
                            />
                            {item.badgeLabel ? (
                                <Chip
                                    label={item.badgeLabel}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        flexShrink: 0,
                                        borderColor: isSelected ? PRIMARY : undefined,
                                        color: isSelected ? PRIMARY : undefined,
                                    }}
                                />
                            ) : null}
                        </Box>
                    </Paper>
                );
            })}
            </Box>
        </Box>

        {filteredItems.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                <Typography variant="body2">{emptySearchMessage}</Typography>
            </Box>
        )}
    </Box>
);

export default WizardStepSelectCards;
