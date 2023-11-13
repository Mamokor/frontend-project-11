/* eslint-disable no-shadow */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-len */
/* eslint no-param-reassign: "error" */

import axios from 'axios';
import * as yup from 'yup';
import * as _ from 'lodash';
import onChange from 'on-change';
import i18next from 'i18next';
import initState from './state';
import initView from './view';
import resources from './locales/index';
import parse from './parse';

const addIds = (rowFeedData, rowPostsData) => {
  const feedId = _.uniqueId();
  rowFeedData.feedId = feedId;

  rowPostsData.forEach((post) => {
    const postId = _.uniqueId();
    post.postId = postId;
    post.feedId = feedId;
  });

  return [rowFeedData, rowPostsData];
};

const getAxiosResponse = (url) => {
  const allOriginsLink = 'https://allorigins.hexlet.app/get';

  const preparedURL = new URL(allOriginsLink);
  preparedURL.searchParams.set('disableCache', 'true');
  preparedURL.searchParams.set('url', url);

  return axios.get(preparedURL);
};

const getSchema = (feedLinks) => yup.object({
  url: yup.string().url().required().notOneOf(feedLinks),
});

const app = async () => {
  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    button: document.querySelector('button[type="submit"]'),
    example: document.querySelector('.text-muted'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modalElements: {
      modal: document.querySelector('.modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      link: document.querySelector('.modal').querySelector('.full-article'),
      closeButton: document.querySelector('.modal').querySelector('.btn-close'),
    },
  };

  const initialState = initState();
  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    resources,
  }).then(() => {
    yup.setLocale({
      mixed: {
        notOneOf: i18nextInstance.t('error.duplicate'),
      },
      string: {
        url: i18nextInstance.t('error.invalid'),
        required: i18nextInstance.t('error.empty'),
      },
    });

    const render = initView(elements, i18nextInstance);
    const state = onChange(initialState, render);

    elements.posts.addEventListener('click', (e) => {
      if (!(e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button')) return;
      if (!state.openedPosts.includes(e.target.dataset.id)) state.openedPosts.push(e.target.dataset.id);
    });

    const validate = (field) => {
      const feedLinks = state.feeds.reduce((acc, feed) => [...acc, feed.link], []);
      const schema = getSchema(feedLinks);
      return schema.validate(field);
    };

    const updateFeeds = () => {
      const links = state.feeds.map((feed) => feed.link);
      const promises = links.map((link) => getAxiosResponse(link));

      Promise.all(promises).then((response) => {
        response.forEach((item) => {
          const index = response.indexOf(item);
          const link = links[index];
          const [, postsData] = parse(item.data, link, 'update');
          postsData.forEach((post) => {
            if (!_.find(state.posts, { link: post.link })) state.posts.push(post);
          });
        });
      }).finally(() => setTimeout(updateFeeds, 5000));
    };

    updateFeeds();

    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const inputValue = elements.input.value.trim();

      state.processState = 'sending';

      validate({ url: inputValue })
        .then(() => {
          state.error = {};
          getAxiosResponse(inputValue).then((response) => {
            const [rowFeedData, rowPostsData] = parse(response.data, inputValue);
            const [feedData, postsData] = addIds(rowFeedData, rowPostsData);

            state.feeds.push(feedData);
            state.posts = [...state.posts, ...postsData];
            state.processState = 'sent';
          }).catch((err) => {
            state.error = (err?.isParserError) ? { message: i18nextInstance.t('error.invalidRss') } : { message: i18nextInstance.t('error.axiosError') };
            state.processState = 'filling';
          });
        }).catch((err) => {
          state.error = err;
          state.processState = 'filling';
        });
    });
  });
};

export default app;
