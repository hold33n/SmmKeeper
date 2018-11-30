// @flow

import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import InputField from "components/InputField";
import GradientButton from "components/GradientButton";
import type { Props, State } from "./types";
import { connectAcc } from "ducks/inst";
import { openPopup, closePopup } from "ducks/connectAccPopup";
import store from "store";

class ConnectAccPopup extends PureComponent<Props, State> {
  state = {
    username: "",
    password: ""
  };

  handleInputChange = (inputName: string) => (value: string) =>
    this.setState({ [inputName]: value });

  handleSubmit = () => {
    store.dispatch(connectAcc(this.state));
  };

  componentDidUpdate(prevProps) {
    // Checks whether acc is connected
    if (
      this.props.accList &&
      prevProps.accList &&
      this.props.accList.length !== prevProps.accList.length
    ) {
      store.dispatch(closePopup());
      this.setState({
        username: "",
        password: ""
      });
    }
  }

  render() {
    const { popupVisible } = this.props;

    const popupClassName = popupVisible ? "popup popup_visible" : "popup";

    return ReactDOM.createPortal(
      <div
        className={popupClassName}
        onClick={() => store.dispatch(closePopup())}
      >
        <div className="popup__content" onClick={e => e.stopPropagation()}>
          <div
            className="popup__close"
            onClick={() => store.dispatch(closePopup())}
          />
          <h3>Enter username&password from your instagram account, please.</h3>

          <span className="popup__error-text">{this.props.error}</span>

          <InputField
            inputName="username"
            inputValue={this.state.username}
            handleChange={this.handleInputChange("username")}
            style="light"
          />
          <InputField
            inputName="Password"
            inputValue={this.state.password}
            handleChange={this.handleInputChange("password")}
            style="light"
            type="password"
          />
          <GradientButton handleClick={this.handleSubmit} value={"Confirm"} />
        </div>
      </div>,
      // $FlowFixMe
      document.getElementById("modalRoot")
    );
  }
}

export default connect(
  ({ inst: { accList, error }, connectAccPopup: { visible } }) => ({
    accList,
    error,
    popupVisible: visible
  })
)(ConnectAccPopup);