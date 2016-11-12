import { combineReducers } from 'redux';
import { getUrl } from 'utils/UrlMap';

const ACTION_PREFIX = 'portal/';

const initialState = {
  isLoadingMap: true,
  isLoadingAllNodes: true,
  hasAllNodesError: false,
  allNodesList: [],
  selectedKeys: ['map'],

  clusterCount: 3,
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

export const actions = {
  getAllNodesList,
  closeLoading,
  changeSelectKeys,
  changeClusterCount,
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
      }
    }
    case CHANGE_CLUSTER_COUNT: {
      return {
        ...state,
        clusterCount: payload,
      }
    }
    default:
      return state;
  }
}

export default combineReducers({
  page: PortalReducer,
});


