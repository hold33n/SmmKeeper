// @flow

import React, { PureComponent } from "react";
import type { Props, State } from "./types";
import GradientButton from "components/GradientButton";
import { startTask, fetchTasks } from "ducks/inst";
import { connect } from "react-redux";

class InstaProfilePage extends PureComponent<Props, State> {
  // componentDidMount() {
  //   this.props.fetchTasks(this.props.username);
  // }

  componentDidUpdate(prevProps) {
    const token =
      typeof window !== "undefined" && localStorage.getItem("tktoken");

    if (
      this.props.username !== prevProps.username &&
      !this.props.progressFetchTasks
    ) {
      // $FlowFixMe
      this.props.fetchTasks(this.props.username, token);
    }
  }

  render() {
    const { username, tasksList, accList } = this.props;

    const acc = this.props.accList.find(el => el.username === username);

    function accMark(stats, mark) {
      if (stats.length > 1) {
        let x = stats[0][mark] - stats[1][mark];
        if (x >= 0) {
          return (
            <span className="profile-info__text profile-info__text_mark-green">
              {x}
            </span>
          );
        } else {
          return (
            <span className="profile-info__text profile-info__text_mark-red">
              {x}
            </span>
          );
        }
      } else {
        return "";
      }
    }

    return (
      <div className="instaprofile">
        {/* <h1 className="instaprofile__name">@{username}</h1> */}
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-2 col-md-3">
              {acc &&
                acc.stats &&
                acc.stats.length > 0 && (
                  <div className="panel profile-info">
                    <div className="profile-info__profile">
                      <span className="profile-info__profile-text">
                        Profile
                      </span>
                      <span className="profile-info__profile-text profile-info__profile-text_grey">
                        Paid till {`27.10.2019`}
                      </span>
                    </div>
                    <span className="profile-info__name">{username}</span>
                    <div className="profile-info__block">
                      <span className="profile-info__text">
                        {acc.stats[0].followers}
                      </span>
                      {accMark(acc.stats, "followers")}
                      <span className="profile-info__caption">Followers</span>
                    </div>
                    <div className="profile-info__block">
                      <span className="profile-info__text">
                        {acc.stats[0].follows}
                      </span>
                      {accMark(acc.stats, "follows")}
                      <span className="profile-info__caption">Following</span>
                    </div>
                    <div className="profile-info__block">
                      <span className="profile-info__text">{65}</span>
                      <span className="profile-info__caption">Posts</span>
                    </div>
                  </div>
                )}
            </div>
            <div className="col-lg-4 col-md-3">
              <div className="panel" />
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="panel" />
            </div>
          </div>
        </div>

        {/* <GradientButton
          handleClick={() =>
            store.dispatch(startTask({ username, type: "mf" }))
          }
          value={"Start massfollowing"}
        />

        {tasksList !== null && tasksList.length ? (
          <div className="tasksTable">
            {tasksList.map(
              ({
                unteractionsNum,
                sourceUsername,
                type,
                status,
                startDate
              }) => (
                <div className="tasksTable__row">Task:</div>
              )
            )}
          </div>
        ) : (
          false
        )} */}
      </div>
    );
  }
}

export default connect(
  ({ inst: { accList, tasksList, progressFetchTasks } }) => ({
    accList,
    tasksList,
    progressFetchTasks
  }),
  dispatch => ({
    fetchTasks: (username, token) => dispatch(fetchTasks({ username, token })),
    startTask: (username, type) => dispatch(startTask({ username, type }))
  })
)(InstaProfilePage);
