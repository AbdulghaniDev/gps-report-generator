import { ChangeEvent, useState, FormEvent, useEffect, MouseEvent } from "react";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import Form from "react-bootstrap/Form";
import * as xlsx from "xlsx";
import Spinner from "react-bootstrap/Spinner";
import { FormGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./GpsReport.view.css";
import { convertFromSheetToJson } from "../../helpers/excelFileManipulation.helper";
import { rankingItemsBasedOnDateStrings } from "../../helpers/rankingDate.helper";
import { getJSDocPrivateTag } from "typescript";

/* 
* There two workers you need to change the format of their names in "Job report"
1. Muhammad Farzdaq => MuhammadFarzdaq
2. emad rwmady, haqd => emad,rwmady,haqd

* The process of creating workers must be assigned only to "Abdulghani Albaik"
*/

//#region Interfaces

export interface JobReportSchema {
  worker: string;
  city: string;
  printDate: string;
  address: string;
}

export interface GpsReportSchema {
  worker: string;
  city: string;
  duration: string;
  start: string;
  stopPosition: string;
}

export interface WorkerRelatedData {
  worker: string;
  jobReportData: { printDate: string; address: string }[];
  gpsReportData: {
    locationOnGPS: string;
    minToStop: string;
    time: string;
  }[];
}

export interface WorkerReportData {
  worker: string;
  printDate: string;
  address: string;
  locationOnGPS: string;
  minToStop: string;
  time: string;
  note?: string;
}

export enum WorkerStatus {
  OK = "OK",
  Opposite = "Opposite",
  InHome = "In Home",
  MaintainSystem = "Maintain center",
  NoThing = "",
}

export interface AnalyzeWorkerReportData {
  worker: string;
  printDate: string;
  address: string;
  locationOnGPS: string;
  minToStop: string;
  time: string;
  status: WorkerStatus;
  note?: string;
}

export interface WorkerJobSchema {
  printDate: string;
  address: string;
  isOk?: boolean;
}

export interface WorkerGpsSchema {
  locationOnGPS: string;
  minToStop: string;
  time: string;
  note?: string;
  isOk?: boolean;
}

export interface WorkerData {
  city: string;
  workerName: string;
  jobsData: WorkerJobSchema[];
  gpsData: WorkerGpsSchema[];
}

//#endregion

//#region Helpers

function closestTimeFunc(timeArray: string[], specifiedTime: string) {
  // Convert target time string to milliseconds
  const targetTimeParts = specifiedTime.split(":").map(Number);
  const targetTimeMs =
    targetTimeParts[0] * 3600000 +
    targetTimeParts[1] * 60000 +
    (targetTimeParts[2] || 0) * 1000;

  // Initialize variables to store the closest lower time and its difference with the target time
  let closestLowerTime;
  let minDifference = Infinity;
  let index = 0;

  // Iterate through the array of times
  for (let i = 0; i < timeArray.length; i++) {
    // Convert current time string to milliseconds
    const timeParts = timeArray[i].split(":").map(Number);
    const currentTimeMs =
      timeParts[0] * 3600000 +
      timeParts[1] * 60000 +
      (timeParts[2] || 0) * 1000;

    // Calculate the difference between current time and target time
    const difference = targetTimeMs - currentTimeMs;

    // Update closest lower time if the current time is closer to the target time and is lower than the target time
    if (difference > 0 && difference < minDifference) {
      closestLowerTime = timeArray[i];
      minDifference = difference;
      index = i;
    }
  }

  return {
    closestTime: closestTimeFunc,
    index,
  };
}

function groupBy(arr: any[], prop: string) {
  const groupedData: any = {};

  arr.forEach((item) => {
    const key = item[prop];
    if (!groupedData[key]) {
      groupedData[key] = [item];
    } else {
      groupedData[key].push(item);
    }
  });

  return groupedData;
}

function getWorkerNameFromGpsReport(workerName: string) {
  const actualName: string[] = [];
  const parts = workerName.split(" ");
  for (let i = 0; i < parts.length; i++) {
    if (i === parts.length - 1) continue;

    actualName.push(parts[i]);
  }

  return actualName.join(" ");
}

function getWorkerNameFromGpsReportWithoutCarNumber(workerName: string) {
  const actualName: string[] = [];
  const parts = workerName.split(" ");
  for (let i = 0; i < parts.length; i++) {
    if (i === 0) continue;

    actualName.push(parts[i]);
  }

  // console.log(actualName.join(" "));

  return actualName.join(" ");
}

async function readingExcelFile(file: any) {
  try {
    const arrayBufferFile = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBufferFile);

    return workbook;
  } catch (error) {
    toast(`${file.name} doesn't contains on any data`);
  }
}

