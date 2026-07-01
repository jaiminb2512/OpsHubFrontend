import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { TablePagination, useMediaQuery } from '@mui/material';

const CustomTablePagination = styled(TablePagination)(({ theme }) => ({
    width: '100%',
    borderTop: `1px solid ${theme.palette.divider}`,
    '& .MuiTablePagination-toolbar': {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        rowGap: theme.spacing(1),
        columnGap: theme.spacing(1),
        padding: theme.spacing(1, 1),
        minHeight: 56,
        [theme.breakpoints.up('sm')]: {
            padding: theme.spacing(1.5, 2),
        },
    },
    '& .MuiTablePagination-spacer': {
        display: 'none',
    },
    '& .MuiTablePagination-selectLabel': {
        margin: 0,
        fontWeight: 600,
        fontSize: '0.8125rem',
        [theme.breakpoints.up('sm')]: {
            fontSize: '0.875rem',
        },
        [theme.breakpoints.down('sm')]: {
            display: 'none !important',
        },
    },
    '& .MuiTablePagination-select': {
        fontFamily: 'inherit',
        padding: '4px 8px',
        border: 'none',
        borderRadius: 0,
        backgroundColor: 'transparent',
        color: theme.palette.text.primary,
        transition: 'all 100ms ease',
        '&:hover': {
            backgroundColor: 'transparent',
        },
        '&:focus': {
            backgroundColor: 'transparent',
            outline: 'none',
        },
    },
    '& .MuiTablePagination-input, & .MuiTablePagination-selectRoot': {
        [theme.breakpoints.down('sm')]: {
            display: 'none !important',
        },
    },
    '& .MuiTablePagination-displayedRows': {
        margin: 0,
        fontWeight: 500,
        fontSize: '0.8125rem',
        [theme.breakpoints.up('sm')]: {
            fontSize: '0.875rem',
            marginLeft: 'auto',
        },
    },
    '& .MuiTablePagination-actions': {
        display: 'flex',
        gap: 4,
        marginLeft: theme.spacing(1),
        [theme.breakpoints.up('sm')]: {
            gap: 6,
            marginLeft: theme.spacing(2),
        },
        '& button': {
            display: 'flex',
            alignItems: 'center',
            padding: 6,
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
            transition: 'all 100ms ease',
            [theme.breakpoints.up('sm')]: {
                padding: 8,
            },
            '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.main,
            },
            '&:disabled': {
                opacity: 0.3,
                '&:hover': {
                    backgroundColor: 'transparent',
                    borderColor: theme.palette.divider,
                },
            },
            '& svg': {
                fontSize: 18,
                [theme.breakpoints.up('sm')]: {
                    fontSize: 20,
                },
            },
        },
    },
}));

interface CustomPaginationProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function CustomTablePaginationComponent({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
}: CustomPaginationProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <CustomTablePagination
            count={count}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={isMobile ? [] : [5, 10, 25, { label: 'All', value: -1 }]}
            labelRowsPerPage={isMobile ? 'Rows:' : 'Rows per page:'}
            showFirstButton={!isMobile}
            showLastButton={!isMobile}
        />
    );
}
