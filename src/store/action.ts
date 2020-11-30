import {JOIN, LEAVE, PUBLISH, UNPUBLISH, MUTEVIDEO, UNMUTEVIDEO, MUTEAUDIO, UNMUTEAUDIO} from './const'

const jointAction = {"type": JOIN}
const leaveAction = {"type": LEAVE}
const publishAction = {"type": PUBLISH}
const unpublishAction = {"type": UNPUBLISH}

export const join = stream => {
	return Object.assign({}, jointAction, {
        payload: stream
      });
}
export const leave = stream => {
	return Object.assign({}, leaveAction, {
        payload: stream
      });
}
export const publish = stream => {
	return Object.assign({}, publishAction, {
        payload: stream
      });
}
export const unpublish = stream => {
	return Object.assign({}, unpublishAction, {
        payload: stream
      });
}
