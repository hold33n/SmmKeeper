// @flow

import { all, take, takeEvery, put, call, select } from "redux-saga/effects";
import { baseURL } from "config";
import axios from "axios";
import { createAction, handleActions, combineActions } from "redux-actions";
import { SOCKET_CONN_END } from "ducks/socket";
import type { State, UserReq } from "./types";
import { push } from "react-router-redux";
import { stateSelector as authStateSelector } from "ducks/auth";
import { live } from "ducks/socket";
import type { State as AccReq } from "components/connectAccPopup/types";
import { eventChannel, END } from "redux-saga";

/**
 * Constants
 * */

export const moduleName: string = "inst";

export const CONN_ACC_REQUEST: "INST/CONN_ACC_REQUEST" =
  "INST/CONN_ACC_REQUEST";
export const CONN_ACC_START: "INST/CONN_ACC_START" = "INST/CONN_ACC_START";
export const CONN_ACC_SUCCESS: "INST/CONN_ACC_SUCCESS" =
  "INST/CONN_ACC_SUCCESS";
export const CONN_ACC_FAIL: "INST/CONN_ACC_FAIL" = "INST/CONN_ACC_FAIL";

export const FETCH_ACCS_REQUEST: "INST/FETCH_ACCS_REQUEST" =
  "INST/FETCH_ACCS_REQUEST";
export const FETCH_ACCS_START: "INST/FETCH_ACCS_START" =
  "INST/FETCH_ACCS_START";
export const FETCH_ACCS_SUCCESS: "INST/FETCH_ACCS_SUCCESS" =
  "INST/FETCH_ACCS_SUCCESS";
export const FETCH_ACCS_FAIL: "INST/FETCH_ACCS_FAIL" = "INST/FETCH_ACCS_FAIL";

export const CLEAR_CONN_ERROR: "INST/CLEAR_CONN_ERROR" =
  "INST/CLEAR_CONN_ERROR";

// *** Tasks ***

export const FETCH_TASKS_REQUEST: "INST/FETCH_TASKS_REQUEST" =
  "INST/FETCH_TASKS_REQUEST";
export const FETCH_TASKS_START: "INST/FETCH_TASKS_START" =
  "INST/FETCH_TASKS_START";
export const FETCH_TASKS_SUCCESS: "INST/FETCH_TASKS_SUCCESS" =
  "INST/FETCH_TASKS_SUCCESS";
export const FETCH_TASKS_FAIL: "INST/FETCH_TASKS_FAIL" =
  "INST/FETCH_TASKS_FAIL";

export const TASK_START_REQUEST: "INST/TASK_START_REQUEST" =
  "INST/TASK_START_REQUEST";
export const TASK_START_START: "INST/TASK_START_START" =
  "INST/TASK_START_START";
export const TASK_START_SUCCESS: "INST/TASK_START_SUCCESS" =
  "INST/TASK_START_SUCCESS";
export const TASK_START_FAIL: "INST/TASK_START_FAIL" = "INST/TASK_START_FAIL";

/**
 * Reducer
 * */

export const initialState: State = {
  accList: null,
  tasksList: null,
  progressFetchAccs: false,
  progressFetchTasks: false,
  progressConnAcc: false,
  progressStartTask: false,
  error: null
};

const instReducer = handleActions(
  {
    [FETCH_ACCS_START]: (state: State) => ({
      ...state,
      progressFetchAccs: true,
      error: null
    }),
    [FETCH_TASKS_START]: (state: State) => ({
      ...state,
      progressFetchTasks: true,
      error: null
    }),
    [CONN_ACC_START]: (state: State) => ({
      ...state,
      progressConnAcc: true,
      error: null
    }),
    [TASK_START_START]: (state: State) => ({
      ...state,
      progressStartTask: true,
      error: null
    }),

    [FETCH_ACCS_SUCCESS]: (state: State, action) => ({
      ...state,
      progressFetchAccs: false,
      error: null,
      accList: action.payload.accList
    }),
    [FETCH_TASKS_SUCCESS]: (state: State, action) => ({
      ...state,
      progressFetchTasks: false,
      error: null,
      tasksList: action.payload.tasksList
    }),
    [CONN_ACC_SUCCESS]: (state: State, action) => ({
      ...state,
      progressConnAcc: false,
      error: null,
      accList: [...state.accList, action.payload.acc]
    }),
    [TASK_START_SUCCESS]: (state: State, action) => ({
      ...state,
      progressStartTask: false,
      error: null
    }),

    [FETCH_ACCS_FAIL]: (state: State, action) => ({
      ...state,
      progressFetchAccs: false,
      error: action.payload.error
    }),
    [FETCH_TASKS_FAIL]: (state: State, action) => ({
      ...state,
      progressFetchTasks: false,
      error: action.payload.error
    }),
    [CONN_ACC_FAIL]: (state: State, action) => ({
      ...state,
      progressConnAcc: false,
      error: action.payload.error
    }),
    [TASK_START_FAIL]: (state: State, action) => ({
      ...state,
      progressStartTask: false,
      error: action.payload.error
    }),

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

export const connectAcc = createAction(CONN_ACC_REQUEST);
export const fetchAccs = createAction(FETCH_ACCS_REQUEST);
export const startTask = createAction(TASK_START_REQUEST);
export const fetchTasks = createAction(FETCH_TASKS_REQUEST);

/**
 * Sagas
 * */

export function* fetchAccsSaga(): Generator<any, any, any> {
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
          token: localStorage.getItem("tktoken")
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
export function* connectAccSaga({
  payload: { username, password }
}: {
  payload: AccReq
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressConnAcc) return true;

  yield put({ type: CONN_ACC_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const connAccRef = {
        method: "post",
        url: "/api/inst/connect",
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

      yield call(axios, connAccRef);
    } else {
      yield put({
        type: CONN_ACC_FAIL,
        payload: {
          error: "Can't find user id or email"
        }
      });
    }
  } catch (res) {
    yield put({
      type: CONN_ACC_FAIL,
      payload: {
        error: res.response.data.error.message
      }
    });
  }
}

/* eslint-disable consistent-return */
export function* fetchTasksSaga({
  payload: { username }
}: {
  payload: {
    username: string
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
          token: localStorage.getItem("tktoken"),
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
export function* startTaskSaga({
  payload: { username, type }
}: {
  payload: {
    username: string,
    type: "mf" | "ml"
  }
}): Generator<any, any, any> {
  const state = yield select(stateSelector);

  if (state.progressStartTask) return true;

  yield put({ type: TASK_START_START });

  try {
    const { user } = yield select(authStateSelector);

    if (user.id) {
      const connAccRef = {
        method: "post",
        url: "/api/inst/task-start",
        baseURL,
        data: {
          id: user.id,
          token: localStorage.getItem("tktoken"),
          username,
          type,
          sourceUsername: "instagram"
        },
        headers: {
          "Content-Type": "application/json"
        }
      };

      yield call(axios, connAccRef);
    } else {
      yield put({
        type: TASK_START_FAIL,
        payload: {
          error: "Can't find user id or email"
        }
      });
    }
  } catch (res) {
    yield put({
      type: TASK_START_FAIL,
      payload: {
        error: res.response.data.error.message
      }
    });
  }
}

export function* watchInst(): mixed {
  yield takeEvery(CONN_ACC_REQUEST, connectAccSaga);
  yield takeEvery(FETCH_ACCS_REQUEST, fetchAccsSaga);
  yield takeEvery(TASK_START_REQUEST, startTaskSaga);
  yield takeEvery(FETCH_TASKS_REQUEST, fetchTasksSaga);
}