import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';
import ConfirmDialog, {
    type ConfirmSeverity,
} from '../Components/Common/ConfirmDialog';

export type ConfirmOptions = {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    severity?: ConfirmSeverity;
};

type ConfirmState = {
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
    confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
    const [pending, setPending] = useState<ConfirmState | null>(null);

    const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
        const opts: ConfirmOptions =
            typeof options === 'string' ? { message: options } : options;

        return new Promise<boolean>((resolve) => {
            setPending({ options: opts, resolve });
        });
    }, []);

    const close = (result: boolean) => {
        pending?.resolve(result);
        setPending(null);
    };

    const opts = pending?.options;

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {opts ? (
                <ConfirmDialog
                    open
                    title={opts.title}
                    message={opts.message}
                    confirmText={opts.confirmText}
                    cancelText={opts.cancelText}
                    severity={opts.severity}
                    onConfirm={() => close(true)}
                    onCancel={() => close(false)}
                />
            ) : null}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = (): ConfirmContextValue => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within ConfirmDialogProvider');
    }
    return ctx;
};
