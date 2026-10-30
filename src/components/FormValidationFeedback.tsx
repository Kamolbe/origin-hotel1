import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert } from 'lucide-react';

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FieldError = { field: FormField; host: HTMLSpanElement; message: string };
function messageFor(field: FormField) {
  const validity = field.validity;
  if (validity.valueMissing) {
    if (field instanceof HTMLInputElement && field.type === 'checkbox') return 'Davom etish uchun tasdiqlash belgisini qo‘ying.';
    if (field instanceof HTMLInputElement && field.type === 'email') return 'Email manzilini kiriting.';
    return 'Bu maydonni to‘ldiring.';
  }
  if (validity.typeMismatch && field instanceof HTMLInputElement && field.type === 'email') return 'Emailni to‘g‘ri yozing. Masalan: ism@example.com';
  if (validity.typeMismatch) return 'To‘liq havola kiriting. Masalan: https://example.com';
  if (validity.tooShort && 'minLength' in field) return `Kamida ${field.minLength} ta belgi kiriting.`;
  if (validity.tooLong && 'maxLength' in field) return `Ko‘pi bilan ${field.maxLength} ta belgi kiriting.`;
  if (validity.rangeUnderflow && field instanceof HTMLInputElement) return `Qiymat ${field.min} dan kam bo‘lmasin.`;
  if (validity.rangeOverflow && field instanceof HTMLInputElement) return `Qiymat ${field.max} dan oshmasin.`;
  if (validity.badInput || validity.stepMismatch) return 'Ruxsat etilgan sonni kiriting.';
  return 'Ma’lumot formatini tekshiring.';
}

/** HTML constraints stay active; native browser bubbles are replaced with inline feedback. */
export function FormValidationFeedback() {
  const prefix = useId();
  const sequence = useRef(0);
  const entries = useRef(new Map<FormField, FieldError>());
  const [errors, setErrors] = useState<FieldError[]>([]);
  useEffect(() => {
    let handling = false;
    let focusFrame = 0;
    const managedForms = new Set<HTMLFormElement>();
    const isField = (target: EventTarget | null): target is FormField => target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
    const render = () => setErrors([...entries.current.values()]);
    const remove = (field: FormField) => {
      const entry = entries.current.get(field);
      if (!entry) return;
      entries.current.delete(field);
      const label = entry.host.closest('label');
      entry.host.remove();
      if (label && !label.querySelector('.hotel-field-feedback')) label.classList.remove('hotel-validation-label');
      delete field.dataset.hotelInvalid;
      field.removeAttribute('aria-invalid');
      const ids = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== entry.host.id);
      if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
      else field.removeAttribute('aria-describedby');
    };
    const manageForms = () => {
      document.querySelectorAll('form').forEach((form) => {
        if (!form.noValidate) { form.noValidate = true; managedForms.add(form); }
      });
      let changed = false;
      for (const field of entries.current.keys()) if (!field.isConnected) { remove(field); changed = true; }
      if (changed) render();
      for (const form of managedForms) if (!form.isConnected) managedForms.delete(form);
    };
    const invalid = (event: Event) => {
      if (!isField(event.target)) return;
      event.preventDefault();
      const field = event.target;
      let entry = entries.current.get(field);
      if (!entry) {
        const host = document.createElement('span');
        host.id = `${prefix}-field-${++sequence.current}`;
        host.className = 'hotel-field-feedback';
        const label = field.closest('label');
        if (label) {
          if (getComputedStyle(label).display.includes('flex')) label.classList.add('hotel-validation-label');
          label.append(host);
        }
        else (field.closest('.hotel-select-root') ?? field).after(host);
        entry = { field, host, message: messageFor(field) };
        entries.current.set(field, entry);
        const ids = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
        field.setAttribute('aria-describedby', [...ids, host.id].join(' '));
      }
      entry.message = messageFor(field);
      field.dataset.hotelInvalid = 'true';
      field.setAttribute('aria-invalid', 'true');
      render();
      if (handling) return;
      handling = true;
      queueMicrotask(() => { handling = false; });
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        if (!field.isConnected) return;
        const target = field.closest('.hotel-select-root')?.querySelector<HTMLButtonElement>('button') ?? field;
        target.focus();
      });
    };
    const edited = (event: Event) => {
      if (!isField(event.target)) return;
      const entry = entries.current.get(event.target);
      if (!entry) return;
      if (event.target.validity.valid) remove(event.target);
      else entry.message = messageFor(event.target);
      render();
    };
    const submit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !managedForms.has(form)) return;
      if (!form.checkValidity()) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    manageForms();
    const observer = new MutationObserver(manageForms);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('invalid', invalid, true);
    document.addEventListener('submit', submit, true);
    document.addEventListener('input', edited, true);
    document.addEventListener('change', edited, true);
    return () => {
      observer.disconnect(); cancelAnimationFrame(focusFrame);
      document.removeEventListener('invalid', invalid, true); document.removeEventListener('submit', submit, true);
      document.removeEventListener('input', edited, true); document.removeEventListener('change', edited, true);
      for (const field of entries.current.keys()) remove(field);
      for (const form of managedForms) if (form.isConnected) form.noValidate = false;
    };
  }, [prefix]);
  return <>{errors.map(({ host, message }) => createPortal(<span className="hotel-field-feedback-content" role="alert"><CircleAlert size={14} aria-hidden="true" /><span>{message}</span></span>, host, host.id))}</>;
}
