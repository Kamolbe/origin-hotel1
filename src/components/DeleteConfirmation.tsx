import { Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export function DeleteConfirmation({ open, onClose, onConfirm, title = 'O‘chirishni tasdiqlang', description, disabled = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title?: string; description: string; disabled?: boolean }) {
  return <Modal open={open} onClose={onClose} title={title} description={description}>
    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-rose-500/10 p-4 text-xs leading-6"><Trash2 size={20} className="shrink-0 text-danger" /><span>Davom etishdan oldin tanlangan ma’lumotlarni tekshiring.</span></div>
    <div className="flex flex-wrap justify-end gap-2"><button type="button" className="secondary-button" onClick={onClose}>Bekor qilish</button><button type="button" disabled={disabled} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-xs font-semibold text-white disabled:opacity-40" onClick={onConfirm}><Trash2 size={14} />Ha, o‘chirish</button></div>
  </Modal>;
}