async function returnSheetDataFromWorkSheet(
  workbook: xlsx.WorkBook,
  sheetName: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      let worksheet = workbook.Sheets[sheetName];
      let workSheetJson = xlsx.utils.sheet_to_json(worksheet, {
        defval: "",
      }) as any[];

      resolve(workSheetJson);
    } catch (error) {
      reject(
        `An error occurred when converting from sheet: "${sheetName}" to json data`
      );
    }
  });
}

function getHowManyDaysInGpsReport(gpsReportData: GpsReportSchema[]) {
  const daysGpsReport: string[] = [];
  const monthsGpsReport: string[] = [];

  // let monthOfGpsReport: string = gpsReportData[0].start
  //   .split(" ")[0]
  //   .split("-")[1];
  for (let i = 0; i < gpsReportData.length; i++) {
    const dayOfDate = gpsReportData[i].start.split(" ")[0].split("-")[2];
    if (i === 0) {
      daysGpsReport.push(dayOfDate);
    } else {
      if (!daysGpsReport.includes(dayOfDate)) daysGpsReport.push(dayOfDate);
    }
  }

  for (let i = 0; i < gpsReportData.length; i++) {
    const monthOfDate = gpsReportData[i].start.split(" ")[0].split("-")[1];
    if (i === 0) {
      monthsGpsReport.push(monthOfDate);
    } else {
      if (!monthsGpsReport.includes(monthOfDate))
        monthsGpsReport.push(monthOfDate);
    }
  }

  return {
    daysGpsReport,
    monthsGpsReport,
  };
}

// function convertingGpsWorkersNamesBasedOnCarOwning(
//   gpsWorkersData: GpsReportSchema[],
//   carsWorkersData: CarOwnerData[]
// ) {
//   carsWorkersData.forEach((carWorker) => {
//     gpsWorkersData.forEach((gpsWorker) => {
//       const workerGpsName = getWorkerNameFromGpsReportWithoutCarNumber(
//         gpsWorker.worker
//       );
//       const workerGpsCarNumber = gpsWorker.worker.split(" ")[0];
//       if (
//         carWorker.carNumber === workerGpsCarNumber &&
//         workerGpsName !== carWorker.owner
//       ) {
//         gpsWorker.worker = carWorker.owner;
//       }
//     });
//   });
// }

//#endregion

