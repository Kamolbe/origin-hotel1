const selectVisible = document.getElementById('select-visible');
selectVisible?.addEventListener('change', () => {
  document.querySelectorAll('.row-select:not(:disabled)').forEach((input) => { input.checked = selectVisible.checked; });
});
document.getElementById('print-report')?.addEventListener('click', () => window.print());
const type = document.getElementById('id_entry_type');
const category = document.getElementById('id_category');
const categories = {
  income: [['room_revenue', 'Xona haqi'], ['food_and_beverage', 'Ovqatlanish'], ['additional_services', 'Qo‘shimcha xizmatlar'], ['rental', 'Ijara'], ['other', 'Boshqa kirim']],
  expense: [['payroll', 'Ish haqi'], ['utilities', 'Kommunal to‘lovlar'], ['supplies', 'Material va xaridlar'], ['maintenance', 'Ta’mirlash'], ['other', 'Boshqa chiqim']],
};
type?.addEventListener('change', () => { category.replaceChildren(...categories[type.value].map(([value, label]) => new Option(label, value))); });
