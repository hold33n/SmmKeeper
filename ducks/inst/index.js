// @flow

import { all, take, takeEvery, put, call, select } from "redux-saga/effects";
import { baseURL } from "config";
import axios from "axios";
import { createAction, handleActions, combineActions } from "redux-actions";
import { SOCKET_CONN_END } from "ducks/socket/const";
import type { State, UserReq, Acc } from "./types";
import { stateSelector as authStateSelector } from "ducks/auth";
import {
  // Acc connecting const
  REQUEST_VERIFICATION_REQUEST,
  REQUEST_VERIFICATION_START,
  REQUEST_VERIFICATION_SUCCESS,
  REQUEST_VERIFICATION_FAIL,
  SET_VERIFICATION_TYPE_REQUEST,
  SET_VERIFICATION_TYPE_START,
  SET_VERIFICATION_TYPE_SUCCESS,
  SET_VERIFICATION_TYPE_FAIL,
  VERIFY_ACC_REQUEST,
  VERIFY_ACC_START,
  VERIFY_ACC_SUCCESS,
  VERIFY_ACC_FAIL,
  CONN_ACC_SUCCESS,
  // Rest
  FETCH_ACCS_REQUEST,
  FETCH_ACCS_START,
  FETCH_ACCS_SUCCESS,
  FETCH_ACCS_FAIL,
  CLEAR_CONN_ERROR,
  FETCH_TASKS_REQUEST,
  FETCH_TASKS_START,
  FETCH_TASKS_SUCCESS,
  FETCH_TASKS_FAIL,
  TASK_CREATE_REQUEST,
  TASK_CREATE_START,
  TASK_CREATE_SUCCESS,
  TASK_CREATE_FAIL,
  STATS_UPDATE_REQUEST,
  STATS_UPDATE_START,
  STATS_UPDATE_SUCCESS,
  STATS_UPDATE_FAIL,
  LIMIT_UPDATE_REQUEST,
  LIMIT_UPDATE_START,
  LIMIT_UPDATE_SUCCESS,
  LIMIT_UPDATE_FAIL
} from "./const";
import { SIGN_OUT_SUCCESS } from "ducks/auth/const";
import { POPUP_CLOSE } from "ducks/createTaskPopup/const";
import { live } from "ducks/socket";
import redirect from "server/redirect";
import type { State as AccReq } from "components/connectAccPopup/types";
import { eventChannel, END } from "redux-saga";
import { setCookie, getCookie, removeCookie } from "server/libs/cookies";
import moment from "moment";

/**
 * Constants
 * */

export const moduleName: string = "inst";

/**
 * Reducer
 * */

export const initialState: State = {
  accList: null,
  tasksList: null,
  proxy: null,
  checkpointUrl: null,
  verificationType: null,
  progressFetchAccs: false,
  progressFetchTasks: false,
  progressStatsUpdate: false,
  progressConnAcc: false,
  progressCreateTask: false,
  progressLimitUpdate: false,
  error: null
};

