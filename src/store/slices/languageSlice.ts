import { createSlice } from '@reduxjs/toolkit';

interface LanguageState {
    currentLanguage: 'en' | 'gu';
}

const initialState: LanguageState = { currentLanguage: 'en' };

const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        toggleLanguage(state) {
            state.currentLanguage = state.currentLanguage === 'en' ? 'gu' : 'en';
        },
    },
});

export const { toggleLanguage } = languageSlice.actions;
export default languageSlice.reducer;
