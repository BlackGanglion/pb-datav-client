import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { routerMiddleware, routerReducer } from 'react-router-redux';

import SequenceMiddleware from 'redux-sequence-action';
import ThunkMiddleware from 'redux-thunk';
import createFetchMiddleware, { applyFetchMiddleware } from 'redux-composable-fetch';

const finalFetchMiddleware = applyFetchMiddleware();

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
  )(createStore);

  const store = finalCreateStore(reducers, initialState);

  return store;
}
