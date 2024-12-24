import React from "react";
import { ChangeEvent, useState, FormEvent, useEffect, MouseEvent } from "react";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import Form from "react-bootstrap/Form";
import * as xlsx from "xlsx";
import Spinner from "react-bootstrap/Spinner";
import { FormGroup, Row } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MonthlyReport.view.css";
import { convertFromSheetToJson } from "../../helpers/excelFileManipulation.helper";
import {
  DeliveryType,
  SupoortedCompanies,
  supportedCities,
} from "../../helpers/constants/khoshnaw.contant";
import { JobStatus } from "../../helpers/constants/jobStatus.contant";
import { DevicesShortCut } from "../../helpers/constants/devices.contant";

//#region Interfaces

interface CompanyReportDataSchema {
  City: string;
  All_Jobs: number;
  Amount: number;
}

interface WorkerReportSchema {
  Worker: string; // worker's name
  All_Jobs: number;
  Completed_Jobs: number;
  Canceled_Jobs: number;
  Jobs_Per_Day: number;
  KM_in_GPS: number;
  KM_in_GPS_Per_Completed_Job: number;
  Invoice: number;
  Invoice_GPS: number;
  Balance_Invoice: number;
  IW: number;
  OOW: number;
  Carry_In_Service: number;
  In_Home_Service: number;
  Pickeup_And_Delivery: number;
  Amount: number;
}

interface WorkerGpsRow {
  worker: string;
  kmInGps: number;
  invoiceGps: number;
  invoice: number;
  city: string;
}

//#endregion

function SumEveryColumns(data: any, reportData: any[]) {
  const reportKeys = Object.keys(reportData[0]);
  const reportValues = Object.values(reportData);

  for (let i = 0; i < reportValues.length; i++) {
    for (let j = 0; j < reportKeys.length; j++) {
      if (j === 0) continue;

      if (!data[reportKeys[j]]) {
        data[reportKeys[j]] = reportValues[i][reportKeys[j]];
      } else {
        data[reportKeys[j]] =
          data[reportKeys[j]] + reportValues[i][reportKeys[j]];
      }
    }
  }

  return data;
}

