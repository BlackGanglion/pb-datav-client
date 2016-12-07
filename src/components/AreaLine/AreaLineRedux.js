const ACTION_PREFIX = 'areaLine/';
import { getUrl } from 'utils/UrlMap';

const initialState = {
  nodeList: [],
  data: [],
  curDate: null,
  curHour: null,
  count: -1,
  isStart: false,
}

const UPDATE_NODE_LIST = ACTION_PREFIX + 'UPDATE_NODE_LIST';

const updateNodeList = (nodeList) => {
  return {
    type: UPDATE_NODE_LIST,
    payload: nodeList,
  }
}

const INIT_AREA_LINE = ACTION_PREFIX + 'INIT_AREA_LINE';

const initAreaLine = () => {
  return {
    type: INIT_AREA_LINE,
  }
}

const REQUEST_AREALINE_DATA = ACTION_PREFIX + 'REQUEST_AREALINE_DATA';
const REQUEST_AREALINE_DATA_SUCCESS = ACTION_PREFIX + 'REQUEST_AREALINE_DATA_SUCCESS';
const REQUEST_AREALINE_DATA_FAILURE = ACTION_PREFIX + 'REQUEST_AREALINE_DATA_FAILURE';

const requestAreaLineData = (cluster, date, hour) => {
  const dateList = date.split('-');

  const nodeId = cluster.nodeList.map((node, i) => {
    return node.id;
  }).join(',');

  return {
    types: [REQUEST_AREALINE_DATA, REQUEST_AREALINE_DATA_SUCCESS, REQUEST_AREALINE_DATA_FAILURE],
    url: getUrl('nodeConnect'),
    params: {
      nodeId,
      day: `${dateList[0]}${dateList[1]}${dateList[2]}`,
      date,
      hour,
    },
  }
}

export const actions = {
  updateNodeList,
  requestAreaLineData,
  initAreaLine,
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
    case INIT_AREA_LINE: {
      return {
        ...state,
        isStart: true,
        curHour: null,
        curDate: null,
      }
    }
    case REQUEST_AREALINE_DATA_SUCCESS: {
      const { links } = payload;

      const { date, hour, isStart } = action.params;

      let count = 0;
      const data = [];
      links.map((link, i) => {
        const { relations } = link;
        relations.forEach((relation) => {
          count = count + relation.value;
          data.push(relation);
        });
      });

      return {
        ...state,
        data,
        count,
        curHour: hour,
        curDate: date,
      }
    }
    default:
      return state;
  }
}
