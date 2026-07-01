import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CustomTablePaginationComponent from './CustomTablePagination';
import type { PaginationMeta } from '../../Services/ApiServices';

export interface Column<T> {
  id: string;
  label: string;
  render: (item: T) => React.ReactNode;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (item: T) => string | number;
  paginationMeta?: PaginationMeta | null;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  showPagination?: boolean;
  searchTerm?: string;
}

function DataTable<T>({
  columns,
  data,
  getRowKey,
  paginationMeta,
  currentPage = 0,
  pageSize = 10,
  onPageChange,
  onRowsPerPageChange,
  showPagination = true,
  searchTerm = '',
}: DataTableProps<T>) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                sx={{
                  fontWeight: 600,
                  minWidth: column.minWidth,
                  textAlign: column.align || 'left',
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={getRowKey(item)} hover>
              {columns.map((column) => (
                <TableCell key={column.id} sx={{ textAlign: column.align || 'left' }}>
                  {column.render(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        {showPagination && !searchTerm && paginationMeta && (
          <tfoot>
            <tr>
              <CustomTablePaginationComponent
                count={paginationMeta.totalCount}
                page={currentPage}
                rowsPerPage={pageSize}
                onPageChange={onPageChange || (() => { })}
                onRowsPerPageChange={onRowsPerPageChange || (() => { })}
              />
            </tr>
          </tfoot>
        )}
      </Table>
    </TableContainer>
  );
}

export default DataTable;

