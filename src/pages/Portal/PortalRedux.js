import { combineReducers } from 'redux';
import { getUrl } from 'utils/UrlMap';

const ACTION_PREFIX = 'portal/';

const initialState = {
  isLoadingAllNodes: true,
  hasAllNodesError: false,
  allNodesList: [],
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

export const actions = {
  getAllNodesList,
};

function PortalReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_ALLNODES_LIST: {
      return {
        ...state,
        isLoadingAllNodes: true,
        hasAllNodesError: false,
      }
    }
    case LOAD_ALLNODES_LIST_SUCCESS: {
      console.log(action);
      return {
        ...state,
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
    default:
      return state;
  }
}

export default combineReducers({
  page: PortalReducer,
});


