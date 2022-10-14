import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Join from "./components/Join";
import Landing, { MainPages } from "./components/landing/Landing";
import OAuthCallback from "./components/OAuthCallback";
import logo from "./logo.svg";
import "./App.css";
import { useAuth } from "./contexts/AuthContext";
import ChangePassword from "./components/ChangePassword";

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      apiResponse: "",
      textFieldString: "",
      capString: "Type some text and click the button to get it in all caps",
    };
    this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
  }

  callAPI() {
    fetch("http://localhost:9000/testAPI")
      .then((res) => res.text())
      .then((res) => this.setState({ apiResponse: res }))
      .catch((err) => err);
  }

  getCapitalizedText() {
    //fetch("http://localhost:9000/capitalize", {body: JSON.stringify({"textFieldString": this.state.textFieldString})})
    fetch("http://localhost:9000/capitalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textFieldString: this.state.textFieldString }),
    })
      .then((res) => res.text())
      .then((res) => this.setState({ capString: res }))
      .catch((err) => err);
  }

  componentDidMount() {
    this.callAPI();
  }

  handleTextFieldChange(event) {
    this.setState({ textFieldString: event.target.value });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>{this.state.apiResponse}</p>
          <p>
            <input
              type="text"
              id="searchbar"
              onChange={this.handleTextFieldChange}
            />
            <button id="clickme" onClick={() => this.getCapitalizedText()}>
              Click me{" "}
            </button>
          </p>
          <p id="capitalizedText">{this.state.capString}</p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

function AuthorizedRoute(props) {
  const { token } = useAuth();
  if (token) {
    return props.children;
  }
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/example" element={<Example />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/forgotpassword" element={<ForgotPassword />}></Route>
        <Route path="/changepassword" element={<ChangePassword />}></Route>
        <Route
          path="/slack_callback"
          element={<OAuthCallback serviceName="slack" />}
        ></Route>
        <Route path="/signup" element={<Join />}></Route>
        <Route path="/" element={<Navigate to="/search" />}></Route>
        <Route
          path="/search"
          element={
            <AuthorizedRoute>
              <Landing page={MainPages.Search} />
            </AuthorizedRoute>
          }
        ></Route>
        <Route
          path="/services"
          element={
            <AuthorizedRoute>
              <Landing page={MainPages.Services} />
            </AuthorizedRoute>
          }
        ></Route>
      </Routes>
    </Router>
  );
}
