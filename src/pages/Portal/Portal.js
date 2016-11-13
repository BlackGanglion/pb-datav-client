import React, { Component, PropTypes } from 'react';
import { actions } from './PortalRedux';
import { connect } from 'react-redux';
import _ from 'lodash';
import Events from 'oui-dom-events';

import { Menu, Icon, Spin, Input, Button, Progress, Modal } from 'antd';

import './Portal.scss';

const DEFAULT_X = 120.159040411661;
const DEFAULT_Y = 30.2428426084585;

import markersCluster from 'components/BaiduMap/MarkersCluster';
import circleLocalSearch from 'components/BaiduMap/Circle';
import Kcluster from 'components/Kcluster/Kcluster';

const colors = ["#E6421A", "#AECC33", "#338FCC", "#3CC472", "#723CC4"];

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
    clusterStatus: PropTypes.string,
    isClusterZoom: PropTypes.bool,
    kSelectedNode: PropTypes.object,
    clusters: PropTypes.array,

    // actions
    closeLoading: PropTypes.func,
    changeSelectKeys: PropTypes.func,
    changeClusterCount: PropTypes.func,
    changeClusterStatus: PropTypes.func,
    changeIsZoom: PropTypes.func,
    kSelectedNodeFn: PropTypes.func,
    updateClusters: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      height: document.documentElement.clientHeight,
      percent: 0,
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

  renderPortalInfo() {
    const { selectedKeys, kSelectedNode } = this.props;
    if (selectedKeys[0] === 'kCluster') {
      if (_.isEmpty(kSelectedNode)) return null;

      const { id, x, y, name, rx, ry, address, servicetime } = kSelectedNode;
      return (<div className="station-info">
        <div className="im">
          <strong>{`${id}: ${name}`}</strong>
        </div>
        <div>
          <strong>实际地理坐标:</strong>
        </div>
        <div>{`(${rx}, ${ry})`}</div>
        <div>
          <strong>百度地理坐标</strong>
        </div>
        <div>{`(${x}, ${y})`}</div>
        <div>
          <strong>地址:</strong> {`${address}`}
        </div>
        <div>
          <strong>服务时间:</strong>{`${servicetime}`}
        </div>
      </div>);
    }

    return null;
  }

  changePercent(delay) {
    const { percent } = this.state;
    const newPercent = Math.floor((percent + 100 / delay * 100) * 100) / 100;
    this.setState({
      percent: newPercent >= 100 ? 100 : newPercent,
    });
    if (newPercent < 100) {
      setTimeout(this.changePercent.bind(this, delay), 100);
    }
  }

  setProgress(delay) {
    setTimeout(this.changePercent.bind(this, delay), 100);
  }

  handleClusterInfo(index) {
    const cluster = this.props.clusters[index];

    const items = cluster.map((e, i) => {
      const { name, id } = e;
      return (<p key={i}>{`${id}: ${name}`}</p>);
    });

    Modal.info({
      title: `当前聚类 ${index} 节点信息(共 ${cluster.length} 个节点)`,
      content: (
        <div className="cluster-info-model">{items}</div>
      ),
      onOk() {},
    });
  }

  renderPortalCluster() {
    const { selectedKeys, clusters } = this.props;

    if (selectedKeys[0] === 'kCluster') {
      const { percent } = this.state;

      if (percent == 100 && clusters.length > 0) {
        return clusters.map((cluster, i) => {
          const color = colors[i];

          return (
            <Button
              className="portal-cluster-item"
              style={{
                backgroundColor: color,
              }}
              key={i}
              onClick={this.handleClusterInfo.bind(this, i)}
            >
              {`聚类${i} (${cluster.length})`}
            </Button>
          );
        });
      } else {
        return (
          <Progress
            type="circle"
            percent={percent}
            width={80}
          />
        );
      }
    }

    return null;
  }


  render() {
    const { height } = this.state;

    const { selectedKeys, isLoadingAllNodes, isLoadingMap,
      clusterCount, allNodesList, clusterStatus, isClusterZoom,
      changeIsZoom, kSelectedNode } = this.props;

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
                  <i className="icon icon-map"/>全局 - 站点底图
                </Menu.Item>
                <Menu.Item key="kCluster">
                  <i className="icon icon-k"/>全局 - 站点K-means聚类
                </Menu.Item>
                <Menu.Item key="force">
                  <i className="icon icon-force"/>区域 - 力引导布局
                </Menu.Item>
                <Menu.Item key="areaLine">
                  <i className="icon icon-line"/>区域 - 时间飞线
                </Menu.Item>
              </Menu>
            </div>
            <div className="portal-control">
              {selectedKeys[0] === 'kCluster' ?
              (<div className="portal-control-cluster">
                <Input
                  placeholder="请输入聚类个数"
                  value={clusterCount}
                  disabled={clusterStatus === 'loading'}
                  onChange={(e) => {
                    this.props.changeClusterCount(e.target.value);
                  }}
                />
                <Button
                  type="primary"
                  loading={clusterStatus === 'loading'}
                  onClick={() => {
                    this.setState({ percent: 0 });
                    this.props.changeClusterStatus('loading');
                  }}
                >
                  {clusterStatus === 'loading' ? '聚类中...' : '开始聚类'}
                </Button>
                <Button
                  type="primary"
                  onClick={() => { this.props.changeIsZoom(false); }}
                >放大复原</Button>
              </div>) : null}
            </div>
            <div className="portal-cluster">
              {this.renderPortalCluster()}
            </div>
            <div className="portal-info">
              {this.renderPortalInfo()}
            </div>
          </div>
          <div className="portal-main-list">
            {selectedKeys[0] === 'kCluster' ?
              <Kcluster
                data={allNodesList}
                count={clusterCount}
                status={clusterStatus}
                changeStatus={this.props.changeClusterStatus}
                isZoom={isClusterZoom}
                changeIsZoom={this.props.changeIsZoom}
                kSelectedNode={kSelectedNode}
                kSelectedNodeFn={this.props.kSelectedNodeFn}
                updateClusters={this.props.updateClusters}
                setProgress={this.setProgress.bind(this)}
              /> : null}
          </div>
        </div>
      </Spin>
    )
  }
}

export default Portal;