function GpsReportView() {
  //#region States

  const [jobReportData, setJobReportData] = useState<JobReportSchema[]>([]);
  const [gpsReportData, setGpsReportData] = useState<GpsReportSchema[]>([]);
  const [finalReportData, setFinalReportData] = useState<WorkerData[]>([]);

  const [isCreateReportButtonDisabled, setIsCreateReportButtonDisabled] =
    useState(true);
  const [isAnalyzeReportButtonDisabled, setIsAnalyzeReportButtonDisabled] =
    useState(true);
  const [isJobsFieldDisabled, setIsJobsFieldDisabled] = useState(true);
  const [isSpinnerHidden, setIsSpinnerHidden] = useState(true);

  useEffect(() => {
    // console.log(gpsReportData, jobReportData, jobsReportDate);
    if (gpsReportData.length > 0) {
      setIsJobsFieldDisabled(false);

      if (jobReportData.length > 0) {
        setIsCreateReportButtonDisabled(false);
      } else {
        setIsCreateReportButtonDisabled(true);
      }
    } else {
      setIsJobsFieldDisabled(true);
    }
  }, [jobReportData, gpsReportData]);

  useEffect(() => {
    if (finalReportData.length > 0) {
      setIsAnalyzeReportButtonDisabled(false);
    }
  }, [finalReportData]);

  //#endregion

  //#region Event Handlers

  const jobReportFunction = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setIsSpinnerHidden(false);
      if (e.target.files && e.target.files?.length > 0) {
        const workbook = (await convertFromSheetToJson(
          e.target.files[0],
          toast
        )) as any[];

        const cities = new Map([
          ["Baghdad", "Baghdad"],
          ["Basra", "Basra"],
          ["Erbil", "Erbil"],
          ["Hilla", "Hilla"],
          ["Karkuk", "Kirkuk"],
          ["Mousil", "Musol"],
          ["Ramadi", "Rumadi"],
          ["Sulaimaniy", "Suli"],
        ]);
        const gpsCities: string[] = [];
        for (let i = 0; i < gpsReportData.length; i++) {
          if (gpsCities.includes(gpsReportData[i].city)) continue;

          gpsCities.push(gpsReportData[i].city);
        }

        const { daysGpsReport, monthsGpsReport } =
          getHowManyDaysInGpsReport(gpsReportData);

        const filteredJobsBasedOnGpsReportStartDate: any[] = [];
        daysGpsReport.forEach((dayGpsReport) => {
          workbook.filter((row) => {
            const onlyDateFromPrintDate = (
              row["Completion Date"] as string
            ).split(" ")[0];
            const getDayFromGpsRowItem = onlyDateFromPrintDate.split("-")[2];
            const getMonthFromGpsRowItem = onlyDateFromPrintDate.split("-")[1];

            // console.log(getDayFromGpsRowItem, getMonthFromGpsRowItem, row);

            if (
              getDayFromGpsRowItem === dayGpsReport &&
              monthsGpsReport.includes(getMonthFromGpsRowItem) &&
              row["Completion Date"]
            ) {
              filteredJobsBasedOnGpsReportStartDate.push(row);
            }
          });
        });

        if (filteredJobsBasedOnGpsReportStartDate.length > 0) {
          const jobData: JobReportSchema[] = [];
          filteredJobsBasedOnGpsReportStartDate.forEach((row) => {
            const cityOfWorker: any = cities.get(row["City"])
              ? cities.get(row["City"])
              : "";

            if (cityOfWorker) {
              jobData.push({
                city: cityOfWorker,
                worker: (row["Technician"] as string).trim(),
                address: row["Addrees"],
                printDate: row["Completion Date"],
              });
            }
          });

          setJobReportData((old) => [...jobData]);
        }
      }
    } catch (error) {
      toast("Unknown error happened when processing 'Jobs' report file'");
    }

    setIsSpinnerHidden(true);
  };

  const gpsReportFunction = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setIsSpinnerHidden(false);
      if (e.target.files && e.target.files.length > 0) {
        const workbook = (await convertFromSheetToJson(
          e.target.files[0],
          toast
        )) as any[];

        const gpsData: GpsReportSchema[] = [];
        workbook.forEach((row) => {
          const durationParts = (row["Duration"] as string).split(" ");
          if (durationParts[1] === "min") {
            if (Number.parseInt(durationParts[0]) >= 5) {
              gpsData.push({
                city: row["City"],
                worker: getWorkerNameFromGpsReport(
                  (row["Worker"] as string).trim()
                ),
                duration: row["Duration"],
                start: row["Start"],
                stopPosition: row["Stop position"],
              });
            }
          } else {
            gpsData.push({
              city: row["City"],
              worker: getWorkerNameFromGpsReport(
                (row["Worker"] as string).trim()
              ),
              duration: row["Duration"],
              start: row["Start"],
              stopPosition: row["Stop position"],
            });
          }
        });

        setGpsReportData((old) => [...gpsData]);
      }
    } catch (error) {
      console.log(error);
      toast(
        "Unknown error happened when processing 'Primamgroup' report file'"
      );
    }

    setIsSpinnerHidden(true);
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSpinnerHidden(true);

      // Converting the Gps workers names based on the owning cars

      const cities: string[] = [];
      const daysOfGpsReport: string[] = [];
      // const monthsOfGpsReport: string[] = [];
      const workbook = xlsx.utils.book_new();

      for (let i = 0; i < gpsReportData.length; i++) {
        const dayOfGpsDataItem = gpsReportData[i].start
          .split(" ")[0]
          .split("-")[2];
        if (!daysOfGpsReport.includes(dayOfGpsDataItem))
          daysOfGpsReport.push(dayOfGpsDataItem);

        // const monthOfGpsReport = gpsReportData[i].start
        //   .split(" ")[0]
        //   .split("-")[1];
        // if (!monthsOfGpsReport.includes(monthOfGpsReport))
        //   monthsOfGpsReport.push(monthOfGpsReport);

        if (!cities.includes(gpsReportData[i].city))
          cities.push(gpsReportData[i].city);
      }

      // console.log(jobReportData, gpsReportData);
      // return;

      cities.forEach((city) => {
        const jopRelatedToCity = jobReportData.filter(
          (jopRow) => jopRow.city === city
        );
        const gpsRelatedToCity = gpsReportData.filter(
          (gpsRow) => gpsRow.city === city
        );

        console.log(jopRelatedToCity, gpsRelatedToCity);
        // return;

        const groupedJobsBasedWorker = groupBy(
          jopRelatedToCity,
          "worker"
        ) as any;
        const groupedGpsBasedWorker = groupBy(
          gpsRelatedToCity,
          "worker"
        ) as any;

        console.log(groupedJobsBasedWorker, groupedGpsBasedWorker);
        // return;

        const data: WorkerReportData[] = [];
        const workersGPSNames = Object.keys(groupedGpsBasedWorker); // You shouldn't convert it to (groupedJobsBasedWorker)

        for (let i = 0; i < workersGPSNames.length; i++) {
          let workerJobs = groupedJobsBasedWorker[
            getWorkerNameFromGpsReportWithoutCarNumber(workersGPSNames[i])
          ] as JobReportSchema[];

          const workerGps = groupedGpsBasedWorker[
            workersGPSNames[i]
          ] as GpsReportSchema[];

          console.log(workerJobs, workerGps);

          workerJobs = rankingItemsBasedOnDateStrings(
            workerJobs,
            "printDate",
            daysOfGpsReport.sort()
            // monthsOfGpsReport.sort()
          );

          // console.log(workerJobs, workerGps);
          // return;

          const jobsLength =
            workerGps.length > workerJobs.length
              ? workerGps.length
              : workerJobs.length;

          for (let j = 0; j < jobsLength; j++) {
            if (j === 0) {
              data.push({
                worker: workersGPSNames[i],
                printDate: workerJobs[j] ? workerJobs[j]?.printDate : "",
                address: workerJobs[j] ? workerJobs[j]?.address : "",
                locationOnGPS: workerGps[j]?.stopPosition,
                minToStop: workerGps[j]?.duration,
                time: workerGps[j]?.start,
                note: "",
              });
            } else {
              data.push({
                worker: "",
                printDate: workerJobs[j] ? workerJobs[j]?.printDate : "",
                address: workerJobs[j] ? workerJobs[j]?.address : "",
                locationOnGPS: workerGps[j]?.stopPosition,
                minToStop: workerGps[j]?.duration,
                time: workerGps[j]?.start,
                note: "",
              });
            }
          }

          // To add additional row between every worker
          data.push({
            address: "",
            locationOnGPS: "",
            minToStop: "",
            printDate: "",
            time: "",
            worker: "",
            note: "",
          });
        }

        const sheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, sheet, city);
      });

      xlsx.writeFile(workbook, "final_gps_report.xlsx", {
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

  const finalReportFunction = async (e: ChangeEvent<HTMLInputElement>) => {
    const workersData: WorkerData[] = [];
    try {
      setIsSpinnerHidden(false);
      // const workersData: WorkerData[] = [];
      if (e.target?.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const workbook = (await readingExcelFile(file)) as xlsx.WorkBook;
        let index: number = -1;

        for (let i = 0; i < workbook.SheetNames.length; i++) {
          const sheetName = workbook.SheetNames[i]; // it's the same city name also
          returnSheetDataFromWorkSheet(workbook, sheetName)
            .then((workSheetJson: WorkerReportData[]) => {
              // console.log(workSheetJson);

              for (let j = 0; j < workSheetJson.length; j++) {
                if (!workSheetJson[j].time && !workSheetJson[j].printDate)
                  continue;

                // console.log(workSheetJson[j], index);
                if (workSheetJson[j].worker) {
                  workersData.push({
                    city: sheetName,
                    workerName: workSheetJson[j].worker,
                    jobsData: [
                      {
                        address: workSheetJson[j].address,
                        printDate: workSheetJson[j].printDate,
                      },
                    ],
                    gpsData: [
                      {
                        locationOnGPS: workSheetJson[j].locationOnGPS,
                        minToStop: workSheetJson[j].minToStop,
                        note: workSheetJson[j].note,
                        time: workSheetJson[j].time,
                      },
                    ],
                  });
                  index++;
                  // console.log("First", workersData[index]);
                } else {
                  // console.log(workersData[index]);
                  if (workersData[index]) {
                    workersData[index]?.jobsData.push({
                      address: workSheetJson[j].address,
                      printDate: workSheetJson[j].printDate,
                    });
                    workersData[index]?.gpsData.push({
                      locationOnGPS: workSheetJson[j].locationOnGPS,
                      minToStop: workSheetJson[j].minToStop,
                      note: workSheetJson[j].note,
                      time: workSheetJson[j].time,
                    });
                    // console.log("Second", index, workersData[index]);
                  }
                }
              }
            })
            .catch((error: string) => {
              toast(error);
            });
        }

        // console.log(workersData);
        setFinalReportData(workersData);
        setIsAnalyzeReportButtonDisabled(false);
      }
    } catch (error: any) {
      console.log(error);
      toast(error);
    }

    setIsSpinnerHidden(true);
  };

  const handleAnalyzeButton = async (e: MouseEvent<HTMLButtonElement>) => {
    //TODO:
    // Make workers that are stopped arouned tht maintain system aren't opposite
    // Found: Baghdad, Erbil, Basra and Mousel
    // Not Found: Hilla and Kirkuk
    // Result: Kirkuk contain on only one worker so there isn't maintain center for it
    // Result: Hilla contain on some workeres but those workers tranvels between Hill, Najaf and Karbala so I think there isn't  maintain center
    // NO location: Sulimanie,Rumadi and Dhuok

    const khoshnawMaintainLocations = [
      "Karada الكرادة", // Baghdad
      "صيانة اربيل 1", // Erbil
      "Kut As Sayyid كوت السيد", // Basra
      "Al Jazar الجزائر", // Mousel
      "Almas ألماس", // Karkuk
    ];

    for (let i = 0; i < finalReportData.length; i++) {
      const stopPositionsStartDate: string[] = [];
      for (let j = 0; j < finalReportData[i].gpsData.length; j++) {
        if (j === 0 || j === finalReportData[i].gpsData.length - 1) continue; // The first stop and last one is for returning worker to his home (not opposite)

        if (finalReportData[i].gpsData[j].time) {
          stopPositionsStartDate.push(
            finalReportData[i].gpsData[j].time.split(" ")[1]?.trim()
          );
        }
        // console.log(
        //   finalReportData[i].workerName,
        //   finalReportData[i].gpsData[j],
        //   stopPositionsStartDate
        // );
      }

      if (stopPositionsStartDate.length !== 0) {
        for (let j = 0; j < finalReportData[i].jobsData.length; j++) {
          if (!finalReportData[i].gpsData[j].time) continue;

          const printDate = finalReportData[i].jobsData[j]?.printDate
            .split(" ")[1]
            ?.trim();

          if (printDate) {
            const { index } = closestTimeFunc(
              stopPositionsStartDate,
              printDate
            );
            // console.log(
            //   "check here 2",
            //   index + 1,
            //   finalReportData[i].gpsData[index + 1]
            // );
            finalReportData[i].gpsData[index + 1].isOk = true;
            // console.log("check here 1", finalReportData[i].jobsData[j]);
            finalReportData[i].jobsData[j].isOk = true;
          }
        }
      }
    }

    // Fill the data in correct way
    const citiesOfWorkers: any = groupBy(finalReportData, "city");
    const cities = Object.keys(citiesOfWorkers);
    // const workbook = new exceljs.Workbook();
    const workbook = xlsx.utils.book_new();

    for (let i = 0; i < cities.length; i++) {
      const workersOfCity: AnalyzeWorkerReportData[] = [];
      const workers = citiesOfWorkers[cities[i]] as WorkerData[];

      for (let j = 0; j < workers.length; j++) {
        const worker = workers[j];

        for (let k = 0; k < worker.gpsData.length; k++) {
          if (k === 0 || k === worker.gpsData.length - 1) {
            workersOfCity.push({
              worker: k === 0 ? worker.workerName : "",
              printDate: worker.jobsData[k]?.printDate
                ? worker.jobsData[k]?.printDate
                : "",
              address: worker.jobsData[k]?.address
                ? worker.jobsData[k]?.address
                : "",

              locationOnGPS: worker.gpsData[k]?.locationOnGPS,
              minToStop: worker.gpsData[k]?.minToStop,
              time: worker.gpsData[k]?.time,
              status: WorkerStatus.InHome,
              note: "",
            });
          } else {
            let workerStatus: WorkerStatus;
            const gpsLocation = worker.gpsData[k]?.locationOnGPS;

            if (khoshnawMaintainLocations.includes(gpsLocation)) {
              workerStatus = WorkerStatus.MaintainSystem;
            } else if (worker.gpsData[k]?.isOk) {
              workerStatus = WorkerStatus.OK;
            } else {
              workerStatus = WorkerStatus.Opposite;
            }

            workersOfCity.push({
              worker: "",
              printDate: worker.jobsData[k]?.printDate
                ? worker.jobsData[k]?.printDate
                : "",
              address: worker.jobsData[k]?.address
                ? worker.jobsData[k]?.address
                : "",

              locationOnGPS: worker.gpsData[k]?.locationOnGPS,
              minToStop: worker.gpsData[k]?.minToStop,
              time: worker.gpsData[k]?.time,
              status: workerStatus,
              note: "",
            });
          }
        }

        workersOfCity.push({
          address: "",
          locationOnGPS: "",
          minToStop: "",
          printDate: "",
          status: WorkerStatus.NoThing,
          time: "",
          worker: "",
          note: "",
        });
      }

      const sheet = xlsx.utils.json_to_sheet(workersOfCity);

      xlsx.utils.book_append_sheet(workbook, sheet, cities[i]);
    }

    xlsx.writeFile(workbook, "analyzed_final_gps_report.xlsx");
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
          <Form.Group id="gpsReport">
            <Form.Label style={{ color: "white" }}>
              Pirmamgroup Report
            </Form.Label>
            <Form.Control
              type="file"
              id="jobReport"
              onChange={gpsReportFunction}
            />
          </Form.Group>

          <Form.Group id="jobReport">
            <Form.Label style={{ color: "white" }}>Job Report</Form.Label>
            <Form.Control
              disabled={isJobsFieldDisabled}
              type="file"
              id="jobReport"
              onChange={jobReportFunction}
            />
          </Form.Group>

          <Button
            style={{ color: "white", marginTop: "30px" }}
            variant={isCreateReportButtonDisabled ? "disabled" : "success"}
            type="submit"
            disabled={isCreateReportButtonDisabled}
          >
            Create Report
          </Button>

          <hr style={{ color: "white" }} />

          <FormGroup>
            <Form.Group id="finalReport">
              <Form.Label style={{ color: "white" }}>Final Report</Form.Label>
              <Form.Control
                type="file"
                id="finalReport"
                onChange={finalReportFunction}
              />
            </Form.Group>
          </FormGroup>

          <Button
            type="button"
            style={{ color: "white", marginTop: "30px" }}
            variant={isAnalyzeReportButtonDisabled ? "disabled" : "success"}
            disabled={isAnalyzeReportButtonDisabled}
            onClick={handleAnalyzeButton}
          >
            Analyze Report
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

export default GpsReportView;
