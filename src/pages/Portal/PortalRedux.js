import { combineReducers } from 'redux';

const ACTION_PREFIX = 'portal/';

const initialState = {

};

export const actions = {

};

function PortalReducer(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    default:
      return state;
  }
}

export default combineReducers({
  page: PortalReducer,
});


