import React from 'react';
import { render } from 'react-dom';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import configureReduxStore from './redux/configureStore';

import ReduxRootContainer from './redux/container/Root';
import routes from './routes';
import reducers from './reducers';

import 'antd/dist/antd.css';
import 'styles/app.scss';

const store = configureReduxStore(reducers, browserHistory);
const history = syncHistoryWithStore(browserHistory, store);

render(
  <ReduxRootContainer store={store} history={history} routes={routes} />
, document.getElementById('app'));
