type CloseHandler = () => void;
const stack: { id: string; close: CloseHandler }[] = [];

export function pushModal(id: string, close: CloseHandler) {
  stack.push({ id, close });
}

export function removeModal(id: string) {
  const idx = stack.findIndex(m => m.id === id);
  if (idx !== -1) stack.splice(idx, 1);
}

export function closeTopModal(): boolean {
  const modal = stack.pop();
  if (!modal) return false;
  modal.close();
  return true;
}

export function hasOpenModals(): boolean {
  return stack.length > 0;
}
