import {capitalize} from '../utils/string';
import {SectionTagList, TagList} from './types';

export function e621GetSectionTagList(): SectionTagList {
  const result: SectionTagList = {};

  // Находим секцию с тегами
  const section = document.querySelector('section#tag-list');
  if (!section) return result;

  const categories = section.querySelectorAll('ul');
  for (const category of categories) {
    // Находим следующий элемент после h3 (список ul с таким же классом)
    const listItems = category.querySelectorAll(`li`);
    if (listItems) {
      const tagList: TagList = [];
      // Парсим все элементы списка
      for (const item of listItems) {
        const tagName = item.getAttribute('data-name');

        if (tagName) {
          // Получаем текст тега (убираем лишние пробелы)
          tagList.push(tagName);
        }
      }
      const categoryName = capitalize(category.classList[1].split('-tag-list')[0]);
      result[categoryName] = tagList;
    }
  }
  return result;
}
