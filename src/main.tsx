import React from "react";
import ReactDOM from "react-dom/client";
import Sunset from "./pages/Sunset";
import "./index.css";

// The hosted pull2press service has been shut down. The full application is
// still in this repo. To run it yourself, replace <Sunset /> below with:
//
//   import App from './App';
//   import { BrowserRouter } from 'react-router-dom';
//   <BrowserRouter><App /></BrowserRouter>
//
// and configure the environment variables listed in the README.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sunset />
  </React.StrictMode>,
);
