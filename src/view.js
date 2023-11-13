/* eslint no-param-reassign: "error" */
import * as _ from 'lodash';

export default (elements, i18nextInstance) => {
  const renderErrorHint = (error) => {
    let feedbackElement = elements.example.nextElementSibling;

    if (feedbackElement) {
      feedbackElement.remove();
    }

    if (_.isEmpty(error)) {
      if (elements.input.classList.contains('is-invalid')) elements.input.classList.remove('is-invalid');
      return;
    }

    feedbackElement = document.createElement('p');
    feedbackElement.classList.add('feedback', 'm-0', 'position-absolute', 'small', 'text-danger');
    feedbackElement.textContent = error.message;
    elements.input.classList.add('is-invalid');
    elements.example.after(feedbackElement);
  };

  const renderSuccesHint = () => {
    const feedbackElement = document.createElement('p');
    feedbackElement.classList.add('feedback', 'm-0', 'position-absolute', 'small', 'text-success');
    feedbackElement.textContent = i18nextInstance.t('hint.success');
    elements.example.after(feedbackElement);
  };

  const handleProcessState = (processState) => {
    switch (processState) {
      case 'filling':
        elements.button.disabled = false;
        break;

      case 'sending':
        elements.button.disabled = true;
        break;

      case 'sent':
        elements.form.reset();
        elements.input.focus();
        renderSuccesHint();
        elements.button.disabled = false;
        break;

      case 'error':
        console.log('Oops, something wrong with network. Try again!');
        break;

      default:
        throw new Error(`Unknown process state: ${processState}`);
    }
  };

  const getInitialContainer = (path) => {
    const text = (path === 'feeds') ? 'Фиды' : 'Посты';

    const initialContainer = document.createElement('div');
    initialContainer.classList.add('card', 'border');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    initialContainer.append(cardBody);

    const title = document.createElement('h2');
    title.classList.add('card-title', 'h4');
    title.textContent = text;
    cardBody.append(title);

    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'border-0', 'rounded-0');
    initialContainer.append(feedsList);

    return initialContainer;
  };

  const renderFeed = (path, value, prevValue) => {
    if (_.isEmpty(prevValue)) {
      const feedsContainer = getInitialContainer(path);
      elements.feeds.append(feedsContainer);
    }

    const [newFeed] = _.difference(value, prevValue);
    const feedList = elements.feeds.querySelector('ul');

    const feed = document.createElement('li');
    feed.classList.add('list-group-item', 'border-0', 'border-end-0');

    const title = document.createElement('h3');
    title.classList.add('h6', 'm-0');
    title.textContent = newFeed.title;
    feed.append(title);

    const description = document.createElement('p');
    description.classList.add('m-0', 'small', 'text-black-50');
    description.textContent = newFeed.description;
    feed.append(description);

    feedList.append(feed);
  };

  const openModal = (post) => () => {
    elements.modalElements.title.textContent = post.title;
    elements.modalElements.body.textContent = post.description;
    elements.modalElements.link.href = post.link;
    elements.modalElements.modal.dataset.postId = post.postId;
    elements.modalElements.closeButton.disabled = false;
  };

  const makePostOpened = (value, prevValue) => {
    const [postId] = _.difference(value, prevValue);
    const justOpenedPost = elements.posts.querySelector(`[data-id='${postId}'`);
    justOpenedPost.classList.remove('fw-bold');
    justOpenedPost.classList.add('fw-normal');
  };

  const renderPosts = (path, value, prevValue) => {
    if (_.isEmpty(prevValue)) {
      const postsContainer = getInitialContainer(path);
      elements.posts.append(postsContainer);
    }

    const newPosts = _.difference(value, prevValue);
    const postsList = elements.posts.querySelector('ul');

    newPosts.forEach((post) => {
      const postEl = document.createElement('li');
      postEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

      const link = document.createElement('a');
      link.classList.add('fw-bold');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.dataset.id = post.postId;
      link.href = post.link;
      link.textContent = post.title;
      postEl.append(link);

      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.dataset.id = post.postId;
      button.target = 'modal';
      button.dataset.bsToggle = 'modal';
      button.dataset.bsTarget = '#modal';
      button.textContent = 'Просмотр';
      button.addEventListener('click', openModal(post));
      postEl.append(button);

      postsList.append(postEl);
    });
  };

  const render = (path, value, prevValue) => {
    switch (path) {
      case 'error':
        renderErrorHint(value);
        break;
      case 'processState':
        handleProcessState(value);
        break;
      case 'feeds':
        renderFeed(path, value, prevValue);
        break;
      case 'openedPosts':
        makePostOpened(value, prevValue);
        break;
      case 'posts':
        renderPosts(path, value, prevValue);
        break;
      case 'isUpdating':
        break;
      default:
        throw new Error(`Something went wrong in render, path: ${path}`);
    }
  };

  return render;
};
