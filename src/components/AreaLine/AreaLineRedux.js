const ACTION_PREFIX = 'areaLine/';

const initialState = {
  nodeList: [],
  areaLinePool: [],
  requestData: [],
}

const UPDATE_NODE_LIST = ACTION_PREFIX + 'UPDATE_NODE_LIST';

const updateNodeList = (nodeList) => {
  return {
    type: UPDATE_NODE_LIST,
    payload: nodeList,
  }
}

export const actions = {
  updateNodeList,
}

export default function AreaLineReducer(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case UPDATE_NODE_LIST: {
      return {
        ...state,
        nodeList: payload,
      }
    }
    default:
      return state;
  }
}
