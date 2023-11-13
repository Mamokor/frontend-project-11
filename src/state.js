export default () => {
  const state = {
    processState: 'filling',
    processError: null,
    error: null,
    feeds: [],
    posts: [],
    openedPosts: [],
  };

  return state;
};
