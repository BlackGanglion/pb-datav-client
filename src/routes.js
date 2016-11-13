import React from 'react';
import { Route, IndexRedirect } from 'react-router';

import { Portal } from 'pages/';

export default (
  <Route path="/endWork/">
    <IndexRedirect to="Portal" component={Portal} />
    <Route path="Portal" component={Portal} />
  </Route>
);
