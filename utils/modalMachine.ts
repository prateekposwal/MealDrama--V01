export interface ModalState {
  isOpen: boolean;
  modalKey: string | null;
  context: Record<string, unknown>;
  zIndex: number;
}

type ModalAction =
  | { type: 'OPEN'; modalKey: string; context?: Record<string, unknown> }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE'; modalKey: string; context?: Record<string, unknown> }
  | { type: 'UPDATE_CONTEXT'; context: Record<string, unknown> }
  | { type: 'RESET' };

let _zCounter = 1000;

export function createModalReducer(initialKey: string | null = null) {
  const initialState: ModalState = {
    isOpen: false,
    modalKey: initialKey,
    context: {},
    zIndex: 1000,
  };

  return function modalReducer(state: ModalState, action: ModalAction): ModalState {
    switch (action.type) {
      case 'OPEN':
        _zCounter++;
        return {
          isOpen: true,
          modalKey: action.modalKey,
          context: action.context ?? {},
          zIndex: _zCounter,
        };
      case 'CLOSE':
        return { ...state, isOpen: false, context: {} };
      case 'TOGGLE':
        if (state.isOpen && state.modalKey === action.modalKey) {
          return { ...state, isOpen: false, context: {} };
        }
        _zCounter++;
        return {
          isOpen: true,
          modalKey: action.modalKey,
          context: action.context ?? {},
          zIndex: _zCounter,
        };
      case 'UPDATE_CONTEXT':
        return { ...state, context: { ...state.context, ...action.context } };
      case 'RESET':
        return initialState;
      default:
        return state;
    }
  };
}

export function getModalState(isOpen: boolean, modalKey: string | null = null, context: Record<string, unknown> = {}): ModalState {
  _zCounter++;
  return { isOpen, modalKey, context, zIndex: _zCounter };
}
