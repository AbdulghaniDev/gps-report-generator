import * as xlsx from "xlsx";
import { ToastContent, toast } from "react-toastify";

export async function convertFromSheetToJson(
  file: any,
  toast: any,
  haveMultipleSheets: boolean = false
) {
  try {
    const arrayBufferFile = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBufferFile);

    if (haveMultipleSheets) {
      const sheetsData: any[] = [];
      for (let i = 0; i < workbook.SheetNames.length; i++) {
        let worksheet = workbook.Sheets[workbook.SheetNames[i]];
        let workSheetJson = xlsx.utils.sheet_to_json(worksheet, {
          defval: "",
        }) as any[];

        if (workSheetJson.length === 0) {
          toast(`${file.name} doesn't contains on any data`);
        }

        sheetsData.push(workSheetJson);
      }

      return sheetsData;
    } else {
      let first_sheet_name = workbook.SheetNames[0];
      let worksheet = workbook.Sheets[first_sheet_name];
      let workSheetJson = xlsx.utils.sheet_to_json(worksheet, {
        defval: "",
      }) as any[];

      if (workSheetJson.length === 0) {
        toast(`${file.name} doesn't contains on any data`);
      }

      return workSheetJson;
    }
  } catch (error) {
    toast(`An error just happened when reading ${file.name} file`);
  }
}
