import { useToast } from '../../Utils/ToastContext';
import Toast from './Toast';
import { ToastContainer } from './Toast';

const ToastDisplay = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <ToastContainer>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </ToastContainer>
  );
};

export default ToastDisplay;

