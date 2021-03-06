import { combineReducers } from 'redux';
import { getUrl } from 'utils/UrlMap';
import _ from 'lodash';
import { randomColor } from 'utils/utils';

import ForceReducer from 'components/ForceChart/ForceRedux';
import AreaLineReducer from 'components/AreaLine/AreaLineRedux';

const ACTION_PREFIX = 'portal/';

const initialState = {
  // 全局
  isLoadingMap: true,
  isLoadingAllNodes: true,
  hasAllNodesError: false,
  allNodesList: [],
  selectedKeys: ['map'],
  loadingTip: '系统功能初始化中...',
  // 选择显示点信息(node)或者边信息(link)
  kSelectedNode: null,
  // 区域列表
  clusters: [],
  // 节点列表
  nodes: [],
  // 区域自增id
  id: 0,

  // 站点底图
  // scatter, cluster
  allStaMethod: 'scatter',
  isShowKResult: true,

  // K聚类
  clusterCount: 3,
  // loading, success
  clusterStatus: 'success',
  isClusterZoom: false,
  // K聚类结果
  kAreaResult: [],

  // 力引导布局
  tabModelKey: "1",
  selectedDate: '2014-03-23',
  selectedHour: '-1',
  selectedCluster: {},
  selectedClusters: [],
  // 共用
  nodeLinkData: {},
  // combo配置导入
  isInputCombo: false,
  researchClusters: [],
  // 区域间研究模式, k为K-means，p为上方高亮区域
  researchModel: null,
  clubNumber: 0,

  // 飞线
  startSelectedDate: null,
  endSelectedDate: null,
  startSelectedHour: null,
  endSelectedHour: null,
  areaLineCluster: null,
  isShowtexts: false,
  forceUpdate: false,
};

const LOAD_ALLNODES_LIST = ACTION_PREFIX + 'LOAD_ALLNODES_LIST';
const LOAD_ALLNODES_LIST_SUCCESS = ACTION_PREFIX + 'LOAD_ALLNODES_LIST_SUCCESS';
const LOAD_ALLNODES_LIST_FAILURE = ACTION_PREFIX + 'LOAD_ALLNODES_LIST_FAILURE';

const getAllNodesList = () => {
  return {
    types: [LOAD_ALLNODES_LIST, LOAD_ALLNODES_LIST_SUCCESS, LOAD_ALLNODES_LIST_FAILURE],
    url: getUrl('allNodes'),
  }
}

const CLOSE_MAP_LOADING = ACTION_PREFIX + 'CLOSE_MAP_LOADING';

const closeLoading = () => {
  return {
    type: CLOSE_MAP_LOADING,
  }
}

const OPEN_MAP_LOADING = ACTION_PREFIX + 'OPEN_MAP_LOADING';

const openLoading = (tip) => {
  return {
    type: OPEN_MAP_LOADING,
    payload: tip,
  }
}

const CHANGE_SELECT_KEYS = ACTION_PREFIX + 'CHANGE_SELECT_KEYS';

const changeSelectKeys = (key) => {
  return {
    type: CHANGE_SELECT_KEYS,
    payload: key,
  }
}

const CHANGE_CLUSTER_COUNT = ACTION_PREFIX + 'CHANGE_CLUSTER_COUNT';

const changeClusterCount = (value) => {
  return {
    type: CHANGE_CLUSTER_COUNT,
    payload: value,
  }
}

const CHANGE_CLUSTER_STATUS = ACTION_PREFIX + 'CHANGE_CLUSTER_STATUS';

const changeClusterStatus = (status) => {
  return {
    type: CHANGE_CLUSTER_STATUS,
    payload: status,
  }
}

const CHANGE_IS_ZOOM = ACTION_PREFIX + 'CHANGE_IS_ZOOM';

const changeIsZoom = (isZoom) => {
  return {
    type: CHANGE_IS_ZOOM,
    payload: isZoom,
  }
}

