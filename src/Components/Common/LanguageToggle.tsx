import { Typography } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleLanguage } from '../../store/slices/languageSlice';
import MUICustomBtn from './MUICustomBtn';

const LanguageToggle = () => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const handleToggle = () => {
    dispatch(toggleLanguage());
  };

  return (
    <MUICustomBtn
      onClick={handleToggle}
      startIcon={<LanguageIcon />}
      tooltip={`Switch to ${currentLanguage === 'en' ? 'Gujarati' : 'English'}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    >
      <Typography
        sx={{
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {currentLanguage === 'en' ? 'EN' : 'GU'}
      </Typography>
    </MUICustomBtn>
  );
};

export default LanguageToggle;

