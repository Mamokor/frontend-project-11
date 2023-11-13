const parse = (data, link, type = 'load') => {
  const domParser = new DOMParser();
  const parsedData = domParser.parseFromString(data.contents, 'application/xml');
  const parserError = parsedData.querySelector('parsererror');

  if (parserError && type === 'load') {
    const error = new Error(parserError.textContent);
    error.isParserError = true;
    throw error;
  }

  const title = parsedData.querySelector('title');
  const description = parsedData.querySelector('description');

  const descriptionText = (description) ? description.textContent : '';

  const feedData = {
    title: title.textContent,
    description: descriptionText,
    link,
  };

  const posts = parsedData.querySelectorAll('item');
  const postsData = [];
  posts.forEach((post) => {
    const postTitle = post.querySelector('title');
    const postDescription = post.querySelector('description');
    const postLink = post.querySelector('link');
    postsData.push({
      title: postTitle.textContent,
      description: postDescription.textContent,
      link: postLink.textContent,
    });
  });

  return [feedData, postsData];
};

export default parse;
