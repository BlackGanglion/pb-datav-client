import React, { Component } from 'react';
import { actions } from './PortalRedux';
import { connect } from 'react-redux';

import { Button } from 'antd';

import './Portal.scss';

@connect((state, ownProps) => {
  return {
    ...state.portal.page,
  };
}, {
  ...actions,
})
class Portal extends Component {
  render() {
    return (
      <div>
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
        <Button type="ghost">Ghost</Button>
        <Button type="dashed">Dashed</Button>
      </div>
    )
  }
}

export default Portal;

