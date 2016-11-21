const ACTION_PREFIX = 'force/';

const initialState = {
  count: 100,
  temperature: 100,
  temperatureMin: 0.01,
  cr: 1,
  ca: 1,
  lastTime: 20,
  isUseClub: false,
  clubNumber: 4,
  g: 0.81,
  gc: 4,
  modelValue: null,
}

const UPDATE_FORCECHART_CONFIG = ACTION_PREFIX + 'UPDATE_FORCECHART_CONFIG';

const updateForceChartConfig = function(config) {
  return {
    type: UPDATE_FORCECHART_CONFIG,
    payload: config,
  }
}

export const actions = {
  updateForceChartConfig,
}

export default function ForceReducer(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case UPDATE_FORCECHART_CONFIG: {
      return {
        ...state,
        ...payload,
      }
    }
    default:
      return state;
  }
}

