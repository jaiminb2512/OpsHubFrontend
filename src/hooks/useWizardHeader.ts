import { useLayoutEffect, useEffect } from 'react';
import { usePageTitleContext, type WizardHeaderConfig } from '../Context/PageTitleContext';

export interface WizardHeaderConfigExtended extends WizardHeaderConfig {
    disabled?: boolean;
}

const useWizardHeader = (config: WizardHeaderConfigExtended) => {
    const { setWizardHeader, clearPageTitle } = usePageTitleContext();

    useLayoutEffect(() => {
        if (!config.disabled) {
            setWizardHeader(config);
        }
    });

    useEffect(() => {
        if (config.disabled) return;
        return () => clearPageTitle();
    }, [clearPageTitle, config.disabled]);
};

export default useWizardHeader;
