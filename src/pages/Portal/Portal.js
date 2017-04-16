import React, { Component, PropTypes } from 'react';
import { actions } from './PortalRedux';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';

import {
  Menu, Icon, Spin, Input,
  Button, Progress, Modal, DatePicker, Select,
  message, Tabs
} from 'antd';
const Option = Select.Option;
const TabPane = Tabs.TabPane;
const confirm = Modal.confirm;

import './Portal.scss';

const DEFAULT_X = 120.159040411661;
const DEFAULT_Y = 30.2428426084585;

import markersCluster from 'components/BaiduMap/MarkersCluster';
import pointsCluster from 'components/BaiduMap/PointsCluster';
import { circleAreaSearch, circlePointSearch, clearCircle } from 'components/BaiduMap/Circle';
import convexHull, { clearAreaPolygon, convexHullNodes, clearAreaPolygonNodes } from 'components/BaiduMap/ConvexHull'
import Kcluster from 'components/Kcluster/Kcluster';
import ForceChart from 'components/ForceChart/ForceChart';
import AreaLine from 'components/AreaLine/AreaLine';
import {
  showArea, clearArea,
  showLink, showAreaLink, clearAreaLink,
  showNodes, clearNodes, clearNode,
  clearForceMapNode, showForceMapNode
} from 'components/BaiduMap/AreaShow';

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
    selectedDate: PropTypes.string,
    selectedHour: PropTypes.string,
    nodeLinkData: PropTypes.object,
    selectedCluster: PropTypes.object,
    allStaMethod: PropTypes.string,
    loadingTip: PropTypes.string,

    // actions
    openLoading: PropTypes.func,
    closeLoading: PropTypes.func,
    changeSelectKeys: PropTypes.func,
    changeClusterCount: PropTypes.func,
    changeClusterStatus: PropTypes.func,
    changeIsZoom: PropTypes.func,
    kSelectedNodeFn: PropTypes.func,
    updateClusters: PropTypes.func,
    updateSelectedDate: PropTypes.func,
    updateSelectedHour: PropTypes.func,
    getNodeLinkData: PropTypes.func,
    selectedClusterFn: PropTypes.func,
    calClustersDis: PropTypes.func,
    changeAllStaMethod: PropTypes.func,
    updateCluster: PropTypes.func,
    deleteCluster: PropTypes.func,
    updateAreaLineConfig: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      height: document.documentElement.clientHeight,
      percent: 0,
      // 是否显示面板
      isShowPanel: true,
      // id
      cluster: null,
      flowMin: null,
      flowMax: null,
    };
  }

  kSelectedNodeFn(nodeId) {
    // if (this.props.isStartSelectNodes) {
    const kSelectedNode = _.find(this.props.allNodesList, { id: nodeId });
    this.props.addSelectedNode(kSelectedNode);

    // 映射到地图上
    this.selectedNodes.push({
      id: nodeId,
      handler: showNodes(this.map2, kSelectedNode),
    });
    // }

    this.props.kSelectedNodeFn(nodeId);
  }

  initMap(nodes) {
    const { updateClusters, allStaMethod } = this.props;
    // 创建地图实例

    const mapStyle = {
      styleJson: [{
        "featureType": "all",
        "elementType": "all",
        "stylers": {
          "lightness": 10,
          "saturation": -100
        }
      }],
    };

    this.map = new BMap.Map("allmap");
    this.map.setMapStyle(mapStyle);

    this.map2 = new BMap.Map("allmap2");
    this.map2.setMapStyle(mapStyle);


    // 创建点坐标
    const point = new BMap.Point(DEFAULT_X, DEFAULT_Y);

    // 初始化地图，设置中心点坐标和地图级别
    this.map.centerAndZoom(point, 12);
    this.map2.centerAndZoom(point, 12);
    // this.map.enableScrollWheelZoom();

    // 添加默认缩放平移控件
    this.map.addControl(new BMap.NavigationControl());
    this.map2.addControl(new BMap.NavigationControl());

    this.pointCollection = pointsCluster(this.map2, nodes, this.kSelectedNodeFn.bind(this));

    // 初始化地图多边形圈画
    // 圈画区域
    circlePointSearch(this.map2, nodes, this.kSelectedNodeFn.bind(this));
    circleAreaSearch(this.map, nodes, updateClusters, this.handleShowCluster.bind(this), this.getkAreaResult.bind(this));
    // 圈画点

    this.props.closeLoading();

    this.selectedNodes = [];
  }

  componentDidMount() {
    // 请求所有站点
    this.props.getAllNodesList();
  }

  componentWillUnmount() {
    this.map = null;
    this.map2 = null;
    this.pointCollection = null;
    this.markersCluster = null;
    // K-means显示
    this.areaPolygon = null;
    this.areaPolygonNodes = null;
    // 区域间研究时区域显示
    this.researchArea = null;
    this.researchAreaLink = null;
    // 节点选择时
    this.selectedNodes = null;

    // 区域内
    this.forceMapShowLink = null;
    // 区域间
    this.forceMapShowLinks = null;
  }

  getkAreaResult() {
    return this.props.kAreaResult;
  }

  reInitMap(props) {
    const { allNodesList, allStaMethod } = props;
    if (allStaMethod === 'scatter' && this.map) {
      if (this.markersCluster) this.markersCluster.clearMarkers();
      this.pointCollection = pointsCluster(this.map2, allNodesList, this.kSelectedNodeFn.bind(this));
    }

    if (allStaMethod === 'cluster' && this.map) {
      if (this.pointCollection) this.pointCollection.clear();
      this.markersCluster = markersCluster(this.map2, allNodesList, this.kSelectedNodeFn.bind(this));
    }

    if (allStaMethod === 'noMethod' && this.map) {
      if (this.markersCluster) this.markersCluster.clearMarkers();
      if (this.pointCollection) this.pointCollection.clear();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.allNodesList.length && nextProps.allNodesList.length) {
      // 初始化地图
      this.initMap(nextProps.allNodesList);
    }

    if (this.props.allStaMethod !== nextProps.allStaMethod) {
      this.reInitMap(nextProps);
    }

    if (!_.isEqual(this.props.kAreaResult, nextProps.kAreaResult)) {
      this.areaPolygon = convexHull(
        this.map,
        this.areaPolygon,
        nextProps.kAreaResult,
        nextProps.updateClusters,
        this.handleShowCluster.bind(this),
      );
    }

    if (nextProps.nodeLinkData.links) {
      if (nextProps.researchModel !== this.props.researchModel
        || !_.isEqual(nextProps.nodeLinkData, this.props.nodeLinkData)
        || nextProps.flowMin !== this.props.flowMin
        // || nextProps.flowMax !== this.props.flowMax
      ) {
        // 先清除
        clearAreaLink(this.map, this.forceMapShowLinks);

        const links = nextProps.nodeLinkData.links.filter((link) => {
          if (nextProps.flowMin !== -1 && Number(link.value) < Number(nextProps.flowMin)) return false;
          // if (nextProps.flowMax !== -1 && link.value > nextProps.flowMax) return false;
          return true;
        });

        if (nextProps.researchModel === 'k') {
          const { kAreaResult } = nextProps;

          if (nextProps.nodeLinkData.nodes[0].realGroup != null) {
            this.areaPolygon = convexHull(
              this.map,
              this.areaPolygon,
              nextProps.kAreaResult.map((area, i) => {
                return {
                  ...area,
                  realGroup: nextProps.nodeLinkData.nodes[i].realGroup || -1,
                };
              }),
              nextProps.updateClusters,
              this.handleShowCluster.bind(this),
            );
          }

          this.forceMapShowLinks = showAreaLink(this.map, links, kAreaResult.map((area, i) => {
            return {
              ...area,
              id: i,
              x: area.centroid.x,
              y: area.centroid.y,
              name: `k-means区域${i}`,
              realGroup: nextProps.nodeLinkData.nodes[i].realGroup || -1,
            }
          }));
        }

        if (nextProps.researchModel === 'p') {
          const { researchClusters } = nextProps;
          this.forceMapShowLinks = showAreaLink(this.map, links, researchClusters.map((area, i) => {
            return {
              ...area,
              id: i,
              x: area.centroid.x,
              y: area.centroid.y,
              name: `已选区域${i}`,
            }
          }));
        }
      }
    }
  }

  handleMeunClick(e) {
    const { key } = e;

    this.props.changeSelectKeys(key);
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

  /*
  handleClusterInfo(index) {
    const cluster = this.props.clusters[index].nodeList;

    const items = cluster.map((e, i) => {
      const { name, id } = e;
      return (<p key={i}>{`${id}: ${name}`}</p>);
    });

    Modal.info({
      title: `当前区域 ${index} 节点信息(共 ${cluster.length} 个节点)`,
      content: (
        <div className="cluster-info-model">{items}</div>
      ),
      onOk() {},
    });
  }
  */

  handleShowCluster(index, area = {}) {
    const { clusters, kSelectedNodeFn } = this.props;

    if (index !== -1) {
      const cluster = clusters[index];

      return this.props.updateCluster(index, {
        ...cluster,
        selected: true,
        selectedHandler: showArea(this.map, cluster),
      });
    }

    if (area.color) {
      const index = _.findIndex(clusters, { color: area.color });
      const cluster = clusters[index];

      return this.props.updateCluster(index, {
        ...cluster,
        selected: true,
        selectedHandler: showArea(this.map, cluster),
      });
    }

    const i = clusters.length - 1;
    const cluster = clusters[i];

    return this.props.updateCluster(i, {
      ...cluster,
      selected: true,
      selectedHandler: showArea(this.map, cluster),
    });
  }

  handleNoShowCluster(index) {
    const { clusters } = this.props;
    const cluster = clusters[index];

    clearArea(this.map, cluster.selectedHandler);

    this.props.updateCluster(index, {
      ...cluster,
      selected: false,
      selectedHandler: null,
    });
  }

  renderPortalCluster() {
    const { clusters, selectedKeys, selectedClusterFn } = this.props;

    if (clusters && clusters.length > 0) {
      return clusters.map((cluster, i) => {
        const { color, nodeList, id, selected, selectedHandler } = cluster;

        return (
          <Button
            size="small"
            className="portal-cluster-item"
            style={{
              backgroundColor: color,
              opacity: !selected ? 0.4 : 1,
            }}
            key={i}
            onClick={
              () => {
                if (selected) {
                  this.handleNoShowCluster(i);
                } else {
                  this.handleShowCluster(i);
                }
              }
            }
          >
            <i className="icon icon-delete"
              onClick={(e) => {
                e.stopPropagation();

                const self = this;
                confirm({
                  title: '提醒',
                  content: '是否删除当前区域?',
                  onOk() {
                    if (selectedHandler) {
                      clearArea(self.map, cluster.selectedHandler);
                    }

                    self.props.deleteCluster(i);
                  },
                  onCancel() { },
                });
              }}></i>
            {`区域${id} (${nodeList.length})`}
          </Button>
        );
      });
    }

    return <span className="cluster-empty">暂无生成区域</span>;
  }

  renderPortalNodes() {
    const { nodes } = this.props;

    if (nodes && nodes.length) {
      return nodes.map((node, i) => {
        const { id, name } = node;

        return (
          <Button
            size="small"
            type="primary"
            className="portal-node-item"
            key={i}
          >
            <i className="icon icon-delete"
              onClick={(e) => {
                e.stopPropagation();

                const self = this;
                confirm({
                  title: '提醒',
                  content: '是否删除当前节点?',
                  onOk() {
                    self.props.deleteSelectedNode(id);

                    clearNode(self.map, self.selectedNodes, id);
                  },
                  onCancel() { },
                });
              }}></i>
            {`${id}-${name}`}
          </Button>
        );
      });
    }
    return <span className="cluster-empty">暂无选择节点</span>;
  }

  renderPortalControl() {
    const { selectedKeys, clusterCount, clusterStatus,
      selectedDate, selectedHour, allStaMethod,
      isShowKResult, kAreaResult, isShowSResult, isStartSelectNodes,
      tabModelKey, clusters, isShowtexts, forceUpdate, nodeLinkData } = this.props;

    const options = [];
    options.push(
      <Option value="-1" key="-1">全天</Option>
    );
    for (let i = 0; i <= 23; i++) {
      if (i >= 10) {
        options.push(
          <Option value={String(i)} key={i}>{i}</Option>
        );
      } else {
        options.push(
          <Option value={`0${i}`} key={i}>{`0${i}`}</Option>
        );
      }
    }

    const selectedOptions = [];

    clusters.forEach((cluster, i) => {
      const { selected, id } = cluster;
      selectedOptions.push(
        <Option value={String(i)} key={i}>{`区域${id}`}</Option>
      );
    });

    let valueMin = null;
    let valueMax = null;
    if (nodeLinkData.links && nodeLinkData.links.length) {
      valueMin = nodeLinkData.links[0].value;
      valueMax = nodeLinkData.links[0].value;
      nodeLinkData.links.forEach((link, i) => {
        const { value } = link;
        if (valueMin > value) { valueMin = value; }
        if (valueMax < value) { valueMax = value; }
      });
    }

    return (
      <div>
        <div className="portal-control-map">
          <div className="portal-control-map-title">全局站点</div>
          <div className="portal-control-map-item">
            <Button
              type="primary"
              onClick={() => {
                if (allStaMethod === 'scatter') {
                  this.props.changeAllStaMethod('noMethod');
                }
                if (allStaMethod === 'noMethod') {
                  this.props.changeAllStaMethod('scatter');
                }
                setTimeout(() => {
                  this.props.closeLoading();
                }, 0);
              }}
            >
              {allStaMethod === 'scatter' ? '隐藏所有站点' : '显示所有站点'}
            </Button>
          </div>
          <div className="portal-control-map-item">
            <Button
              type="primary"
              onClick={() => {
                clearCircle(this.map);
              }}
            >清除当前区域圈画</Button>
          </div>
        </div>
        <div className="portal-control-cluster">
          <div className="portal-control-cluster-title">K-means</div>
          <span>请输入区域个数: </span>
          <Input
            style={{ width: '100px' }}
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
              clearAreaPolygon(this.map, this.areaPolygon);
              this.areaPolygon = null;
              clearAreaPolygonNodes(this.map, this.areaPolygonNodes);
              this.areaPolygonNodes = null;
              this.props.changeClusterStatus('loading');
            }}
          >开始聚类</Button>
          <div className="portal-control-map-item">
            {kAreaResult && kAreaResult.length ? <Button
              type="primary"
              onClick={() => {
                if (isShowKResult) {
                  clearAreaPolygon(this.map, this.areaPolygon);
                  this.areaPolygon = null;
                  return this.props.changeIsShowKResult(false);
                }
                this.areaPolygon = convexHull(
                  this.map,
                  this.areaPolygon,
                  kAreaResult,
                  this.props.updateClusters,
                  this.handleShowCluster.bind(this),
                );
                return this.props.changeIsShowKResult(true);
              }}
            >{!isShowKResult ? '显示区域凸包划分结果' : '隐藏区域凸包划分结果'}</Button> : null}
          </div>
          <div className="portal-control-map-item">
            {kAreaResult && kAreaResult.length ? <Button
              type="primary"
              onClick={() => {
                if (isShowSResult) {
                  clearAreaPolygonNodes(this.map, this.areaPolygonNodes);
                  this.areaPolygonNodes = null;
                  return this.props.changeIsShowSResult(false);
                }
                this.areaPolygonNodes = convexHullNodes(
                  this.map,
                  this.areaPolygon,
                  kAreaResult,
                );
                return this.props.changeIsShowSResult(true);
              }}
            >{!isShowSResult ? '显示散点颜色划分结果' : '隐藏散点颜色划分结果'}</Button> : null}
          </div>
        </div>
        {/* <div className="portal-control-map">
          <div className="portal-control-map-title">站点选择</div>
          <Button
            type="primary"
            onClick={() => {
              if (isStartSelectNodes) {
                return this.props.changeStartSelectNodes(false);
              }
              return this.props.changeStartSelectNodes(true);
            }}
          >{isStartSelectNodes ? '结束站点选择' : '开始站点选择'}</Button>
        </div> */}
        <div className="portal-control-force">
          <div className="portal-control-force-title">力导引布局</div>
          <Tabs defaultActiveKey={tabModelKey} onChange={(key) => {
            this.props.changeForceTab(key);
          }}>
            <TabPane tab="区域内关系" key="1">
              <div>
                <Select
                  showSearch
                  style={{ width: '140px' }}
                  placeholder="带有搜索功能, 可直接搜索"
                  optionFilterProp="children"
                  onChange={(value) => {
                    this.setState({
                      cluster: Number(value),
                    });
                  }}
                  notFoundContent="不存在该区域"
                >
                  {selectedOptions}
                </Select>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  type="primary"
                  onClick={() => {
                    this.setState({
                      isShowPanel: true,
                    })
                    if (tabModelKey === "1" && this.state.cluster !== null) {
                      setTimeout(() => {
                        this.props.selectedClusterFn(this.state.cluster);
                      }, 0);
                    }
                  }}
                >确定</Button>
              </div>
              <div>
                <span>日期:</span>
                <DatePicker
                  allowClear={false}
                  value={moment(selectedDate, 'YYYY-MM-DD')}
                  onChange={(date, dateString) => { this.props.updateSelectedDate(dateString); }}
                />
              </div>
              <div className="force-date-tip">时间范围是 2014.03.01 - 2014.06.23</div>
              <div>
                <span>小时:</span>
                <Select
                  value={selectedHour}
                  style={{ width: 160 }}
                  onChange={(value) => { this.props.updateSelectedHour(value); }}
                >
                  {options}
                </Select>
              </div>
            </TabPane>
            <TabPane tab="区域间关系" key="2">
              <div>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  type="primary"
                  size="small"
                  onClick={() => {
                    // 未执行K-means提醒

                    if (kAreaResult && kAreaResult.length > 2) {
                      this.setState({
                        isShowPanel: true,
                      })

                      setTimeout(() => {
                        this.props.getResearchClusters(kAreaResult, 'k');
                      }, 0);
                      return;
                    }

                    Modal.error({
                      title: '提醒',
                      content: '当前K-means聚类未执行或无效',
                    });
                  }}
                >所有K聚类区域</Button>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  type="primary"
                  size="small"
                  onClick={() => {
                    // 未点亮2个以上区域提醒，
                    const nodeMap = {};
                    const selectedClusters = [];
                    let isCoincide = false;
                    clusters.forEach((cluster) => {
                      const { color, nodeList, id, selected } = cluster;

                      if (selected && !isCoincide) {
                        nodeList.forEach((node) => {
                          const { id } = node;

                          if (nodeMap[id]) {
                            isCoincide = true;
                          } else {
                            nodeMap[id] = true;
                          }
                        });

                        if (!isCoincide) {
                          selectedClusters.push(cluster);
                        }
                      }
                    });

                    if (isCoincide) {
                      Modal.error({
                        title: '提醒',
                        content: '当前区域间有站点重叠',
                      });
                      return;
                    }

                    if (selectedClusters.length < 2) {
                      Modal.error({
                        title: '提醒',
                        content: '当前区域点亮数不足两个',
                      });
                      return;
                    }

                    this.setState({
                      isShowPanel: true,
                    });
                    setTimeout(() => {
                      this.props.getResearchClusters(selectedClusters, 'p');
                    }, 0);
                  }}
                >已点亮区域</Button>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  onClick={() => {
                    this.clearKSelectedArea();
                    clearAreaLink(this.map, this.forceMapShowLinks);
                  }}
                  size="small"
                  type="primary"
                >清除</Button>
              </div>
              <div>
                <span>日期:</span>
                <DatePicker
                  allowClear={false}
                  value={moment(selectedDate, 'YYYY-MM-DD')}
                  onChange={(date, dateString) => { this.props.updateSelectedDate(dateString); }}
                />
              </div>
              <div className="force-date-tip">时间范围是 2014.03.01 - 2014.06.23</div>
              <div>
                <span>小时:</span>
                <Select
                  value={selectedHour}
                  style={{ width: 160 }}
                  onChange={(value) => { this.props.updateSelectedHour(value); }}
                >
                  {options}
                </Select>
              </div>
              <div>
                <span>{`车流量范围${valueMin}~${valueMax}`}</span>
                <div style={{ width: '100%', background: 'rgb(255,255,178)', color: 'black' }}> 0 ~ 0.1 </div>
                <div style={{ width: '100%', background: 'rgb(254,204,92)', color: 'white' }}> 0.1 ~ 0.2 </div>
                <div style={{ width: '100%', background: 'rgb(253,141,60)', color: 'white' }}> 0.2 ~ 0.4 </div>
                <div style={{ width: '100%', background: 'rgb(240,59,32)', color: 'white' }}> 0.4 ~ 0.6 </div>
                <div style={{ width: '100%', background: 'rgb(189,0,38)', color: 'white' }}> 0.6 以上 </div>
                <Input placeholder="输入最小值" value={this.state.flowMin || ''} onChange={(e) => {
                  const value = e.target.value;
                  this.setState({ flowMin: value });
                }} />
                <Button type="primary" onClick={() => {
                  const { flowMin, flowMax } = this.state;
                  this.props.changeFlow(flowMin, flowMax);
                }}>确认</Button>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    );
  }

  handleUpdateConvexHull(clusters) {
    this.areaPolygon = convexHull(
      this.map,
      this.areaPolygon,
      clusters,
      this.props.updateClusters,
      this.handleShowCluster.bind(this),
    );
  }

  changeMapLink({ sourceNode, targetNode }) {
    showLink(this.map, sourceNode, targetNode);
  }

  kSelectedArea(id, i) {
    const { researchModel, kAreaResult, clusters } = this.props;

    if (this.researchArea) {
      clearArea(this.map, this.researchArea);
      this.researchArea = null;
    }

    if (researchModel === 'k') {
      this.researchArea = showArea(this.map, kAreaResult[id], false, i);
    }

    if (researchModel === 'p') {
      const selectedArea = _.find(clusters, { id, });
      this.researchArea = showArea(this.map, selectedArea, false, i);
    }
  }

  kSelectedAreaLink(relations) {
    const { allNodesList } = this.props;

    const count = relations.length;

    if (this.researchAreaLink) {
      clearAreaLink(this.map, this.researchAreaLink);
      this.researchAreaLink = null;
    }

    const self = this;
    if (count > 3000) {
      confirm({
        title: '提醒',
        content: `区域间关联边数为${count}, 边数过多, 直接渲染在地图上较慢且可能引起浏览器崩溃，可以分时段/分区域研究，是否继续执行?`,
        onOk() {
          self.researchAreaLink = showAreaLink(self.map, relations, allNodesList);
        },
        onCancel() { },
      });

      return;
    }

    self.researchAreaLink = showAreaLink(self.map, relations, allNodesList);
  }

  // 清除地理映射
  clearKSelectedArea() {
    if (this.researchArea) {
      clearArea(this.map, this.researchArea);
      this.researchArea = null;
    }
    if (this.researchAreaLink) {
      clearAreaLink(this.map, this.researchAreaLink);
      this.researchAreaLink = null;
    }
  }

  forceMapShow({ nodes, links, num }) {
    if (this.props.tabModelKey === "1") {
      clearForceMapNode(this.map, this.forceMapNode);
      this.forceMapNode = showForceMapNode(this.map, nodes, num);
      clearAreaLink(this.map, this.forceMapShowLink);
      this.forceMapShowLink = showAreaLink(this.map, links, this.props.allNodesList);
    }
  }

  render() {
    const { selectedKeys, isLoadingAllNodes, isLoadingMap,
      clusterCount, allNodesList, clusterStatus, isClusterZoom,
      changeIsZoom, kSelectedNode,
      selectedDate, selectedHour, nodeLinkData, selectedCluster,
      loadingTip, tabModelKey, researchClusters,
      startSelectedDate, endSelectedDate,
      startSelectedHour, endSelectedHour,
      areaLineCluster, isShowtexts, forceUpdate,
      isInputCombo, clubNumber, simNodeLinkData
    } = this.props;

    return (
      <Spin
        tip={loadingTip}
        spinning={isLoadingAllNodes || isLoadingMap}
      >
        <div className="portal-main">
          <div className="portal-left-list">
            <div className="portal-control">
              <div className="small-title">操作面板</div>
              {this.renderPortalControl()}
            </div>
          </div>
          <div className="portal-main-list">
            <div className="portal-nodes-main">
              <div className="portal-nodes">
                {this.renderPortalNodes()}
              </div>
              <i className="icon icon-join"
                onClick={(e) => {
                  const { nodes } = this.props;
                  e.stopPropagation();

                  const self = this;

                  if (nodes && nodes.length) {
                    confirm({
                      title: '提醒',
                      content: '是否合并当前节点成为一个区域?',
                      onOk() {
                        self.props.joinSelectNodes();

                        clearNodes(self.map, self.selectedNodes);
                      },
                      onCancel() { },
                    });
                  }
                }}
              ></i>
              <i className="icon icon-delete"
                onClick={(e) => {
                  const { nodes } = this.props;
                  e.stopPropagation();

                  const self = this;
                  if (nodes && nodes.length) {
                    confirm({
                      title: '提醒',
                      content: '是否删除所有节点?',
                      onOk() {
                        self.props.deleteSelectedNodes();

                        clearNodes(self.map, self.selectedNodes);
                      },
                      onCancel() { },
                    });
                  }
                }}></i>
            </div>
            <div className="portal-map" id="allmap2"></div>
            <div className="portal-cluster-main">
              <div className="portal-cluster">
                {this.renderPortalCluster()}
              </div>
              {/*<i className="icon icon-delete"
                onClick={(e) => {
                  const { clusters } = this.props;

                  e.stopPropagation();
                  const self = this;

                  if (clusters && clusters.length > 0) {
                    confirm({
                      title: '提醒',
                      content: '是否删除所有区域?',
                      onOk() {
                        clusters.forEach((cluster) => {
                          clearArea(self.map, cluster.selectedHandler);
                        });
                        self.props.deleteClusters();
                      },
                      onCancel() {},
                  });
                }
              }}></i> */}
            </div>
            <div className="portal-map" id="allmap"></div>
            <ForceChart
              data={nodeLinkData}
              date={selectedDate}
              simNodeLinkData={simNodeLinkData}
              hour={selectedHour}
              tabModelKey={tabModelKey}
              // 研究对象, 切换时清空
              cluster={tabModelKey === "1" ? selectedCluster : researchClusters}
              // 数据请求方法
              requestData={tabModelKey === "1" ? this.props.getNodeLinkData : this.props.calClustersDis}
              isRender
              kSelectedNodeFn={this.kSelectedNodeFn.bind(this)}
              updateSelectedLink={this.props.updateSelectedLink}
              changeMapLink={::this.changeMapLink}
              updateClusters={this.props.updateClusters}
            // 区域间选择显示区域
            kSelectedArea={::this.kSelectedArea}
              kSelectedAreaLink={::this.kSelectedAreaLink}
              isInputCombo={isInputCombo}
            comboUpdate={this.props.comboUpdate}
            clubNumber={this.props.clubNumber}
            forceMapShow={this.forceMapShow.bind(this)}
            />
            <Kcluster
              data={allNodesList}
              count={clusterCount}
              status={clusterStatus}
              changeStatus={this.props.changeClusterStatus}
              isZoom={isClusterZoom}
              changeIsZoom={this.props.changeIsZoom}
              kSelectedNode={kSelectedNode}
              kSelectedNodeFn={this.kSelectedNodeFn.bind(this)}
              updateClusters={this.props.updateClusters}
              setProgress={this.setProgress.bind(this)}
              isRender={false}
              updateConvexHull={::this.handleUpdateConvexHull}
              updateKAreaResult={this.props.updateKAreaResult}
            ></Kcluster>
        </div>
        </div>
      </Spin >
    )
  }
}

export default Portal;
