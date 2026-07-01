import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Paper, IconButton, Chip } from '@mui/material';
import { Settings, Link, Lock, Api } from '@mui/icons-material';

const MenuNode = ({ data, selected }: NodeProps) => {
    const { label, route, permission, apiMethod, apiRoute, isModule } = data;

    return (
        <Paper
            elevation={selected ? 10 : 3}
            sx={{
                padding: '12px 16px',
                borderRadius: '16px',
                minWidth: '220px',
                background: isModule ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.95)',
                color: isModule ? '#fff' : 'inherit',
                backdropFilter: 'blur(10px)',
                border: selected ? '3px solid #3f51b5' : '1px solid rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                }
            }}
        >
            {!isModule && <Handle type="target" position={Position.Top} style={{ background: '#3f51b5', width: 10, height: 10, border: '2px solid white' }} />}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '0.5px' }}>
                    {label || 'Unnamed'}
                </Typography>
                <IconButton size="small" sx={{ color: isModule ? '#fff' : 'inherit', opacity: 0.8 }}>
                    <Settings sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {route && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Link sx={{ fontSize: 14, opacity: 0.7 }} />
                        <Typography variant="caption" sx={{ opacity: 0.9, fontFamily: 'monospace' }}>{route}</Typography>
                    </Box>
                )}
                {permission && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lock sx={{ fontSize: 14, opacity: 0.7 }} />
                        <Typography variant="caption" sx={{ opacity: 0.9, fontFamily: 'monospace' }}>{permission}</Typography>
                    </Box>
                )}
                {(apiMethod || apiRoute) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Api sx={{ fontSize: 14, opacity: 0.7 }} />
                        {apiMethod && <Chip label={apiMethod} size="small" sx={{ height: 16, fontSize: '9px', fontWeight: 'bold', bgcolor: isModule ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: 'inherit' }} />}
                        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '10px' }}>{apiRoute}</Typography>
                    </Box>
                )}
                {data.icon && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 'bold' }}>Icon:</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontFamily: 'monospace' }}>{data.icon}</Typography>
                    </Box>
                )}
            </Box>

            <Handle type="source" position={Position.Bottom} style={{ background: '#3f51b5', width: 10, height: 10, border: '2px solid white' }} />
        </Paper>
    );
};

export default memo(MenuNode);