const K_SELECT_NODE = ACTION_PREFIX + 'K_SELECT_NODE';

const kSelectedNodeFn = (nodeId) => {
  return {
    type: K_SELECT_NODE,
    payload: nodeId,
  }
}

const UPDATE_CLUSTERS = ACTION_PREFIX + 'UPDATE_CLUSTERS';

// 批量新增区域
const updateClusters = (clusters) => {
  return {
    type: UPDATE_CLUSTERS,
    payload: clusters,
  }
}

const UPDATE_CLUSTER = ACTION_PREFIX + 'UPDATE_CLUSTER';

// 更新区域状态
const updateCluster = (index, cluster) => {
  return {
    type: UPDATE_CLUSTER,
    payload: {
      cluster,
      index,
    }
  }
}

const DELECT_CLUSTER = ACTION_PREFIX + 'DELECT_CLUSTER';

// 删除区域状态
const deleteCluster = (index) => {
  return {
    type: DELECT_CLUSTER,
    payload: index,
  }
}

const DELECT_CLUSTERS = ACTION_PREFIX + 'DELECT_CLUSTERS';

// 删除区域组
const deleteClusters = () => {
  return {
    type: DELECT_CLUSTERS,
  }
}

const UPDATE_SELECTED_DATE = ACTION_PREFIX + 'UPDATE_SELECTED_DATE';

const updateSelectedDate = (date) => {
  return {
    type: UPDATE_SELECTED_DATE,
    payload: date,
  }
}

const UPDATE_SELECTED_HOUR = ACTION_PREFIX + 'UPDATE_SELECTED_HOUR';

const updateSelectedHour = (hour) => {
  return {
    type: UPDATE_SELECTED_HOUR,
    payload: hour,
  }
}

const CAL_CLUSTERS_DIS = ACTION_PREFIX + 'CAL_CLUSTERS_DIS';
const CAL_CLUSTERS_DIS_SUCCESS = ACTION_PREFIX + 'CAL_CLUSTERS_DIS_SUCCESS';
const CAL_CLUSTERS_DIS_FAILURE = ACTION_PREFIX + 'CAL_CLUSTERS_DIS_FAILURE';

const calClustersDis = (clustersInfo, colorList, date, hour) => {
  const dateList = date.split('-');

  if (hour === "-1") {
    return {
      types: [CAL_CLUSTERS_DIS, CAL_CLUSTERS_DIS_SUCCESS, CAL_CLUSTERS_DIS_FAILURE],
      url: getUrl('calCluster'),
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain',
        'Content-Type': 'application/json, text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        ...clustersInfo,
        colorList,
        day: `${dateList[0]}${dateList[1]}${dateList[2]}`,
      }),
    }
  }

  return {
    types: [CAL_CLUSTERS_DIS, CAL_CLUSTERS_DIS_SUCCESS, CAL_CLUSTERS_DIS_FAILURE],
    url: getUrl('calCluster'),
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain',
      'Content-Type': 'application/json, text/plain;charset=UTF-8',
    },
    body: JSON.stringify({
      ...clustersInfo,
      colorList,
      day: `${dateList[0]}${dateList[1]}${dateList[2]}`,
      hour,
    }),
  }
}

const GET_NODE_LINK = ACTION_PREFIX + 'GET_NODE_LINK';
const GET_NODE_LINK_SUCCESS = ACTION_PREFIX + 'GET_NODE_LINK_SUCCESS';
const GET_NODE_LINK_FAILURE = ACTION_PREFIX + 'GET_NODE_LINK_FAILURE';

