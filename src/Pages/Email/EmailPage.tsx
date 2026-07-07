import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Button, Chip, CircularProgress, Divider, FormControl,
    IconButton, InputLabel, MenuItem, Paper, Select, Stack,
    Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import {
    Send as SendIcon,
    Refresh as RefreshIcon,
    CheckCircle as SentIcon,
    ErrorOutline as FailedIcon,
    Schedule as PendingIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import { colors } from '../../Utils/colors';
import { useToast } from '../../Utils/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import {
    sendEmailService,
    getEmailLogsService,
    type EmailLog,
    type EmailStatus,
    type SendEmailPayload,
} from '../../Services/ApiServices/emailServices';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EmailStatus, { label: string; color: string; bg: string; Icon: typeof SentIcon }> = {
    sent:    { label: 'Sent',    color: colors.success.main,  bg: colors.success.background,  Icon: SentIcon    },
    failed:  { label: 'Failed',  color: colors.error.main,    bg: colors.error.background,    Icon: FailedIcon  },
    pending: { label: 'Pending', color: colors.warning.main,  bg: colors.warning.background,  Icon: PendingIcon },
};

const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : '—';

const parseAddresses = (raw: string): string[] =>
    raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

// ── Log row ───────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: EmailLog }) {
    const [open, setOpen] = useState(false);
    const cfg = STATUS_CONFIG[log.status];

    return (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 1 }}>
            <Box
                sx={{
                    px: 2, py: 1.25, display: 'flex', alignItems: 'center',
                    gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: colors.background.hover },
                }}
                onClick={() => setOpen(o => !o)}
            >
                <cfg.Icon sx={{ fontSize: 16, color: cfg.color, flexShrink: 0 }} />

                <Box flex={1} minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography fontSize={13} fontWeight={600} noWrap>
                            {log.subject}
                        </Typography>
                        <Chip
                            label={cfg.label}
                            size="small"
                            sx={{ height: 18, fontSize: 10, fontWeight: 700,
                                  bgcolor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}
                        />
                        <Chip
                            label={log.providerName}
                            size="small"
                            sx={{ height: 18, fontSize: 10,
                                  bgcolor: colors.primary.rgba.light, color: colors.primary.main }}
                        />
                    </Stack>
                    <Typography fontSize={12} color="text.secondary" noWrap>
                        To: {log.to.join(', ')}
                    </Typography>
                </Box>

                <Typography fontSize={11} color="text.secondary" sx={{ flexShrink: 0 }}>
                    {fmt(log.sentAt ?? log.createdAt)}
                </Typography>
                <IconButton size="small" sx={{ flexShrink: 0 }}>
                    {open ? <CollapseIcon sx={{ fontSize: 16 }} /> : <ExpandIcon sx={{ fontSize: 16 }} />}
                </IconButton>
            </Box>

            {open && (
                <Box sx={{ px: 2, pb: 2, pt: 0.5, bgcolor: colors.background.secondary, borderTop: `1px solid ${colors.border.light}` }}>
                    <Stack spacing={0.5}>
                        {[
                            ['From',       log.from],
                            ['To',         log.to.join(', ')],
                            log.cc?.length  ? ['CC',  log.cc.join(', ')]  : null,
                            log.bcc?.length ? ['BCC', log.bcc.join(', ')] : null,
                            log.replyTo     ? ['Reply-To', log.replyTo]   : null,
                            ['Provider',   `${log.providerLabel} (${log.providerName})`],
                            log.providerMessageId ? ['Message ID', log.providerMessageId] : null,
                            ['Sent at',    fmt(log.sentAt)],
                            ['Created at', fmt(log.createdAt)],
                            log.entityType  ? ['Entity', `${log.entityType} · ${log.entityId}`] : null,
                            log.errorMessage ? ['Error', log.errorMessage] : null,
                        ].filter((r): r is string[] => r !== null).map(([k, v]) => (
                            <Stack key={k} direction="row" spacing={1} alignItems="flex-start">
                                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                                    sx={{ minWidth: 90, flexShrink: 0 }}>{k}:</Typography>
                                <Typography fontSize={12}
                                    sx={{ color: k === 'Error' ? colors.error.main : 'text.secondary',
                                          wordBreak: 'break-all' }}>{v}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}

// ── Send form ─────────────────────────────────────────────────────────────────

function SendForm({ projectId, onSent }: { projectId: string; onSent: () => void }) {
    const { showSuccess, showError } = useToast();

    const [to, setTo]         = useState('');
    const [cc, setCc]         = useState('');
    const [bcc, setBcc]       = useState('');
    const [from, setFrom]     = useState('');
    const [replyTo, setReplyTo] = useState('');
    const [subject, setSubject] = useState('');
    const [bodyType, setBodyType] = useState<'html' | 'text'>('html');
    const [body, setBody]     = useState('');
    const [entity, setEntity] = useState('');
    const [entityId, setEntityId] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        const toList = parseAddresses(to);
        if (!toList.length) { showError('"To" is required'); return; }
        if (!subject.trim()) { showError('"Subject" is required'); return; }
        if (!body.trim())    { showError('Email body is required'); return; }

        const payload: SendEmailPayload = {
            to: toList,
            subject: subject.trim(),
            [bodyType]: body,
        };
        if (from.trim())    payload.from    = from.trim();
        if (replyTo.trim()) payload.replyTo = replyTo.trim();
        const ccList  = parseAddresses(cc);
        const bccList = parseAddresses(bcc);
        if (ccList.length)  payload.cc  = ccList;
        if (bccList.length) payload.bcc = bccList;
        if (entity.trim())  payload.entityType = entity.trim();
        if (entityId.trim()) payload.entityId = entityId.trim();

        setSending(true);
        try {
            const res = await sendEmailService(projectId, payload);
            if (res.success === 200) {
                showSuccess('Email sent successfully');
                setTo(''); setCc(''); setBcc(''); setFrom(''); setReplyTo('');
                setSubject(''); setBody(''); setEntity(''); setEntityId('');
                onSent();
            } else {
                showError(res.message || 'Failed to send email');
            }
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            showError(err?.response?.data?.message || 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
            <Stack spacing={2}>
                {/* To / CC / BCC */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                        label="To *"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="user@example.com, other@example.com"
                        helperText="Comma or newline separated"
                    />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField label="CC"  value={cc}  onChange={e => setCc(e.target.value)}  size="small" fullWidth placeholder="cc@example.com" />
                    <TextField label="BCC" value={bcc} onChange={e => setBcc(e.target.value)} size="small" fullWidth placeholder="bcc@example.com" />
                </Stack>

                <Divider />

                {/* From / Reply-To */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                        label="From"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Name <noreply@yourdomain.com> (uses provider default if blank)"
                    />
                    <TextField
                        label="Reply-To"
                        value={replyTo}
                        onChange={e => setReplyTo(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="support@yourdomain.com"
                    />
                </Stack>

                {/* Subject */}
                <TextField
                    label="Subject *"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    size="small"
                    fullWidth
                />

                {/* Body type + body */}
                <Stack direction="row" alignItems="center" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Body type</InputLabel>
                        <Select value={bodyType} label="Body type"
                            onChange={e => setBodyType(e.target.value as 'html' | 'text')}>
                            <MenuItem value="html">HTML</MenuItem>
                            <MenuItem value="text">Plain text</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography fontSize={12} color="text.secondary">
                        {bodyType === 'html' ? 'Write HTML markup' : 'Write plain text'}
                    </Typography>
                </Stack>

                <TextField
                    label="Body *"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    multiline
                    rows={6}
                    fullWidth
                    placeholder={bodyType === 'html'
                        ? '<p>Hello <b>World</b></p>'
                        : 'Hello World'}
                    sx={{ '& .MuiInputBase-root': { fontFamily: bodyType === 'html' ? 'monospace' : 'inherit', fontSize: 13 } }}
                />

                <Divider />

                {/* Entity tagging (optional) */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                    <TextField
                        label="Entity type"
                        value={entity}
                        onChange={e => setEntity(e.target.value)}
                        size="small"
                        sx={{ minWidth: 160 }}
                        placeholder="invoice, order, user…"
                    />
                    <TextField
                        label="Entity ID"
                        value={entityId}
                        onChange={e => setEntityId(e.target.value)}
                        size="small"
                        sx={{ minWidth: 200 }}
                        placeholder="inv_abc123"
                    />
                    <Typography fontSize={11} color="text.secondary" sx={{ flex: 1 }}>
                        Optional — tags this send in the audit log for easier filtering
                    </Typography>
                </Stack>

                <Box display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={sending ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <SendIcon />}
                        disabled={sending}
                        onClick={handleSend}
                        sx={{ background: colors.primary.gradient, px: 3 }}
                    >
                        {sending ? 'Sending…' : 'Send Email'}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}

// ── Logs panel ────────────────────────────────────────────────────────────────

function LogsPanel({ projectId, refreshKey }: { projectId: string; refreshKey: number }) {
    const { showError } = useToast();
    const [logs, setLogs]         = useState<EmailLog[]>([]);
    const [loading, setLoading]   = useState(true);
    const [statusFilter, setStatusFilter] = useState<EmailStatus | ''>('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getEmailLogsService(projectId, {
                status: statusFilter as EmailStatus || undefined,
                limit: 50,
            });
            if (res.success === 200) setLogs(res.data ?? []);
        } catch { showError('Failed to load email logs'); }
        finally { setLoading(false); }
    }, [projectId, statusFilter, refreshKey]);

    useEffect(() => { load(); }, [load]);

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Filter status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Filter status"
                        onChange={e => setStatusFilter(e.target.value as EmailStatus | '')}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="sent">Sent</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                </FormControl>
                <Tooltip title="Refresh logs">
                    <IconButton size="small" onClick={load} disabled={loading}>
                        {loading ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Tooltip>
                <Typography fontSize={12} color="text.secondary">
                    {logs.length} record{logs.length !== 1 ? 's' : ''}
                </Typography>
            </Stack>

            {loading ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress size={28} />
                </Box>
            ) : logs.length === 0 ? (
                <Box
                    display="flex" flexDirection="column" alignItems="center"
                    justifyContent="center" py={8} gap={1}
                >
                    <EmailIcon sx={{ fontSize: 40, color: colors.text.disabled }} />
                    <Typography fontSize={13} color="text.secondary">
                        No email logs yet
                    </Typography>
                </Box>
            ) : (
                logs.map(log => <LogRow key={log.id} log={log} />)
            )}
        </Box>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EmailPage() {
    usePageTitle('Email');
    const { id: projectId } = useParams<{ id: string }>();

    const [tab, setTab]           = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSent = () => {
        setRefreshKey(k => k + 1);
        setTab(1);
    };

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
                Send transactional emails through the configured email provider for this project.
                All sends are logged below.
            </Typography>

            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 3, borderBottom: `1px solid ${colors.border.light}` }}
            >
                <Tab label="Compose" sx={{ fontSize: 13, textTransform: 'none', fontWeight: 600 }} />
                <Tab label="Sent Logs" sx={{ fontSize: 13, textTransform: 'none', fontWeight: 600 }} />
            </Tabs>

            {tab === 0 && (
                <SendForm projectId={projectId!} onSent={handleSent} />
            )}
            {tab === 1 && (
                <LogsPanel projectId={projectId!} refreshKey={refreshKey} />
            )}
        </Box>
    );
}