const instReducer = handleActions(
  {
    [REQUEST_VERIFICATION_START]: (state: State) => ({
      ...state,
      progressConnAcc: true,
      error: null
    }),
    [REQUEST_VERIFICATION_SUCCESS]: (state: State, action) => ({
      ...state,
      progressConnAcc: false,
      error: null,
      proxy: action.payload.proxy,
      checkpointUrl: action.payload.checkpointUrl
    }),
    [REQUEST_VERIFICATION_FAIL]: (state: State, action) => ({
      ...state,
      progressConnAcc: false,
      error: action.payload.error
    }),

    [SET_VERIFICATION_TYPE_START]: (state: State) => ({
      ...state,
      progressConnAcc: true,
      error: null
    }),
    [SET_VERIFICATION_TYPE_SUCCESS]: (state: State, action) => ({
      ...state,
      error: null,
      progressConnAcc: false,
      verificationType: action.payload.verificationType
    }),
    [SET_VERIFICATION_TYPE_FAIL]: (state: State, action) => ({
      ...state,
      progressConnAcc: false,
      error: action.payload.error
    }),

    [VERIFY_ACC_START]: (state: State) => ({
      ...state,
      progressConnAcc: true,
      error: null
    }),
    [VERIFY_ACC_SUCCESS]: (state: State, action) => ({
      ...state,
      error: null,
      progressConnAcc: false
    }),
    [VERIFY_ACC_FAIL]: (state: State, action) => ({
      ...state,
      progressConnAcc: false,
      error: action.payload.error
    }),

    [CONN_ACC_SUCCESS]: (state: State, action) => ({
      ...state,
      progressConnAcc: false,
      error: null,
      proxy: null,
      checkpointUrl: null,
      verificationType: null,
      accList: [...state.accList, action.payload.acc]
    }),

    [FETCH_ACCS_START]: (state: State) => ({
      ...state,
      progressFetchAccs: true,
      error: null
    }),
    [FETCH_ACCS_SUCCESS]: (state: State, action) => ({
      ...state,
      progressFetchAccs: false,
      error: null,
      accList: action.payload.accList
    }),
    [FETCH_ACCS_FAIL]: (state: State, action) => ({
      ...state,
      progressFetchAccs: false,
      error: action.payload.error
    }),

    [FETCH_TASKS_START]: (state: State) => ({
      ...state,
      progressFetchTasks: true,
      error: null
    }),
    [FETCH_TASKS_SUCCESS]: (state: State, action) => ({
      ...state,
      progressFetchTasks: false,
      error: null,
      tasksList: action.payload.tasksList
    }),
    [FETCH_TASKS_FAIL]: (state: State, action) => ({
      ...state,
      progressFetchTasks: false,
      error: action.payload.error
    }),

    [STATS_UPDATE_START]: (state: State) => ({
      ...state,
      progressStatsUpdate: true,
      error: null
    }),
    [STATS_UPDATE_SUCCESS]: (state: State, action) => ({
      ...state,
      progressStatsUpdate: false,
      error: null,
      accList: state.accList.map(
        acc =>
          acc.username === action.payload.username ? action.payload.acc : acc
      )
    }),
    [STATS_UPDATE_FAIL]: (state: State, action) => ({
      ...state,
      progressStatsUpdate: false,
      error: action.payload.error
    }),

    [TASK_CREATE_START]: (state: State) => ({
      ...state,
      progressCreateTask: true,
      error: null
    }),
    [TASK_CREATE_SUCCESS]: (state: State, action) => ({
      ...state,
      tasksList: [action.payload.task, ...state.tasksList],
      progressCreateTask: false,
      error: null
    }),
    [TASK_CREATE_FAIL]: (state: State, action) => ({
      ...state,
      progressCreateTask: false,
      error: action.payload.error
    }),

    [LIMIT_UPDATE_START]: (state: State, action) => ({
      ...state,
      progressLimitUpdate: true,
      error: null
    }),
    [LIMIT_UPDATE_SUCCESS]: (state: State, action) => ({
      ...state,
      progressLimitUpdate: false,
      error: null,
      accList: state.accList.map(
        acc =>
          acc.username === action.payload.username
            ? {
                ...acc,
                limits: {
                  ...acc.limits,
                  [action.payload.type]: {
                    ...acc.limits[action.payload.type],
                    current: action.payload.limitValue
                  }
                }
              }
            : acc
      )
    }),

    [LIMIT_UPDATE_FAIL]: (state: State, action) => ({
      ...state,
      progressLimitUpdate: false,
      error: action.payload.error
    }),

    // [CONN_ACC_FAIL]: (state: State, action) => ({
    //   ...state,
    //   progressConnAcc: false,
    //   error: action.payload.error
    // }),
    // [CONN_ACC_FAIL_CHECKPOINT]: (state: State, action) => ({
    //   ...state,
    //   progressConnAcc: false,
    //   error: action.payload.error,
    //   proxy: action.payload.proxy,
    //   checkpointUrl: action.payload.checkpointUrl
    // }),

    [SIGN_OUT_SUCCESS]: () => initialState,

    [CLEAR_CONN_ERROR]: (state: State, action) => ({
      ...state,
      error: null
    })
  },
  initialState
);

export default instReducer;

/**
 * Selectors
 * */

export const stateSelector = (state: Object): State => state[moduleName];

/**
 * Action Creators
 * */

export const requestVerification = createAction(REQUEST_VERIFICATION_REQUEST);
export const setVerificationType = createAction(SET_VERIFICATION_TYPE_REQUEST);
export const verifyAcc = createAction(VERIFY_ACC_REQUEST);
export const fetchAccs = createAction(FETCH_ACCS_REQUEST);
export const updateStats = createAction(STATS_UPDATE_REQUEST);
export const createTask = createAction(TASK_CREATE_REQUEST);
export const fetchTasks = createAction(FETCH_TASKS_REQUEST);
export const updateLimit = createAction(LIMIT_UPDATE_REQUEST);

/**
 * Sagas
 * */

