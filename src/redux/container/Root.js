import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import DevTools from './DevTools';

function ReduxRootContainer({ store, history, routes }) {
  return (
    <Provider store={store}>
      {
        __DEV__ ? (
          <div>
            <Router history={history}>
              {routes}
            </Router>
            {!window.devToolsExtension ? <DevTools /> : null}
          </div>
        ) : (
          <Router history={history}>
            {routes}
          </Router>
        )
      }
    </Provider>
  );
}

ReduxRootContainer.propTypes = {
  store: PropTypes.object,
  history: PropTypes.object,
  routes: PropTypes.object,
};

export default ReduxRootContainer;
