import React, { useEffect, useState } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import { getCompaniesService, type CompanyListItem } from '../../Services/ApiServices/companyServices';

interface CompanySelectProps {
  value: string;
  onChange: (value: string) => void;
  fetchOnLoad?: boolean;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
  required?: boolean;
}

export const CompanySelect: React.FC<CompanySelectProps> = ({
  value,
  onChange,
  fetchOnLoad = true,
  label = 'Company',
  disabled = false,
  size = 'small',
  sx,
  required = false,
}) => {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchOnLoad) return;
    setLoading(true);
    getCompaniesService()
      .then((res) => { if (res.success && res.data) setCompanies(res.data); })
      .catch((err) => console.error('Failed to fetch companies', err))
      .finally(() => setLoading(false));
  }, [fetchOnLoad]);

  const options: { id: string; name: string }[] = [
    { id: '', name: 'All Companies' },
    ...companies.map((c) => ({ id: c.id, name: c.name })),
  ];

  const selectedOption = options.find((o) => o.id === value) ?? null;

  return (
    <Autocomplete
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : '')}
      options={options}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      disabled={disabled || loading}
      size={size}
      sx={{ minWidth: 200, ...sx }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};