export const redirectIfInvalidUsername = (
  accList: Acc[],
  queryUsername: string,
  ctx?: Object
) => {
  if (accList.length) {
    // Redirects if /app or /app/some-fake-username
    if (!queryUsername || !accList.find(el => el.username === queryUsername)) {
      // console.log("redirect to ", `/app/${accList[0].username}`);
      redirect(`/app/${accList[0].username}`, ctx);
    }
  } else {
    if (queryUsername) {
      redirect(`/app`, ctx);
    }
  }
};

export function* fetchAccsSaga({
  payload: { token, queryUsername, ctx }
}: {
  payload: { token: string, queryUsername: string, ctx?: Object }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressFetchAccs) return true;

  yield put({ type: FETCH_ACCS_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const fetchAccListRef = {
        method: "post",
        url: "/api/inst/fetch",
        baseURL,
        data: {
          id: user.id,
          token: token
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      const {
        data: { accList }
      } = yield call(axios, fetchAccListRef);

      yield put({
        type: FETCH_ACCS_SUCCESS,
        payload: { accList }
      });

      redirectIfInvalidUsername(accList, queryUsername, ctx);
    } else {
      throw "Can't find user id or email";
    }
  } catch (err) {
    yield put({
      type: FETCH_ACCS_FAIL,
      payload: {
        error: err
      }
    });
  }
}

/* eslint-disable consistent-return */
export function* requestVerificationSaga({
  payload: { username, password }
}: {
  payload: AccReq
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressConnAcc) return true;

  yield put({ type: REQUEST_VERIFICATION_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const ref = {
        method: "post",
        url: "/api/inst/request-verification",
        baseURL,
        data: {
          id: user.id,
          token: localStorage.getItem("tktoken"),
          username,
          password
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      const {
        data: { proxy, checkpointUrl }
      } = yield call(axios, ref);

      yield put({
        type: REQUEST_VERIFICATION_SUCCESS,
        payload: {
          proxy,
          checkpointUrl
        }
      });
    } else {
      yield put({
        type: REQUEST_VERIFICATION_FAIL,
        payload: {
          error: "Can't find user id or email"
        }
      });
    }
  } catch (res) {
    // if (
    //   res.response.data.error.name &&
    //   res.response.data.error.name === "CheckpointRequiredError"
    // ) {
    //   yield put({
    //     type: CONN_ACC_FAIL_CHECKPOINT,
    //     payload: {
    //       error: "You need to approve your log in",
    //       proxy: res.response.data.error.data.proxy,
    //       checkpointUrl: res.response.data.error.data.checkpointUrl
    //     }
    //   });
    // } else {
    yield put({
      type: REQUEST_VERIFICATION_FAIL,
      payload: {
        error: res.response.data.error.message
      }
    });
    // }
  }
}

/* eslint-disable consistent-return */
export function* setVerificationTypeSaga({
  payload: { username, password, verificationType }
}: {
  payload: { ...AccReq, verificationType: "phone" | "email" }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressConnAcc) return true;

  yield put({ type: SET_VERIFICATION_TYPE_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const ref = {
        method: "post",
        url: "/api/inst/set-verification-type",
        baseURL,
        data: {
          id: user.id,
          token: localStorage.getItem("tktoken"),
          proxy: state.proxy,
          checkpointUrl: state.checkpointUrl,
          username,
          password,
          verificationType
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      yield call(axios, ref);

      yield put({
        type: SET_VERIFICATION_TYPE_SUCCESS,
        payload: {
          verificationType
        }
      });
    } else {
      yield put({
        type: SET_VERIFICATION_TYPE_FAIL,
        payload: {
          error: "Can't find user id or email"
        }
      });
    }
  } catch (res) {
    yield put({
      type: SET_VERIFICATION_TYPE_FAIL,
      payload: {
        error: res.response.data.error.message
      }
    });
  }
}

/* eslint-disable consistent-return */
export function* verifyAccSaga({
  payload: { username, password, securityCode }
}: {
  payload: { ...AccReq, securityCode: string }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressConnAcc) return true;

  yield put({ type: VERIFY_ACC_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const ref = {
        method: "post",
        url: "/api/inst/verify-acc",
        baseURL,
        data: {
          id: user.id,
          token: localStorage.getItem("tktoken"),
          proxy: state.proxy,
          checkpointUrl: state.checkpointUrl,
          username,
          password,
          securityCode
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      yield call(axios, ref);

      yield put({
        type: VERIFY_ACC_SUCCESS
      });
    } else {
      yield put({
        type: VERIFY_ACC_FAIL,
        payload: {
          error: "Can't find user id or email"
        }
      });
    }
  } catch (res) {
    yield put({
      type: VERIFY_ACC_FAIL,
      payload: {
        error: res.response.data.error.message
      }
    });
  }
}

/* eslint-disable consistent-return */
export function* fetchTasksSaga({
  payload: { username, token }
}: {
  payload: {
    username: string,
    token: string
  }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressFetchTasks) return true;

  yield put({ type: FETCH_TASKS_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const fetchTasksRef = {
        method: "post",
        url: "/api/inst/fetch-tasks",
        baseURL,
        data: {
          id: user.id,
          token,
          username
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      const {
        data: { tasksList }
      } = yield call(axios, fetchTasksRef);

      yield put({
        type: FETCH_TASKS_SUCCESS,
        payload: { tasksList }
      });
    } else {
      throw "Can't find user id or email";
    }
  } catch (err) {
    yield put({
      type: FETCH_TASKS_FAIL,
      payload: {
        error: err
      }
    });
  }
}

/* eslint-disable consistent-return */
export function* statsUpdateSaga({
  payload: { username, token }
}: {
  payload: {
    username: string,
    token: string
  }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressStatsUpdate) return true;

  yield put({ type: STATS_UPDATE_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const statsUpdateRef = {
        method: "post",
        url: "/api/inst/update-stats",
        baseURL,
        data: {
          id: user.id,
          token,
          username
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      const {
        data: { acc }
      } = yield call(axios, statsUpdateRef);

      yield put({
        type: STATS_UPDATE_SUCCESS,
        payload: { acc, username }
      });
    } else {
      throw "Can't find user id or email";
    }
  } catch (err) {
    yield put({
      type: STATS_UPDATE_FAIL,
      payload: {
        error: err
      }
    });
  }
}

/* eslint-disable consistent-return */
export function* createTaskSaga({
  payload: { username, type, sourceUsername }
}: {
  payload: {
    username: string,
    type: "mf" | "ml",
    sourceUsername: string
  }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressCreateTask) return true;

  yield put({ type: TASK_CREATE_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const connAccRef = {
        method: "post",
        url: "/api/inst/task-create",
        baseURL,
        data: {
          id: user.id,
          token: localStorage.getItem("tktoken"),
          username,
          type,
          sourceUsername
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      yield call(axios, connAccRef);

      yield put({ type: POPUP_CLOSE });
    } else {
      yield put({
        type: TASK_CREATE_FAIL,
        payload: {
          error: "Can't find user id or email"
        }
      });
    }
  } catch (res) {
    yield put({
      type: TASK_CREATE_FAIL,
      payload: {
        error: res.response.data.error.message
      }
    });
  }
}

/* eslint-disable consistent-return */
export function* updateLimitSaga({
  payload: { username, type, limitValue }
}: {
  payload: {
    username: string,
    type: "mf" | "ml",
    limitValue: string
  }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressLimitUpdate) return true;

  yield put({ type: LIMIT_UPDATE_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const connAccRef = {
        method: "post",
        url: "/api/inst/update-limit",
        baseURL,
        data: {
          id: user.id,
          token: localStorage.getItem("tktoken"),
          username,
          type,
          limitValue
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      yield call(axios, connAccRef);
      console.log("Limit should update");
    } else {
      yield put({
        type: LIMIT_UPDATE_FAIL,
        payload: {
          error: "Can't find user id or email"
        }
      });
    }
  } catch (res) {
    yield put({
      type: LIMIT_UPDATE_FAIL,
      payload: {
        error: res.response.data.error.message
      }
    });
  }
}

export function* watchInst(): mixed {
  // yield takeEvery(CONN_ACC_REQUEST, connectAccSaga);
  yield takeEvery(REQUEST_VERIFICATION_REQUEST, requestVerificationSaga);
  yield takeEvery(SET_VERIFICATION_TYPE_REQUEST, setVerificationTypeSaga);
  yield takeEvery(VERIFY_ACC_REQUEST, verifyAccSaga);

  yield takeEvery(FETCH_ACCS_REQUEST, fetchAccsSaga);
  yield takeEvery(TASK_CREATE_REQUEST, createTaskSaga);
  yield takeEvery(FETCH_TASKS_REQUEST, fetchTasksSaga);
  yield takeEvery(STATS_UPDATE_REQUEST, statsUpdateSaga);
  yield takeEvery(LIMIT_UPDATE_REQUEST, updateLimitSaga);
}
