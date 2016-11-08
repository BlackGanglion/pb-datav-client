import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { routerMiddleware, routerReducer } from 'react-router-redux';
import DevTools from '../container/DevTools';

import SequenceMiddleware from 'redux-sequence-action';
import ThunkMiddleware from 'redux-thunk';
import createFetchMiddleware, { applyFetchMiddleware } from 'redux-composable-fetch';

import afterFetch from './afterFetch';

const finalFetchMiddleware = applyFetchMiddleware(
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
      createFetchMiddleware(finalFetchMiddleware),
      ThunkMiddleware,
      routerMiddleware(history),
    ),
    window.devToolsExtension ? window.devToolsExtension() : DevTools.instrument(),
  )(createStore);

  const store = finalCreateStore(reducers, initialState);

  return store;
}