const getNodeLinkData = (cluster, date, hour) => {
  console.log(cluster, date, hour);

  const dateList = date.split('-');

  const nodeId = cluster.nodeList.map((node, i) => {
    return node.id;
  }).join(',');

  /*
  http://localhost:8080/endWork/nodeConnect.json?
  nodeId=5509,5202,5199,5400,5399,8004,8033,5198,5203
  &day=20140416
  &hour=16
  */

  if (hour === "-1") {
    return {
      types: [GET_NODE_LINK, GET_NODE_LINK_SUCCESS, GET_NODE_LINK_FAILURE],
      url: getUrl('nodeConnect'),
      params: {
        nodeId,
        day: `${dateList[0]}${dateList[1]}${dateList[2]}`,
      }
    }
  }

  return {
    types: [GET_NODE_LINK, GET_NODE_LINK_SUCCESS, GET_NODE_LINK_FAILURE],
    url: getUrl('nodeConnect'),
    params: {
      nodeId,
      day: `${dateList[0]}${dateList[1]}${dateList[2]}`,
      hour,
    }
  }
}

const SELECTED_CLUSTER_FN = ACTION_PREFIX + 'SELECTED_CLUSTER_FN';

const selectedClusterFn = (index) => {
  return {
    type: SELECTED_CLUSTER_FN,
    payload: index,
  }
}

const CHANGE_ALL_STA_METHOD = ACTION_PREFIX + 'CHANGE_ALL_STA_METHOD';

const changeAllStaMethod = (title) => {
  return {
    type: CHANGE_ALL_STA_METHOD,
    payload: title,
  }
}

const K_AREA_RESULT = ACTION_PREFIX + 'K_AREA_RESULT';
const updateKAreaResult = (result) => {
  return {
    type: K_AREA_RESULT,
    payload: result,
  }
}

const CHANGE_IS_SHOW_RESULT = ACTION_PREFIX + 'CHANGE_IS_SHOW_RESULT';
const changeIsShowKResult = (isShowKResult) => {
  return {
    type: CHANGE_IS_SHOW_RESULT,
    payload: isShowKResult,
  }
}

const CHANGE_FORCE_TAB = ACTION_PREFIX + 'CHANGE_FORCE_TAB';
const changeForceTab = (key) => {
  return {
    type: CHANGE_FORCE_TAB,
    payload: key,
  }
}

const UPDATE_SELECT_LINK = ACTION_PREFIX + 'UPDATE_SELECT_LINK';
const updateSelectedLink = (link) => {
  return {
    type: UPDATE_SELECT_LINK,
    payload: link,
  }
}

const RESEARCH_CLUSTERS = ACTION_PREFIX + 'RESEARCH_CLUSTERS';

const getResearchClusters = (researchClusters, researchModel) => {
  return {
    type: RESEARCH_CLUSTERS,
    payload: {
      researchClusters,
      researchModel,
    },
  }
}

const UPDATE_AREA_LINE_CONFIG = ACTION_PREFIX + 'UPDATE_AREA_LINE_CONFIG';

const updateAreaLineConfig = (config) => {
  return {
    type: UPDATE_AREA_LINE_CONFIG,
    payload: config,
  }
}

const CHANGE_TEXTS_SHOW = ACTION_PREFIX + 'CHANGE_TEXTS_SHOW';

const changeTextsShow = (status) => {
  return {
    type: CHANGE_TEXTS_SHOW,
    payload: status,
  }
}

const ADD_SELECT_NODES = ACTION_PREFIX + 'ADD_SELECT_NODES';

const addSelectedNode = (node) => {
  return {
    type: ADD_SELECT_NODES,
    payload: node,
  }
}

const DELECTE_SELECT_NODE = ACTION_PREFIX + 'DELECTE_SELECT_NODE';

const deleteSelectedNode = (id) => {
  return {
    type: DELECTE_SELECT_NODE,
    payload: id,
  }
}

const DELECTE_SELECT_NODES = ACTION_PREFIX + 'DELECTE_SELECT_NODES';

const deleteSelectedNodes = () => {
  return {
    type: DELECTE_SELECT_NODES,
  }
}

const joinSelectNodes = () => {
  return (dispatch, getState) => {
    const state = getState();

    const { nodes } = state.portal.page;

    dispatch(updateClusters([{
      nodeList: nodes,
      color: randomColor(),
    }]));

    return dispatch(deleteSelectedNodes());
  }
}

