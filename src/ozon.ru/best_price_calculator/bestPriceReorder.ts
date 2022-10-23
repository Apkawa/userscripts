import {E, GM_addStyle} from '../../utils';
import {sort} from '../../utils/sort';

const BEST_PRICE_WRAP_CLASS_NAME = 'GM-best-price-wrap';

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

  const buttonReset = E('button', {class: 'GM-best-order-button'}, 'Reset');
  const buttonByWeight = E('button', {class: 'GM-best-order-button'}, 'by Weight');
  const buttonByQuantity = E('button', {class: 'GM-best-order-button'}, 'by Quantity');

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
    for (const b of [buttonReset, buttonByQuantity, buttonByWeight]) {
      b.classList.remove('active');
    }
    button.classList.add('active');
  }

  buttonReset.onclick = () => {
    console.log('Reset order');
    sort<CatalogRecord>(catalogRecords, 'initial_order');
    refreshCatalog();
    setActiveButton(buttonReset);
  };
  buttonByWeight.onclick = () => {
    console.log('BY WEIGHT');
    sort<CatalogRecord>(catalogRecords, 'weight_price');
    refreshCatalog();
    setActiveButton(buttonByWeight);
  };
  buttonByQuantity.onclick = () => {
    console.log('BY QUANTITY');
    sort<CatalogRecord>(catalogRecords, 'quantity_price');
    refreshCatalog();
    setActiveButton(buttonByQuantity);
  };
  buttonWrap && buttonWrap.appendChild(E('div', {}, buttonByQuantity, buttonByWeight, buttonReset));
}
