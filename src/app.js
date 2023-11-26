/* eslint-disable no-shadow */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-len */
/* eslint no-param-reassign: "error" */

import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId';
import i18next from 'i18next';
import render from './view';
import resources from './locales/index';
import parser from './parse';

const defaultLanguage = 'ru';
const timeout = 5000;

const validateLink = (link, rssLinks) => {
  const schema = yup.string().required().url().notOneOf(rssLinks);
  return schema.validate(link);
};

const getAxiosResponse = (url) => {
  const allOriginsLink = 'https://allorigins.hexlet.app/get';
  const preparedURL = new URL(allOriginsLink);
  preparedURL.searchParams.append('disableCache', 'true');
  preparedURL.searchParams.append('url', url);
  return axios.get(preparedURL);
};

const updateFeeds = (state) => {
  const promises = state.data.feeds
    .map(({ link, feedId }) => getAxiosResponse(link)
      .then((response) => {
        const parsedData = parser(response.data.contents);
        const { posts } = parsedData;
        const addedPosts = state.data.posts.map((post) => post.postLink);
        const newPosts = posts.filter((post) => !addedPosts.includes(post.postLink));
        if (newPosts.length > 0) {
          const preparedPosts = newPosts.map((post) => ({ ...post, feedId, id: uniqueId() }));
          state.data.posts = [...state.data.posts, ...preparedPosts];
        }
      })
      .catch((error) => {
        console.log(error.message);
      }));
  Promise.allSettled(promises)
    .finally(() => {
      setTimeout(() => updateFeeds(state), timeout);
    });
};

export default () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: true,
    resources,
  }).then(() => {
    const elements = {
      form: document.querySelector('.rss-form'),
      input: document.querySelector('.form-control'),
      submitButton: document.querySelector('button[type="submit"]'),
      statusFeedback: document.querySelector('.feedback'),
      feeds: document.querySelector('.feeds'),
      posts: document.querySelector('.posts'),
      modal: {
        window: document.querySelector('.modal'),
        title: document.querySelector('.modal-title'),
        body: document.querySelector('.modal-body'),
        linkButton: document.querySelector('.full-article'),
      },
    };

    yup.setLocale({
      string: {
        url: 'feedback.errors.invalidURL',
      },
      mixed: {
        notOneOf: 'feedback.errors.alreadyExists',
      },
    });

    const initialState = {
      form: {
        valid: true,
        processState: 'filling',
        errors: {},
      },
      data: {
        feeds: [],
        posts: [],
      },
      uiState: {
        modal: '',
        visitedPosts: new Set(),
      },
      rssLinks: [],
    };

    const watchedState = onChange(initialState, render(elements, initialState, i18nInstance));
    updateFeeds(watchedState);

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputValue = formData.get('url').trim();
      watchedState.form.processState = 'sending';
      validateLink(inputValue, watchedState.rssLinks)
        .then(() => {
          watchedState.form.valid = true;
          return getAxiosResponse(inputValue);
        })
        .then((response) => {
          const content = response.data.contents;
          const { feed, posts } = parser(content);
          const feedId = uniqueId();

          watchedState.rssLinks.push(inputValue);
          watchedState.data.feeds.push({ ...feed, feedId, link: inputValue });

          const postsWithId = posts.map((post) => ({ ...post, feedId, id: uniqueId() }));
          watchedState.data.posts.push(...postsWithId);
          watchedState.form.processState = 'sent';
        })
        .catch((error) => {
          watchedState.form.processState = 'error';
          switch (error.name) {
            case 'AxiosError':
              error.message = 'feedback.errors.networkError';
              break;
            case 'ValidationError':
              watchedState.form.valid = false;
              break;
            case 'Error':
              error.message = error.message === 'Parser error' ? 'feedback.errors.invalidRSS' : error.message;
              break;
            default:
              console.log(error.message);
          }
          watchedState.form.errors = error;
        });
    });
    elements.modal.window.addEventListener('show.bs.modal', (e) => {
      const currentId = e.relatedTarget.getAttribute('data-id');
      watchedState.uiState.visitedPosts.add(currentId);
      watchedState.uiState.modal = currentId;
    });
    elements.posts.addEventListener('click', (e) => {
      const { target } = e;
      const postId = target.getAttribute('data-id');
      if (!('id' in target.dataset)) {
        return;
      }
      watchedState.uiState.visitedPosts.add(postId);
    });
  });
};
