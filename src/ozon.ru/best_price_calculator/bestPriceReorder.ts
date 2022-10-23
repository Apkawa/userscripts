import {E, entries, GM_addStyle, values} from '../../utils';
import {sort} from '../../utils/sort';

const BEST_PRICE_WRAP_CLASS_NAME = 'GM-best-price-wrap';
const ORDER_NAME_LOCAL_STORAGE = 'GM-best-price-default-order';

const MAX_NUMBER = 99999999999;

GM_addStyle('button.GM-best-order-button.active { border: 2px solid red; }');

interface CatalogRecord {
  initial_order: number;
  weight_price: number | null;
  quantity_price: number | null;
  el: HTMLElement;
}

export function initReorderCatalog(catalogEl: HTMLElement): void {
  const buttonWrap = document.querySelector('[data-widget="searchResultsSort"]');
  if (!buttonWrap) return;

  const catalogRecords: CatalogRecord[] = [];
  let i = 0;
  for (const el of catalogEl.querySelectorAll('.' + BEST_PRICE_WRAP_CLASS_NAME)) {
    const ds = (el as HTMLElement).dataset;
    ds['initial_order'] = i.toString();
    i += 1;
    catalogRecords.push({
      el: el as HTMLElement,
      initial_order: i,
      weight_price: ds.weight_price ? parseFloat(ds.weight_price) : MAX_NUMBER,
      quantity_price: ds.quantity_price ? parseFloat(ds.quantity_price) : MAX_NUMBER,
    });
  }

  const buttons = {
    initial_order: E('button', {class: 'GM-best-order-button'}, 'Reset'),
    weight_price: E('button', {class: 'GM-best-order-button'}, 'by Weight'),
    quantity_price: E('button', {class: 'GM-best-order-button'}, 'by Quantity'),
  };

  for (const [k, b] of entries(buttons)) {
    b.onclick = () => {
      console.log(k);
      localStorage.setItem(ORDER_NAME_LOCAL_STORAGE, k);
      sort<CatalogRecord>(catalogRecords, k);
      refreshCatalog();
      setActiveButton(b);
    };
  }

  const defaultOrder = localStorage.getItem(ORDER_NAME_LOCAL_STORAGE) as
    | keyof Omit<CatalogRecord, 'el'>
    | null;

  if (defaultOrder) {
    buttons[defaultOrder].click();
  }

  function refreshCatalog(): void {
    const wrap = catalogEl.querySelector(':scope > div');
    if (!wrap) return;
    const elements = document.createDocumentFragment();
    for (const c of catalogRecords) {
      elements.appendChild(c.el);
    }
    wrap.innerHTML = '';
    wrap.appendChild(elements);
  }

  function setActiveButton(button: HTMLElement) {
    for (const b of values(buttons)) {
      b.classList.remove('active');
    }
    button.classList.add('active');
  }

  (buttonWrap as HTMLElement).querySelector('.GM-best-price-button-wrap')?.remove();
  buttonWrap.appendChild(E('div', {class: 'GM-best-price-button-wrap'}, ...values(buttons)));
}
