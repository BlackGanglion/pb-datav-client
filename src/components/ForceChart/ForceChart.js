import React, { PureComponent, PropTypes } from 'react';
import _ from 'lodash';

import './ForceChart.scss';

class ForceChart extends PureComponent {
  static propTypes = {
    data: PropTypes.array,
    date: PropTypes.string,
    hour: PropTypes.string,
    cluster: PropTypes.object,
    isRender: PropTypes.bool,
    requestData: PropTypes.func,
  }

  renderForceChart(data) {
    console.log(data);
  }

  componentWillReceiveProps(nextProps) {
    const { data, date, hour, cluster } = nextProps;

    console.log(nextProps);
    // 更新数据时更新图
    if (!_.isEqual(data, this.props.data)) {
      this.renderForceChart(data);
    }

    // 更新时间和聚类时
    if (!_.isEqual(date, this.props.date)
      || !_.isEqual(hour, this.props.hour)
      || !_.isEqual(cluster, this.props.cluster)) {
      if (!_.isEmpty(cluster) && !_.isEmpty(date) && !_.isEmpty(hour)) {
        this.props.requestData(cluster, date, hour);
      }
    }
  }

  render() {
    const { data, date, hour, isRender, children } = this.props;
    if (_.isEmpty(data) || _.isEmpty(date) || _.isEmpty(hour)) {
      <div style={{ display: isRender ? 'block' : 'none' }}>
      </div>
    }
    return (
      <div style={{ display: isRender ? 'block' : 'none' }}>
        {children}
      </div>
    );
  }
}

export default ForceChart;