const COMBO_UPDATE = ACTION_PREFIX + 'COMBO_UPDATE';

const comboUpdate = (data, combo) => {
  const nums = combo.split('\n');

  let clubNumber = -1;

  nums.forEach((num) => {
    if (Number(num) > clubNumber) clubNumber = num;
  });

  return {
    type: COMBO_UPDATE,
    payload: {
      isInputCombo: true,
      nodeLinkData: {
        nodes: data.nodes.map((node, i) => {
          return {
            ...node,
            realGroup: Number(nums[i]),
          }
        }),
        links: data.links,
      },
      clubNumber: Number(clubNumber) + 1,
    }
  }
}

export const actions = {
  getAllNodesList,
  openLoading,
  closeLoading,
  changeSelectKeys,
  changeClusterCount,
  changeClusterStatus,
  changeIsZoom,
  kSelectedNodeFn,
  updateClusters,
  updateSelectedDate,
  updateSelectedHour,
  getNodeLinkData,
  selectedClusterFn,
  calClustersDis,
  changeAllStaMethod,
  updateKAreaResult,
  changeIsShowKResult,
  updateCluster,
  deleteCluster,
  deleteClusters,
  changeForceTab,
  updateSelectedLink,
  getResearchClusters,
  updateAreaLineConfig,
  changeTextsShow,

  addSelectedNode,
  deleteSelectedNode,
  deleteSelectedNodes,
  joinSelectNodes,
  comboUpdate,
};