function MonthlyReportView() {
  //#region States

  const [jobReportData, setJobReportData] = useState<any[]>([]);
  const [workerGpsReportData, setWorkerGpsReportData] = useState<
    WorkerGpsRow[]
  >([]);
  const [workDays, setWorkDays] = useState<number>(0);
  const [
    isCreateCompaniesReportButtonDisabled,
    setIsCreateCompaniesReportButtonDisabled,
  ] = useState(true);
  const [
    isCreateWorkersReportButtonDisabled,
    setIsCreateWorkersReportButtonDisabled,
  ] = useState(true);
  const [
    isCreateDevicesReportButtonDisabled,
    setIsCreateDevicesReportButtonDisabled,
  ] = useState(true);
  const [isSpinnerHidden, setIsSpinnerHidden] = useState(true);

  useEffect(() => {
    if (jobReportData.length > 0) {
      setIsCreateCompaniesReportButtonDisabled(false);
      setIsCreateDevicesReportButtonDisabled(false);

      if (workerGpsReportData.length > 0 && workDays > 0) {
        setIsCreateWorkersReportButtonDisabled(false);
      } else {
        setIsCreateWorkersReportButtonDisabled(true);
      }
    } else {
      setIsCreateCompaniesReportButtonDisabled(true);
      setIsCreateDevicesReportButtonDisabled(true);
    }
  }, [jobReportData, workerGpsReportData, workDays]);

  //#endregion

  //#region Event Handlers

  const companiesReportFunction = async (e: ChangeEvent<HTMLInputElement>) => {
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

  // For creating companies report
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSpinnerHidden(true);

      const reportData: any[] = [];
      const workbook = xlsx.utils.book_new();

      supportedCities.forEach((city) => {
        const citiesJobs = jobReportData.filter(
          (row) => row["City"] === city && row["Status"] === JobStatus.Completed
        );
        const cityJobsNumber = citiesJobs.length;
        const cityJobsAmount = citiesJobs.reduce(
          (total, job) => total + job["Grand Total"],
          0
        );

        const data: any = {};
        Object.values(SupoortedCompanies).forEach((company) => {
          const companyData = citiesJobs.filter(
            (job) => job["Company"] === company
          );

          data[company] = companyData.length;
          const grandTotalOfCompanyInCity = companyData.reduce(
            (total, job) => total + job["Grand Total"],
            0
          );
          const companyAmount = `${company}_Amount`;
          data[companyAmount] = grandTotalOfCompanyInCity;
        });

        const cityReportData: CompanyReportDataSchema | any = {
          City: city,
          All_Jobs: cityJobsNumber,
          Amount: cityJobsAmount,
          ...data,
        };

        reportData.push(cityReportData);
      });

      const data: any = {
        City: "Grand Total",
      };
      const filledData = SumEveryColumns(data, reportData);
      reportData.push(filledData);

      const sheet = xlsx.utils.json_to_sheet(reportData);
      xlsx.utils.book_append_sheet(workbook, sheet, "report");

      xlsx.writeFile(workbook, "Companies_Report.xlsx", {
        compression: true,
      });
    } catch (error) {
      console.log(error);
      toast(
        "There was an error just happened when processing the final report"
      );
    }
    setIsSpinnerHidden(true);
  };

  const handleCreateDevicesReport = async (
    e: MouseEvent<HTMLButtonElement>
  ) => {
    try {
      setIsSpinnerHidden(true);

      const reportData: any[] = [];
      const workbook = xlsx.utils.book_new();

      supportedCities.forEach((city) => {
        const cityJobs = jobReportData.filter((job) => job["City"] === city);
        const data: any = {
          City: city,
        };

        cityJobs.forEach((job) => {
          Object.values(DevicesShortCut).forEach((deviceShortcut) => {
            if (job["Device Type"] === deviceShortcut) {
              const amountShortcutColumnName = `${deviceShortcut}_Amount`;
              if (!data[deviceShortcut]) {
                data[deviceShortcut] = 1;
                data[amountShortcutColumnName] = job["Grand Total"];
              } else {
                data[deviceShortcut] += 1;
                data[amountShortcutColumnName] += job["Grand Total"];
              }
            }
          });
        });

        let grandTotal = 0;
        Object.values(data).forEach((value) => {
          if (typeof value === "number") {
            grandTotal += value;
          }
        });
        data["Grand Total"] = grandTotal;

        reportData.push(data);
      });

      const data: any = {
        City: "Total",
      };
      const filledData = SumEveryColumns(data, reportData);
      reportData.push(filledData);

      const sheet = xlsx.utils.json_to_sheet(reportData);
      xlsx.utils.book_append_sheet(workbook, sheet, "report");

      xlsx.writeFile(workbook, "Devices_Report.xlsx", {
        compression: true,
      });
    } catch (error) {
      console.log(error);
      toast(
        "There was an error just happened when processing the final report"
      );
    }
    setIsSpinnerHidden(true);
  };

  const workersReportFunction = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setIsSpinnerHidden(false);
      if (e.target.files && e.target.files?.length > 0) {
        const workbook = (await convertFromSheetToJson(
          e.target.files[0],
          toast
        )) as any[];

        setWorkerGpsReportData((old) => [...workbook]);
      }
    } catch (error) {
      toast(
        "Unknown error happened when processing 'Workers GPS' report file'"
      );
    }

    setIsSpinnerHidden(true);
  };

  const workDaysInputFunction = async (e: ChangeEvent<HTMLInputElement>) => {
    setWorkDays(Number.parseInt(e.target.value));
  };

  const handleCreateWorkersReport = async (
    e: MouseEvent<HTMLButtonElement>
  ) => {
    if (workDays === 0) toast("Work days can't be zero");

    try {
      setIsSpinnerHidden(true);

      const reportData: WorkerReportSchema[] = [];
      const workbook = xlsx.utils.book_new();

      const citiesWorkers: string[] = [];
      for (let i = 0; i < workerGpsReportData.length; i++) {
        if (citiesWorkers.includes(workerGpsReportData[i].city)) continue;
        citiesWorkers.push(workerGpsReportData[i].city);
      }

      citiesWorkers.forEach((city) => {
        const cityWorkers = workerGpsReportData.filter(
          (item) => item.city === city
        );

        cityWorkers.forEach((row) => {
          const workerJobs = jobReportData.filter(
            (job) => job["Worker"] == row.worker
          );
          const allWorkerJobs = workerJobs.length;
          const workerGrandTotal = workerJobs.reduce(
            (total, job) => total + job["Grand Total"],
            0
          );
          const completedWorkerJobs = workerJobs.filter(
            (job) => job["Status"] == JobStatus.Completed
          ).length;
          const inWarrntyJobs = workerJobs.filter(
            (job) => job["Warranty"] === "ضمان"
          ).length;
          const outOfWarrntyJobs = workerJobs.filter(
            (job) => job["Warranty"] === "خارج ضمان"
          ).length;
          const inHomeJobs = workerJobs.filter(
            (job) => job["Delivery Type"] === DeliveryType.inHome
          ).length;
          const carryInJobs = workerJobs.filter(
            (job) => job["Delivery Type"] === DeliveryType.CarryIn
          ).length;
          const pickupJobs = workerJobs.filter(
            (job) => job["Delivery Type"] === DeliveryType.CarryInPickupDelivey
          ).length;
          const canceledWorkerJobs = workerJobs.filter(
            (job) => job["Status"] == JobStatus.Canceled
          ).length;
          const data: any = {};
          Object.values(DevicesShortCut).forEach((deviceShortcut) => {
            data[deviceShortcut] = workerJobs.filter(
              (job) => job["Device Type"] === deviceShortcut
            ).length;
          });

          // console.log(jobReportData, workerJobs, completedWorkerJobs, canceledWorkerJobs, workerGrandTotal);
          // return;

          reportData.push({
            Worker: row.worker,
            All_Jobs: allWorkerJobs,
            Completed_Jobs: completedWorkerJobs,
            Canceled_Jobs: canceledWorkerJobs,
            Jobs_Per_Day: workerJobs.length / workDays,
            IW: inWarrntyJobs,
            OOW: outOfWarrntyJobs,
            In_Home_Service: inHomeJobs,
            Carry_In_Service: carryInJobs,
            Pickeup_And_Delivery: pickupJobs,
            KM_in_GPS: row.kmInGps,
            KM_in_GPS_Per_Completed_Job:
              completedWorkerJobs !== 0 ? row.kmInGps / completedWorkerJobs : 0,
            Invoice_GPS: row.invoiceGps,
            Invoice: row.invoice,
            Balance_Invoice: row.invoiceGps - row.invoice,
            Amount: workerGrandTotal,
            ...data,
          });
        });

        const data: any = {
          Worker: "Grand Total",
        };
        const filledData = SumEveryColumns(data, reportData);
        reportData.push(filledData);

        const sheet = xlsx.utils.json_to_sheet(reportData);
        xlsx.utils.book_append_sheet(workbook, sheet, city);
      });

      // workerGpsReportData.forEach(row => {
      //   const workerJobs = jobReportData.filter(job => job["Worker"] == row.worker);
      //   const workerGrandTotal = workerJobs.reduce((total, job) => total + job["Grand Total"], 0);
      //   const completedWorkerJobs = workerJobs.filter(job => job["Status"] == JobStatus.Completed);
      //   const canceledWorkerJobs = workerJobs.filter(job => job["Status"] == JobStatus.Canceled);

      //   // console.log(jobReportData, workerJobs, completedWorkerJobs, canceledWorkerJobs, workerGrandTotal);
      //   // return;

      //   reportData.push({
      //     Worker: row.worker,
      //     Completed_Jobs: completedWorkerJobs.length,
      //     Canceled_Jobs: canceledWorkerJobs.length,
      //     Jobs_Per_Day: workerJobs.length / workDays,
      //     KM_in_GPS: row.kmInGps,
      //     KM_in_GPS_Per_Completed_Job: completedWorkerJobs.length !== 0 ?  row.invoiceGps / completedWorkerJobs.length : 0,
      //     Invoice_GPS: row.invoiceGps,
      //     Invoice: row.invoice,
      //     Balance_Invoice: row.invoiceGps - row.invoice,
      //     Amount: workerGrandTotal
      //   })
      // });

      // const data: any = {
      //   Worker: "Grand Total"
      // };
      // const filledData = SumEveryColumns(data, reportData);
      // reportData.push(filledData);

      // const sheet = xlsx.utils.json_to_sheet(reportData);
      // xlsx.utils.book_append_sheet(workbook, sheet, "report");

      xlsx.writeFile(workbook, "Workers_Report.xlsx", {
        compression: true,
      });
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
          <Form.Group id="companiesReportFormGroup">
            <Form.Label style={{ color: "white" }}>Jobs Report</Form.Label>
            <Form.Control
              type="file"
              id="companiesReport"
              onChange={companiesReportFunction}
            />
          </Form.Group>

          <Button
            style={{ color: "white", marginTop: "10px" }}
            variant={
              isCreateCompaniesReportButtonDisabled ? "disabled" : "success"
            }
            type="submit"
            disabled={isCreateCompaniesReportButtonDisabled}
          >
            Create Companies Report
          </Button>

          <Button
            type="button"
            style={{ color: "white", marginTop: "10px" }}
            variant={
              isCreateDevicesReportButtonDisabled ? "disabled" : "success"
            }
            disabled={isCreateDevicesReportButtonDisabled}
            onClick={handleCreateDevicesReport}
          >
            Create Devices Report
          </Button>

          <hr style={{ color: "white" }} />

          <FormGroup>
            <Form.Group id="workerReportFormGroup">
              <Form.Label style={{ color: "white" }}>
                Workers Gps Report
              </Form.Label>
              <Form.Control
                type="file"
                id="workerReport"
                onChange={workersReportFunction}
              />
            </Form.Group>

            <Form.Group id="workDaysFormGroup" style={{ marginTop: "10px" }}>
              <Form.Label style={{ color: "white" }}>Work Days</Form.Label>
              <Form.Control
                type="number"
                id="workDays"
                onChange={workDaysInputFunction}
              />
            </Form.Group>
          </FormGroup>

          <Button
            type="button"
            style={{ color: "white", marginTop: "10px" }}
            variant={
              isCreateWorkersReportButtonDisabled ? "disabled" : "success"
            }
            disabled={isCreateWorkersReportButtonDisabled}
            onClick={handleCreateWorkersReport}
          >
            Create Workers Report
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

export default MonthlyReportView;
