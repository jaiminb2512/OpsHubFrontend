import React, { useEffect, useState } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import { getProjectsService, type ProjectListItem } from '../../Services/ApiServices/projectServices';

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  fetchOnLoad?: boolean;
  projects?: ProjectListItem[];
  showGlobalOptions?: boolean;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
  required?: boolean;
}

export const ProjectSelect: React.FC<ProjectSelectProps> = ({
  value,
  onChange,
  fetchOnLoad = true,
  projects: parentProjects = [],
  showGlobalOptions = true,
  label = 'Project',
  disabled = false,
  size = 'small',
  sx,
  required = false,
}) => {
  const [fetchedProjects, setFetchedProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchOnLoad) {
      return;
    }

    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await getProjectsService();
        if (response.success && response.data) {
          setFetchedProjects(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch projects for dropdown', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [fetchOnLoad]);

  const projects = fetchOnLoad ? fetchedProjects : parentProjects;

  const options: { id: string; name: string }[] = [];
  if (showGlobalOptions) {
    options.push({ id: '', name: 'All Projects' });
  }
  options.push({ id: 'null', name: 'No Project (Global)' });
  
  projects.forEach((project) => {
    options.push({ id: project.id, name: project.name });
  });

  let resolvedValue = value;
  if (value === null) {
    resolvedValue = 'null';
  } else if (!showGlobalOptions && value === '') {
    resolvedValue = 'null';
  }

  const selectedOption = options.find((opt) => opt.id === resolvedValue) || null;

  return (
    <Autocomplete
      value={selectedOption}
      onChange={(_, newValue) => {
        onChange(newValue ? newValue.id : '');
      }}
      options={options}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
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
