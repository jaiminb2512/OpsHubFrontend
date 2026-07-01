import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box,
    Checkbox,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    CircularProgress,
    Button,
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { getModulesService } from '../../Services/ApiServices/moduleServices';

const PRIMARY = '#4361ee';
const PAGE_SIZE = 10;

export type ModuleOption = { id: string; name: string; description?: string | null };

export interface ModuleCheckboxListProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    /** Pre-seeded module names for selected chips (avoids blank chips before first fetch) */
    initialModules?: { id: string; name: string }[];
    /** When provided, only fetch modules belonging to this project */
    projectId?: string;
    title?: string;
    maxHeight?: number;
}

const ModuleCheckboxList: React.FC<ModuleCheckboxListProps> = ({
    selectedIds,
    onChange,
    initialModules,
    projectId,
    title = 'Linked Modules',
    maxHeight = 360,
}) => {
    const [modules, setModules] = useState<ModuleOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Cache selected module names so chips render even when those modules aren't on the current page
    const selectedCacheRef = useRef<Map<string, string>>(new Map());

    // Seed cache from initialModules
    useEffect(() => {
        if (initialModules?.length) {
            initialModules.forEach((m) => selectedCacheRef.current.set(m.id, m.name));
        }
    }, [initialModules]);

    const fetchModules = useCallback(async (p: number, q: string, pid?: string) => {
        setLoading(true);
        try {
            const res = await getModulesService({
                page: p,
                limit: PAGE_SIZE,
                ...(q ? { search: q, matchType: 'like' } : {}),
                ...(pid ? { projectId: pid } : {}),
            });
            if (res?.success === 200) {
                const rows: ModuleOption[] = (res.data?.data ?? []).map((m: any) => ({
                    id: m.id,
                    name: m.label || m.name || m.id,
                    description: m.description ?? null,
                }));
                setModules(rows);
                setTotalPages(res.data?.totalPages ?? 1);
                setTotal(res.data?.total ?? 0);
                // Update cache
                rows.forEach((m) => selectedCacheRef.current.set(m.id, m.name));
            }
        } catch {
            // parent can show error
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset and refetch when projectId or search changes
    useEffect(() => {
        if (!projectId) {
            setModules([]);
            setTotal(0);
            setTotalPages(1);
            return;
        }
        const timer = setTimeout(() => {
            setPage(1);
            fetchModules(1, search, projectId);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, projectId, fetchModules]);

    // Page change (only when projectId is set)
    useEffect(() => {
        if (!projectId) return;
        fetchModules(page, search, projectId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const selectedNames = useMemo(() => {
        const cache = selectedCacheRef.current;
        // Also pull from current page modules
        modules.forEach((m) => cache.set(m.id, m.name));
        return selectedIds.map((id) => ({ id, name: cache.get(id) ?? id }));
    }, [selectedIds, modules]);

    const toggle = (id: string) => {
        onChange(
            selectedIds.includes(id)
                ? selectedIds.filter((x) => x !== id)
                : [...selectedIds, id]
        );
    };

    const remove = (id: string) => {
        onChange(selectedIds.filter((x) => x !== id));
    };

    return (
        <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    bgcolor: 'grey.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography fontWeight={700} fontSize={15}>
                    {title}
                </Typography>
                <Chip
                    label={`${selectedIds.length} selected`}
                    size="small"
                    color={selectedIds.length > 0 ? 'primary' : 'default'}
                    variant="outlined"
                />
            </Box>

            {/* Selected chips */}
            {selectedNames.length > 0 && (
                <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {selectedNames.map((m) => (
                            <Chip
                                key={m.id}
                                label={m.name}
                                size="small"
                                color="primary"
                                onDelete={() => remove(m.id)}
                                deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                                sx={{ fontWeight: 500 }}
                            />
                        ))}
                    </Box>
                    <Divider sx={{ mt: 1.5 }} />
                </Box>
            )}

            {/* Search */}
            <Box sx={{ px: 3, pt: selectedNames.length > 0 ? 1 : 2, pb: 1 }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search modules..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                            </InputAdornment>
                        ),
                        endAdornment: search ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearch('')}>
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                />
            </Box>

            {/* List */}
            <Box sx={{ maxHeight, overflowY: 'auto', px: 1, pb: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : modules.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
                        {!projectId
                            ? 'Select a project to load its modules'
                            : search
                            ? 'No modules match your search'
                            : 'No modules available for this project'}
                    </Typography>
                ) : (
                    modules.map((m) => {
                        const checked = selectedIds.includes(m.id);
                        return (
                            <Box
                                key={m.id}
                                onClick={() => toggle(m.id)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    px: 2,
                                    py: 0.75,
                                    mx: 0.5,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    bgcolor: checked ? `${PRIMARY}08` : 'transparent',
                                    '&:hover': { bgcolor: checked ? `${PRIMARY}14` : 'action.hover' },
                                }}
                            >
                                <Checkbox
                                    checked={checked}
                                    size="small"
                                    tabIndex={-1}
                                    disableRipple
                                    sx={{ p: 0, mt: 0.25, color: checked ? PRIMARY : 'text.disabled' }}
                                />
                                <Box>
                                    <Typography variant="body2" fontWeight={checked ? 600 : 400}>
                                        {m.name}
                                    </Typography>
                                    {m.description && (
                                        <Typography variant="caption" color="text.secondary">
                                            {m.description}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 3,
                        py: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        {total} module{total !== 1 ? 's' : ''} &middot; Page {page} of {totalPages}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            sx={{ minWidth: 0, px: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 12 }}
                        >
                            Prev
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            sx={{ minWidth: 0, px: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 12 }}
                        >
                            Next
                        </Button>
                    </Box>
                </Box>
            )}
        </Paper>
    );
};

export default ModuleCheckboxList;
