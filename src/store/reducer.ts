import { combineReducers } from 'redux';
import {JOIN, LEAVE, PUBLISH, UNPUBLISH, MUTEVIDEO, UNMUTEVIDEO, MUTEAUDIO, UNMUTEAUDIO} from './const'

const joinReducer = (state = false, action) => {
	const { type, payload } = action;
	switch (type) {
    case JOIN:
      return true;
    case LEAVE:
      return false;
    default: return state;
	}
}
const publishReducer = (state = false, action) => {
	const { type, payload } = action;
	switch (type) {
    case PUBLISH:
      return Object.assign({}, state, {
        publish: true
      });
    case UNPUBLISH:
      return Object.assign({}, state, {
        publish: false
      });
    default: return state;
	}
}

const allReducers = combineReducers({
	join: joinReducer,
	publish: publishReducer,
})
export default allReducers