import {mRegExp} from '../../utils';

export type ParseTitleResult = {
  weight: number | null;
  quantity: number;
  item_weight: number | null;
  weight_unit: string | null;
};

const WEIGHT_REGEXP = mRegExp([
  /(?<value>\d+[,.]\d+|\d+)/, // Value
  /\s?/, // Space
  '(?<unit>',
  '(?<weight_unit>(?<weight_SI>кг|килограмм)|г|грамм|гр)',
  '|(?<volume_unit>(?<volume_SI>л|литр)|мл))',
]);

const QUANTITY_UNITS = ['шт', 'рулон', 'пакет', 'уп', 'упаков', 'салфет', 'таб', 'капсул'];

const QUANTITY_REGEXP = RegExp(
  `(?<quantity>\\d+)\\s?(?<quantity_unit>${QUANTITY_UNITS.join('|')})\\.?`,
);

const QUANTITY_2_REGEXP = RegExp(
  `(?<quantity_2>\\d+)\\s?(?<quantity_2_unit>${QUANTITY_UNITS.join('|')})\\.?`,
);

const COMBINE_DELIMETER_REGEXP = /\s?(?:[xх*]|по)\s?/;
const COMBINE_QUANTITY_LIST = [
  mRegExp([/(?<quantity_2>\d+)/, COMBINE_DELIMETER_REGEXP, QUANTITY_REGEXP]), // 20x100шт
  mRegExp([QUANTITY_REGEXP, COMBINE_DELIMETER_REGEXP, /(?<quantity_2>\d+)/]), // 20уп*100
  mRegExp([QUANTITY_2_REGEXP, COMBINE_DELIMETER_REGEXP, QUANTITY_REGEXP]), // 20уп по 100салф
];
const COMBINE_QANTITY_WEIGHT_REGEXP_LIST = [
  mRegExp([WEIGHT_REGEXP, COMBINE_DELIMETER_REGEXP, QUANTITY_REGEXP]), // 100г.x20шт.
  mRegExp([QUANTITY_REGEXP, COMBINE_DELIMETER_REGEXP, WEIGHT_REGEXP]), // 20шт x 100г
  mRegExp([/(?<quantity>\d+)/, COMBINE_DELIMETER_REGEXP, WEIGHT_REGEXP]), // 20x100г
  mRegExp([WEIGHT_REGEXP, COMBINE_DELIMETER_REGEXP, /(?<quantity>\d+)/]), // 100гx20
];

interface MatchGroupsResult {
  quantity?: string;
  quantity_unit?: string;
  value?: string;
  unit?: string;
  weight_unit?: string;
  weight_SI?: string;
  volume_unit?: string;
  volume_SI?: string;
}

function parseGroups(groups: MatchGroupsResult): ParseTitleResult {
  const result: ParseTitleResult = {
    weight: null,
    item_weight: null,
    weight_unit: null,
    quantity: 1,
  };

  if (groups.value) {
    const valueStr: string | undefined = groups?.value;
    const unit = groups?.unit;
    if (valueStr && unit) {
      let value = parseFloat(valueStr.replace(',', '.'));
      // Всегда считаем в мл и г
      if (groups.weight_unit) {
        if (!groups.weight_SI) {
          value /= 1000;
        }
        result.weight_unit = 'кг';
      }
      if (groups.volume_unit) {
        if (!groups.volume_SI) {
          value /= 1000;
        }
        result.weight_unit = 'л';
      }

      result.weight = value;
      result.item_weight = value;
    }
  }

  if (groups.quantity) {
    const valueStr: string | undefined = groups?.quantity;
    if (valueStr) {
      result.quantity = parseInt(valueStr);
    }
  }

  if (result.item_weight && result.quantity > 1) {
    result.weight = result.quantity * result.item_weight;
  }

  return result;
}

export function parseTitle(title: string): ParseTitleResult {
  for (const r of COMBINE_QANTITY_WEIGHT_REGEXP_LIST) {
    const rMatch = r.exec(title);
    if (rMatch) {
      return parseGroups(rMatch.groups as MatchGroupsResult);
    }
  }

  let groups: {
    [key: string]: string;
  } = {};
  const weightMatch = WEIGHT_REGEXP.exec(title);
  if (weightMatch?.groups) {
    groups = weightMatch.groups;
  }

  let quantity = 0;
  for (const r of COMBINE_QUANTITY_LIST) {
    const rMatch = r.exec(title)?.groups;
    if (rMatch?.quantity && rMatch?.quantity_2) {
      quantity = parseInt(rMatch.quantity) * parseInt(rMatch.quantity_2);
      break;
    }
  }
  if (quantity) {
    groups.quantity = quantity.toString();
  } else {
    const quantityMatch = QUANTITY_REGEXP.exec(title);
    if (quantityMatch?.groups) {
      groups = {...groups, ...quantityMatch.groups};
    }
  }

  return parseGroups(groups as MatchGroupsResult);
}
