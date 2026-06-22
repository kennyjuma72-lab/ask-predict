import React, { createContext, useState, useCallback, useContext } from 'react';
import { View, Text } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    const toast: ToastMessage = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => hideToast(id), duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = (): Pick<ToastContextType, 'showToast'> => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return { showToast: context.showToast };
};

const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, hideToast } = context;

  const getBackgroundColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FFC107';
      case 'info':
      default:
        return '#2196F3';
    }
  };

  const getIcon = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error-outline';
      case 'warning':
        return 'warning-amber';
      case 'info':
      default:
        return 'info-outline';
    }
  };

  return (
    <>
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          visible={true}
          onDismiss={() => hideToast(toast.id)}
          duration={0}
          style={{
            backgroundColor: getBackgroundColor(toast.type),
            marginBottom: toasts.indexOf(toast) * 60,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name={getIcon(toast.type)} size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>
              {toast.message}
            </Text>
          </View>
        </Snackbar>
      ))}
    </>
  );
};
