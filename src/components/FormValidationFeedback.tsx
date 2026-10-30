import { useEffect, useId, useState } from 'react';
import { useToast } from '../context/ToastContext';

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
function messageFor(field: FormField) {
  const label = field.getAttribute('aria-label') || field.labels?.[0]?.querySelector('span')?.textContent || field.getAttribute('placeholder') || 'Maydon';
  const name = label.trim().slice(0, 80);
  const validity = field.validity;
  if (validity.valueMissing) return field instanceof HTMLInputElement && field.type === 'checkbox' ? 'Davom etish uchun tasdiqlash belgisini qo‘ying.' : `${name}: bu maydonni to‘ldiring.`;
  if (validity.typeMismatch && field instanceof HTMLInputElement && field.type === 'email') return 'Email manzilini to‘g‘ri kiriting. Masalan: ism@example.com';
  if (validity.typeMismatch) return `${name}: to‘g‘ri havola yoki qiymat kiriting.`;
  if (validity.tooShort && 'minLength' in field) return `${name}: kamida ${field.minLength} ta belgi kiriting.`;
  if (validity.tooLong && 'maxLength' in field) return `${name}: ko‘pi bilan ${field.maxLength} ta belgi kiriting.`;
  if (validity.rangeUnderflow && field instanceof HTMLInputElement) return `${name}: qiymat ${field.min} dan kam bo‘lmasin.`;
  if (validity.rangeOverflow && field instanceof HTMLInputElement) return `${name}: qiymat ${field.max} dan oshmasin.`;
  if (validity.badInput || validity.stepMismatch) return `${name}: ruxsat etilgan sonni kiriting.`;
  return `${name}: ma’lumot formatini tekshiring.`;
}

/** Keep HTML constraints, replace browser bubbles with the site's accessible feedback. */
export function FormValidationFeedback() {
  const { error } = useToast();
  const descriptionId = useId();
  const [message, setMessage] = useState('');
  useEffect(() => {
    let handling = false;
    let focusFrame = 0;
    const isField = (target: EventTarget | null): target is FormField => target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
    const invalid = (event: Event) => {
      if (!isField(event.target)) return;
      event.preventDefault();
      const field = event.target;
      field.dataset.hotelInvalid = 'true';
      field.setAttribute('aria-invalid', 'true');
      if (handling) return;
      handling = true;
      queueMicrotask(() => { handling = false; });
      const text = messageFor(field);
      setMessage(text); error(text);
      const describedBy = field.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];
      if (!describedBy.includes(descriptionId)) field.setAttribute('aria-describedby', [...describedBy, descriptionId].join(' '));
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => { if (field.isConnected) field.focus(); });
    };
    const edited = (event: Event) => {
      if (!isField(event.target) || event.target.dataset.hotelInvalid !== 'true' || !event.target.validity.valid) return;
      const field = event.target;
      delete field.dataset.hotelInvalid;
      field.removeAttribute('aria-invalid');
      const descriptions = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== descriptionId);
      if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
      else field.removeAttribute('aria-describedby');
    };
    document.addEventListener('invalid', invalid, true);
    document.addEventListener('input', edited, true);
    document.addEventListener('change', edited, true);
    return () => { cancelAnimationFrame(focusFrame); document.removeEventListener('invalid', invalid, true); document.removeEventListener('input', edited, true); document.removeEventListener('change', edited, true); };
  }, [error, descriptionId]);
  return <p id={descriptionId} className="sr-only">{message}</p>;
}
