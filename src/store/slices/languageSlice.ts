import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Language = 'en' | 'gu';

interface LanguageState {
    currentLanguage: Language;
}

const initialState: LanguageState = {
    currentLanguage: (localStorage.getItem('language') as Language) || 'en',
};

const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        setLanguage: (state, action: PayloadAction<Language>) => {
            state.currentLanguage = action.payload;
            localStorage.setItem('language', action.payload);
        },
        toggleLanguage: (state) => {
            const newLanguage: Language = state.currentLanguage === 'en' ? 'gu' : 'en';
            state.currentLanguage = newLanguage;
            localStorage.setItem('language', newLanguage);
        },
    },
});

export const { setLanguage, toggleLanguage } = languageSlice.actions;
export default languageSlice.reducer;

