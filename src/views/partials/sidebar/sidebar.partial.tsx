import GpsItemIcon from "../../../assets/sidebar-iccons/icons8_User_Location_100px.png";
import PaintCarItemIcon from "../../../assets/sidebar-iccons/icons8_Maintenance_100px.png";
import WorkerItemIcon from "../../../assets/sidebar-iccons/icons8_Worker_100px.png";
import { Link, useNavigate } from "react-router-dom";
import "./sidebar.partial.css";
import { useState } from "react";

function SidebarPartial() {
  const navigate = useNavigate();
  const [gpsReportSelectedItem, setGpsReportSelectedItem] = useState(true);
  const [paintCarReportSelectedItem, setPaintCarReportSelectedItem] =
    useState(false);
  const [workerReportSelectedItem, setWorkerReportSelectedItem] =
    useState(false);

  const handleGpsItemClick = () => {
    navigate("/gps-report", { replace: true });
    setGpsReportSelectedItem(true);
    setPaintCarReportSelectedItem(false);
    setWorkerReportSelectedItem(false);
  };

  const handlePatinCarReportItemClick = () => {
    navigate("/monthly-report", { replace: true });
    setGpsReportSelectedItem(false);
    setPaintCarReportSelectedItem(true);
    setWorkerReportSelectedItem(false);
  };

  const handleWorkerReportItemClick = () => {
    navigate("/call-system-report", { replace: true });
    setGpsReportSelectedItem(false);
    setPaintCarReportSelectedItem(false);
    setWorkerReportSelectedItem(true);
  };

  return (
    <div className="sidebar-style">
      <div className="sidebar-container">
        <div className="sidebar-shadow"></div>
        <ul className="sidebar-list-style">
          <li>
            <img
              src={GpsItemIcon}
              alt="Gps Report"
              onClick={handleGpsItemClick}
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: `${
                  gpsReportSelectedItem ? "white" : "transparent"
                }`,
                borderRadius: "8px",
              }}
            />
          </li>
          <li>
            <img
              src={PaintCarItemIcon}
              alt="Paint Car Report"
              onClick={handlePatinCarReportItemClick}
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: `${
                  paintCarReportSelectedItem ? "white" : "transparent"
                }`,
                borderRadius: "8px",
              }}
            />
          </li>
          <li>
            <img
              src={WorkerItemIcon}
              alt="Worker Report"
              onClick={handleWorkerReportItemClick}
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: `${
                  workerReportSelectedItem ? "white" : "transparent"
                }`,
                borderRadius: "8px",
              }}
            />
          </li>
        </ul>
      </div>
    </div>
  );
}

export default SidebarPartial;
