import React from 'react';
import { Route, IndexRedirect } from 'react-router';

import { Portal } from 'pages/';

export default (
  <Route path="/">
    <IndexRedirect to="/Portal" component={Portal} />
    <Route path="/portal" component={Portal} />
  </Route>
);
