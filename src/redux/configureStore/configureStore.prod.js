import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { routerMiddleware, routerReducer } from 'react-router-redux';

import SequenceMiddleware from 'redux-sequence-action';
import ThunkMiddleware from 'redux-thunk';
import createFetchMiddleware, { applyFetchMiddleware } from 'redux-composable-fetch';

import beforeFetch from './beforeFetch';
import afterFetch from './afterFetch';

const finalFetchMiddleware = applyFetchMiddleware(
  beforeFetch,
  afterFetch,
);

export default function configureStore(rootReducer, history) {
  const reducers = combineReducers({
    ...rootReducer,
    routing: routerReducer,
  });

  const initialState = {};

  const finalCreateStore = compose(
    applyMiddleware(
      SequenceMiddleware,
      createFetchMiddleware(afterFetch),
      ThunkMiddleware,
      routerMiddleware(history),
    ),
  )(createStore);

  const store = finalCreateStore(reducers, initialState);

  return store;
}
