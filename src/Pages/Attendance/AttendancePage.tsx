
import { useState, useEffect, useMemo } from 'react';
import {
    Box, Container, Paper, Typography, Stack, Select, MenuItem,
    FormControl, InputLabel, Table, TableBody, TableCell, TableHead,
    TableRow, TableContainer, Chip, Skeleton, Alert, Tooltip,
} from '@mui/material';
import { EventAvailable as AttendanceIcon } from '@mui/icons-material';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import { useToast } from '../../Utils/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { formatUtcToLocalTime } from '../../Utils/attendanceTime';

interface Project {
    id: string;
    name: string;
}

interface EmployeeRow {
    employeeId: string;
    days: Record<number, { status: string; checkIn?: string; checkOut?: string }>;
}

interface MonthlyData {
    month: string;
    daysInMonth: number;
    users: EmployeeRow[];
}

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    present: 'success',
    absent: 'error',
    halfDay: 'warning',
    late: 'info',
    leave: 'default',
};

const STATUS_LABELS: Record<string, string> = {
    present: 'P',
    absent: 'A',
    halfDay: 'H',
    late: 'L',
    leave: 'LV',
};

const currentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const AttendancePage = () => {
    usePageTitle('Attendance');
    const { showError } = useToast();

    const [projects, setProjects] = useState<Project[]>([]);
    const [projectId, setProjectId] = useState('');
    const [month, setMonth] = useState(currentMonth());
    const [data, setData] = useState<MonthlyData | null>(null);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        apiInstance.get(getApiUrl('getProjects'))
            .then(r => {
                const list = r.data?.data || [];
                setProjects(list);
                if (list.length > 0) setProjectId(list[0].id);
            })
            .catch(() => showError('Failed to load projects'))
            .finally(() => setLoadingProjects(false));
    }, []);

    useEffect(() => {
        if (!projectId) return;
        setLoadingData(true);

        apiInstance.get(getApiUrl('getProjectAttendanceMonthly', { projectId }), { params: { month } })
            .then(r => setData(r.data?.data || null))
            .catch(() => showError('Failed to load attendance data'))
            .finally(() => setLoadingData(false));
    }, [projectId, month]);

    const monthOptions = useMemo(() => {
        const options: string[] = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        return options;
    }, []);

    const dayHeaders = useMemo(() => {
        if (!data) return [];
        return Array.from({ length: data.daysInMonth }, (_, i) => i + 1);
    }, [data]);

    return (
        <>
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Project</InputLabel>
                        <Select
                            label="Project"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            disabled={loadingProjects}
                        >
                            {projects.map(p => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Month</InputLabel>
                        <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
                            {monthOptions.map(m => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Monthly Matrix — {month}</Typography>
                </Box>
                {loadingData ? (
                    <Box sx={{ p: 3 }}><Skeleton height={200} /></Box>
                ) : !data || data.users.length === 0 ? (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="info">No attendance records for this month.</Alert>
                    </Box>
                ) : (
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Employee ID</TableCell>
                                    {dayHeaders.map(d => (
                                        <TableCell key={d} align="center" sx={{ fontWeight: 600, px: 0.5, minWidth: 32 }}>{d}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.users.map(user => (
                                    <TableRow key={user.employeeId} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>{user.employeeId}</Typography>
                                        </TableCell>
                                        {dayHeaders.map(d => {
                                            const record = user.days[d];
                                            if (!record) return <TableCell key={d} align="center" />;
                                            return (
                                                <TableCell key={d} align="center" sx={{ px: 0.5 }}>
                                                    <Tooltip
                                                        title={`${record.status}${record.checkIn ? ` | In: ${formatUtcToLocalTime(record.checkIn)}` : ''}${record.checkOut ? ` | Out: ${formatUtcToLocalTime(record.checkOut)}` : ''}`}
                                                    >
                                                        <Chip
                                                            label={STATUS_LABELS[record.status] || record.status}
                                                            size="small"
                                                            color={STATUS_COLORS[record.status] || 'default'}
                                                            sx={{ minWidth: 28, height: 22, fontSize: '0.7rem' }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </>
    );
};

export default AttendancePage;
