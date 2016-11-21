import { combineReducers } from 'redux';
import { getUrl } from 'utils/UrlMap';
import _ from 'lodash';

import ForceReducer from 'components/ForceChart/ForceRedux';

const ACTION_PREFIX = 'portal/';

const initialState = {
  isLoadingMap: true,
  isLoadingAllNodes: true,
  hasAllNodesError: false,
  allNodesList: [],
  selectedKeys: ['map'],

  // K区域
  clusterCount: 3,
  // loading, success
  clusterStatus: 'success',
  isClusterZoom: false,
  kSelectedNode: null,
  kAreaList: [],
  clusters: [],
  id: 0,

  // 力引导布局
  selectedDate: '2014-03-23',
  selectedHour: '-1',
  selectedCluster: {},
  nodeLinkData: {},
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

const updateClusters = (clusters) => {
  return {
    type: UPDATE_CLUSTERS,
    payload: clusters,
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
  &day=2014_04_16
  &hour=16
  */

  if (hour === "-1") {
    return {
      types: [GET_NODE_LINK, GET_NODE_LINK_SUCCESS, GET_NODE_LINK_FAILURE],
      url: getUrl('nodeConnect'),
      params: {
        nodeId,
        day: `${dateList[0]}_${dateList[1]}_${dateList[2]}`,
      }
    }
  }

  return {
    types: [GET_NODE_LINK, GET_NODE_LINK_SUCCESS, GET_NODE_LINK_FAILURE],
    url: getUrl('nodeConnect'),
    params: {
      nodeId,
      day: `${dateList[0]}_${dateList[1]}_${dateList[2]}`,
      hour,
    }
  }
}

const SELECTED_CLUSTER_FN = ACTION_PREFIX + 'SELECTED_CLUSTER_FN';

const selectedClusterFn = (cluster) => {
  return {
    type: SELECTED_CLUSTER_FN,
    payload: cluster,
  }
}

export const actions = {
  getAllNodesList,
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
      }
    }
    case UPDATE_SELECTED_HOUR: {
      return {
        ...state,
        selectedHour: payload,
      }
    }
    case SELECTED_CLUSTER_FN: {
      const { id } = payload;
      return {
        ...state,
        selectedCluster: payload,
        clusters: state.clusters.map((cluster) => {
          if (cluster.id === id) {
            return {
              ...cluster,
              selected: true,
            }
          }
          return {
            ...cluster,
            selected: false,
          };
        })
      }
    }
    case GET_NODE_LINK_SUCCESS: {
      return {
        ...state,
        nodeLinkData: payload,
      };
    }
    default:
      return state;
  }
}

export default combineReducers({
  page: PortalReducer,
  force: ForceReducer,
});