function PortalReducer(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case LOAD_ALLNODES_LIST: {
      return {
        ...state,
        isLoadingAllNodes: true,
        hasAllNodesError: false,
      }
    }
    case LOAD_ALLNODES_LIST_SUCCESS: {
      const { nodes } = payload;
      return {
        ...state,
        allNodesList: nodes,
        isLoadingAllNodes: false,
        hasAllNodesError: false,
      }
    }
    case LOAD_ALLNODES_LIST_FAILURE: {
      return {
        ...state,
        isLoadingAllNodes: false,
        hasAllNodesError: true,
        loadingTip: 'allNodes接口出错, 请检查',
      }
    }
    case OPEN_MAP_LOADING: {
      return {
        ...state,
        isLoadingMap: true,
        loadingTip: payload,
      }
    }
    case CLOSE_MAP_LOADING: {
      return {
        ...state,
        isLoadingMap: false,
      }
    }
    case CHANGE_SELECT_KEYS: {
      return {
        ...state,
        selectedKeys: [payload],
        selectedClusterId: {},
      }
    }
    case CHANGE_CLUSTER_COUNT: {
      return {
        ...state,
        clusterCount: payload,
      }
    }
    case CHANGE_CLUSTER_STATUS: {
      return {
        ...state,
        clusterStatus: payload,
      }
    }
    case CHANGE_IS_ZOOM: {
      return {
        ...state,
        isClusterZoom: payload,
      }
    }
    case K_SELECT_NODE: {
      const { allNodesList } = state;

      const kSelectedNode = _.find(allNodesList, { id: payload });
      return {
        ...state,
        kSelectedNode,
      }
    }
    /*
    格式 nodeList, id, selected, color
    selectedHandler
    */
    case UPDATE_CLUSTERS: {
      const { id, clusters } = state;
      return {
        ...state,
        clusters: [
          ...clusters,
          // id为编号，selected是否被选中
          ...payload.map((item, i) => {
            return {
              ...item,
              id: id + i,
              selected: false,
              selectedHandler: null,
            }
          }),
        ],
        id: id + payload.length,
      }
    }
    case UPDATE_SELECTED_DATE: {
      return {
        ...state,
        selectedDate: payload,
        isInputCombo: false,
      }
    }
    case UPDATE_SELECTED_HOUR: {
      return {
        ...state,
        selectedHour: payload,
        isInputCombo: false,
      }
    }
    case SELECTED_CLUSTER_FN: {
      return {
        ...state,
        selectedCluster: state.clusters[payload],
        isInputCombo: false,
      }
    }
    case GET_NODE_LINK: {
      return {
        ...state,
        nodeLinkData: [],
        isInputCombo: false,
      }
    }
    case GET_NODE_LINK_SUCCESS: {
      return {
        ...state,
        nodeLinkData: payload,
      };
    }
    case CHANGE_ALL_STA_METHOD: {
      return {
        ...state,
        allStaMethod: payload,
        isLoadingMap: true,
        loadingTip: '模式切换中...',
        // isShowKResult: false,
      }
    }
    case K_AREA_RESULT: {
      return {
        ...state,
        kAreaResult: payload,
        isShowKResult: true,
      }
    }
    case CHANGE_IS_SHOW_RESULT: {
      return {
        ...state,
        isShowKResult: payload,
      }
    }
    case UPDATE_CLUSTER: {
      const { index, cluster } = payload;

      return {
        ...state,
        clusters: state.clusters.map((item, i) => {
          if (i === index) {
            return cluster;
          }
          return item;
        })
      }
    }
    case DELECT_CLUSTER: {
      const newClusters = [];

      state.clusters.forEach((cluster, i) => {
        if (i !== payload) {
          newClusters.push(cluster);
        }
      });

      return {
        ...state,
        clusters: newClusters,
      }
    }
    case DELECT_CLUSTERS: {
      return {
        ...state,
        clusters: [],
      }
    }
    case CHANGE_FORCE_TAB: {
      return {
        ...state,
        tabModelKey: payload,
        selectedCluster: {},
        researchClusters: [],
        nodeLinkData: {},
        isInputCombo: false,
      }
    }
    case UPDATE_SELECT_LINK: {
      return {
        ...state,
        kSelectedNode: payload,
      }
    }
    case RESEARCH_CLUSTERS: {
      const { researchModel, researchClusters } = payload;
      return {
        ...state,
        researchClusters,
        researchModel,
      }
    }
    case CAL_CLUSTERS_DIS: {
      return {
        ...state,
        isInputCombo: false,
      }
    }
    case CAL_CLUSTERS_DIS_SUCCESS: {
      return {
        ...state,
        nodeLinkData: payload,
      }
    }
    case CAL_CLUSTERS_DIS: {
      return {
        ...state,
        nodeLinkData: {},
      }
    }
    case UPDATE_AREA_LINE_CONFIG: {
      const {
        clusterIndex,
        startSelectedDate,
        endSelectedDate,
        startSelectedHour,
        endSelectedHour,
        forceUpdate,
      } = payload;

      return {
        ...state,
        areaLineCluster: state.clusters[clusterIndex],
        startSelectedDate,
        endSelectedDate,
        startSelectedHour,
        endSelectedHour,
        forceUpdate,
      }
    }
    case CHANGE_TEXTS_SHOW: {
      return {
        ...state,
        isShowtexts: payload,
      }
    }
    case ADD_SELECT_NODES: {
      return {
        ...state,
        nodes: [
          ...state.nodes,
          payload,
        ],
      }
    }
    case DELECTE_SELECT_NODE: {
      const id = payload;
      return {
        ...state,
        nodes: state.nodes.filter((node) => {
          return node.id !== id;
        })
      }
    }
    case DELECTE_SELECT_NODES: {
      return {
        ...state,
        nodes: [],
      }
    }
    case COMBO_UPDATE: {
      return {
        ...state,
        nodeLinkData: payload.nodeLinkData,
        isInputCombo: payload.isInputCombo,
        clubNumber: payload.clubNumber,
      }
    }
    default:
      return state;
  }
}

export default combineReducers({
  page: PortalReducer,
  force: ForceReducer,
  areaLine: AreaLineReducer,
});


