import React, { Component, PropTypes } from 'react';
import { actions } from './PortalRedux';
import { connect } from 'react-redux';
import _ from 'lodash';
import Events from 'oui-dom-events';

import { Menu, Icon, Spin, Input, Button } from 'antd';

import './Portal.scss';

const DEFAULT_X = 120.159040411661;
const DEFAULT_Y = 30.2428426084585;

import markersCluster from 'components/BaiduMap/MarkersCluster';
import circleLocalSearch from 'components/BaiduMap/Circle';
import Kcluster from 'components/Kcluster/Kcluster';

@connect((state, ownProps) => {
  return {
    ...state.portal.page,
  };
}, {
  ...actions,
})
class Portal extends Component {
  static propTypes = {
    // store state
    getAllNodesList: PropTypes.func,
    allNodesList: PropTypes.array,
    isLoadingAllNodes: PropTypes.bool,
    isLoadingMap: PropTypes.bool,
    selectedKeys: PropTypes.array,
    clusterCount: PropTypes.number,

    // actions
    closeLoading: PropTypes.func,
    changeSelectKeys: PropTypes.func,
    changeClusterCount: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      height: document.documentElement.clientHeight,
    };
  }

  initMap(nodes) {
    // 创建地图实例
    const map = new BMap.Map("allmap");
    // 创建点坐标
    const point = new BMap.Point(DEFAULT_X, DEFAULT_Y);

    map.centerAndZoom(point, 12); // 初始化地图，设置中心点坐标和地图级别
    map.enableScrollWheelZoom();
    map.addControl(new BMap.NavigationControl()); //添加默认缩放平移控件

    // 请求所有节点完成点聚类
    markersCluster(map, nodes);
    circleLocalSearch(map);

    this.props.closeLoading();
  }

  handleReheight() {
    const height = document.documentElement.clientHeight;

    this.setState({
      height,
    });
  }

  componentDidMount() {
    // 请求所有站点
    this.props.getAllNodesList();

    // 调整Map高度
    this.handleReheightFn = _.throttle(this.handleReheight.bind(this), 120);
    Events.on(window, 'resize', this.handleReheightFn);
  }

  componentWillUnmount() {
    Events.off(window, 'resize', this.handleReheightFn);
    this.handleReheightFn = null;
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.allNodesList.length && nextProps.allNodesList.length) {
      // 初始化地图
      this.initMap(nextProps.allNodesList);
    }
  }

  handleMeunClick(e) {
    const { key } = e;
    this.props.changeSelectKeys(key);
  }

  render() {
    const { height } = this.state;

    const { selectedKeys, isLoadingAllNodes, isLoadingMap,
      clusterCount, allNodesList } = this.props;

    return (
      <Spin
        tip="系统功能初始化中..."
        spinning={isLoadingAllNodes || isLoadingMap}
      >
        <div className="portal-main" style={{ height }}>
          <div className="portal-map" id="allmap"></div>
          <div className="portal-left-list">
            <div className="portal-meun">
              <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                style={{ width: 240 }}
                onClick={::this.handleMeunClick}
              >
                <Menu.Item key="map">
                  <i className="icon icon-map"/>全局站点底图
                </Menu.Item>
                <Menu.Item key="kCluster">
                  <i className="icon icon-k"/>全局站点K-means聚类
                </Menu.Item>
                <Menu.Item key="force">
                  <i className="icon icon-force"/>区域力引导布局
                </Menu.Item>
                <Menu.Item key="areaLine">
                  <i className="icon icon-line"/>区域时间飞线
                </Menu.Item>
              </Menu>
            </div>
            <div className="portal-control">
              {selectedKeys[0] === 'kCluster' ?
              (<div className="portal-control-cluster">
                <Input
                  placeholder="请输入聚类个数"
                  value={clusterCount}
                  onChange={(e) => {
                    this.props.changeClusterCount(e.target.value);
                  }}
                />
                <Button
                  type="primary"
                  // onClick={::this.start}
                >开始聚类</Button>
              </div>) : null}
            </div>
          </div>
          <div className="portal-main-list">
            {selectedKeys[0] === 'kCluster' ? <Kcluster data={allNodesList} /> : null}
          </div>
        </div>
      </Spin>
    )
  }
}

export default Portal;

