import Sidebar from "./views/partials/sidebar/sidebar.partial";
import MainView from "./views/MainView/Main.view";
import "./App.css";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar />
        <MainView />
      </BrowserRouter>
    </div>
  );
}

export default App;
