import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import * as xlsx from "xlsx";
import Spinner from "react-bootstrap/Spinner";
import { FormGroup, Row } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { convertFromSheetToJson } from "../../helpers/excelFileManipulation.helper";
import "react-toastify/dist/ReactToastify.css";
import "./CallSystemReport.view.css";

function CallSystemReportView() {
  //#region States

  const [jobReportData, setJobReportData] = useState<any[]>([]);
  const [isSpinnerHidden, setIsSpinnerHidden] = useState(true);
  const [isCreateHappyCallReportDisabled, setIsCreateHappyCallReportDisabled] =
    useState(true);

  useEffect(() => {
    if (jobReportData.length > 0) setIsCreateHappyCallReportDisabled(false);
    else setIsCreateHappyCallReportDisabled(true);
  }, [jobReportData]);

  //#endregion

  //#region Event Handlers

  const jobsReportFunction = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setIsSpinnerHidden(false);
      if (e.target.files && e.target.files?.length > 0) {
        const workbook = (await convertFromSheetToJson(
          e.target.files[0],
          toast
        )) as any[];

        setJobReportData((old) => [...workbook]);
      }
    } catch (error) {
      toast("Unknown error happened when processing 'Jobs' report file'");
    }

    setIsSpinnerHidden(true);
  };

  const threeCXReportFunction = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setIsSpinnerHidden(false);
      if (e.target.files && e.target.files?.length > 0) {
        const workbook = (await convertFromSheetToJson(
          e.target.files[0],
          toast
        )) as any[];

        setJobReportData((old) => [...workbook]);
      }
    } catch (error) {
      toast("Unknown error happened when processing 'happy call' report file'");
    }

    setIsSpinnerHidden(true);
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSpinnerHidden(true);

      // const reportData: any[] = [];
      // const workbook = xlsx.utils.book_new();

      // const sheet = xlsx.utils.json_to_sheet(reportData);
      // xlsx.utils.book_append_sheet(workbook, sheet, "report");

      // xlsx.writeFile(workbook, "Companies_Report.xlsx", {
      //   compression: true,
      // });
    } catch (error) {
      console.log(error);
      toast(
        "There was an error just happened when processing the final report"
      );
    }
    setIsSpinnerHidden(true);
  };

  //#endregion

  return (
    <>
      <div className="form-container">
        <Spinner
          animation="border"
          className="spinner-style"
          size="sm"
          hidden={isSpinnerHidden}
          variant="success"
        />

        <div className="shadow-background"></div>

        <Form className="main-container" onSubmit={handleFormSubmit}>
          <Form.Group id="jobsReportFormGroup">
            <Form.Label style={{ color: "white" }}>Jobs Report</Form.Label>
            <Form.Control
              type="file"
              id="jobsReport"
              onChange={jobsReportFunction}
            />
          </Form.Group>

          <Form.Group id="3cxFormGroup">
            <Form.Label style={{ color: "white" }}>3CX Report</Form.Label>
            <Form.Control
              type="file"
              id="3cxReport"
              onChange={threeCXReportFunction}
            />
          </Form.Group>

          <Button
            style={{ color: "white", marginTop: "10px" }}
            variant={isCreateHappyCallReportDisabled ? "disabled" : "success"}
            type="submit"
            disabled={isCreateHappyCallReportDisabled}
          >
            Create Happy call Report
          </Button>
        </Form>
      </div>

      <ToastContainer
        className="toast-style"
        progressStyle={{ background: "#5cb85c" }}
      />
    </>
  );
}

export default CallSystemReportView;
