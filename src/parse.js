import uniqueId from 'lodash/uniqueId';

const parse = (response) => {
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data, 'application/xml'); 
  const parserError = parsedData.querySelector('parsererror');
  if (parserError && type === 'load') {
    const error = new Error(parserError.textContent);
    error.isParserError = true;
    throw error;
  }  
  const items = parsedData.querySelectorAll('item');
  const mainTitle = parsedData.querySelector('channel > title').textContent;
  const mainDescription = parsedData.querySelector('channel > description').textContent;
  const data = { mainTitle, mainDescription, posts: [] };
  items.forEach((item) => {
    const id = uniqueId();
    const title = item.querySelector('title').textContent;
    const href = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent;
    data.posts.push({
      title, description, href, id,
    });
  });
  return data;
};

export default parse;
