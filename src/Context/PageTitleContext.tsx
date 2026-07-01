import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface PageTitleState {
    title: string;
    showBack?: boolean;
}

export interface WizardHeaderConfig {
    title?: string;
    steps: string[];
    activeStep: number;
    onStepClick?: (stepIndex: number) => void;
    onNext: () => void;
    loading?: boolean;
    nextButtonText?: string;
    finishButtonText?: string;
    extraActions?: ReactNode;
    parentBackLabel?: string;
    onParentBack: () => void;
}

interface PageTitleContextValue {
    titleState: PageTitleState;
    actionsRef: React.MutableRefObject<ReactNode>;
    wizardHeaderRef: React.MutableRefObject<WizardHeaderConfig | null>;
    wizardVersion: number;
    actionsVersion: number;
    setPageTitle: (title: string, actions?: ReactNode, showBack?: boolean) => void;
    setWizardHeader: (config: WizardHeaderConfig) => void;
    clearPageTitle: () => void;
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
    const [titleState, setTitleState] = useState<PageTitleState>({ title: '' });
    const [wizardVersion, setWizardVersion] = useState(0);
    const [actionsVersion, setActionsVersion] = useState(0);
    const actionsRef = useRef<ReactNode>(null);
    const wizardHeaderRef = useRef<WizardHeaderConfig | null>(null);

    const setPageTitle = useCallback((title: string, actions?: ReactNode, showBack?: boolean) => {
        actionsRef.current = actions ?? null;
        wizardHeaderRef.current = null;
        setTitleState({ title, showBack });
        setActionsVersion(v => v + 1);
    }, []);

    const setWizardHeader = useCallback((config: WizardHeaderConfig) => {
        const prev = wizardHeaderRef.current;
        wizardHeaderRef.current = config;
        actionsRef.current = null;

        const shouldBump =
            !prev ||
            prev.title !== config.title ||
            prev.activeStep !== config.activeStep ||
            prev.loading !== config.loading ||
            prev.steps.length !== config.steps.length ||
            prev.steps.join('|') !== config.steps.join('|') ||
            prev.nextButtonText !== config.nextButtonText ||
            prev.finishButtonText !== config.finishButtonText ||
            prev.parentBackLabel !== config.parentBackLabel;

        if (shouldBump) {
            setTitleState({ title: '', showBack: false });
            setWizardVersion(v => v + 1);
        }
    }, []);

    const clearPageTitle = useCallback(() => {
        actionsRef.current = null;
        wizardHeaderRef.current = null;
        setTitleState({ title: '' });
        setWizardVersion(v => v + 1);
    }, []);

    return (
        <PageTitleContext.Provider
            value={{
                titleState,
                actionsRef,
                wizardHeaderRef,
                wizardVersion,
                actionsVersion,
                setPageTitle,
                setWizardHeader,
                clearPageTitle,
            }}
        >
            {children}
        </PageTitleContext.Provider>
    );
};

export const usePageTitleContext = () => {
    const ctx = useContext(PageTitleContext);
    if (!ctx) throw new Error('usePageTitleContext must be used inside PageTitleProvider');
    return ctx;
};
