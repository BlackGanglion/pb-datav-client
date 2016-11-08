import React, { Component, PropTypes } from 'react';
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
  static propTypes = {
    getAllNodesList: PropTypes.func,
  };

  componentDidMount() {
    this.props.getAllNodesList();
  }

  render() {
    return (
      <div className="portal-main">
      </div>
    )
  }
}

export default Portal;

