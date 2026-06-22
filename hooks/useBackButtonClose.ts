import { useEffect, useRef } from 'react';
import { pushModal, removeModal } from '../utils/modalStack';

export function useBackButtonClose(isOpen: boolean, onClose: () => void) {
  const idRef = useRef('');
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      if (idRef.current) {
        removeModal(idRef.current);
        idRef.current = '';
      }
      return;
    }
    const id = `modal-${Date.now()}-${Math.random()}`;
    idRef.current = id;
    pushModal(id, () => closeRef.current());
    return () => {
      removeModal(id);
      idRef.current = '';
    };
  }, [isOpen]);
}
