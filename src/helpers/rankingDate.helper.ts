interface TimeType {
  object: any;
  hour: number;
  minute: number;
}

export function rankingItemsBasedOnDateStrings(
  listObjects: any[],
  propertyName: string,
  daysOfGpsReport: string[]
) {
  // console.log(daysOfGpsReport, listObjects);
  const finalList: any[] = [];
  daysOfGpsReport.forEach((day) => {
    const times: TimeType[] = [];
    listObjects.forEach((obj) => {
      const dayOfItem = obj[propertyName].split(" ")[0].split("-")[2];
      // const monthOfItem = obj[propertyName].split(" ")[0].split("-")[1];
      // const IsMonthIncluded = monthsOfGpsReport.find(monthOfItem);

      if (
        dayOfItem === day
        // && monthOfItem === IsMonthIncluded
      ) {
        const tempTime = obj[propertyName].split(" ")[1].split(":");
        times.push({
          object: obj,
          hour: Number.parseInt(tempTime[0]),
          minute: Number.parseInt(tempTime[1]),
        });
      }
    });

    if (times.length > 0) {
      const sortedTimesTemp = times.sort((x: TimeType, y: TimeType) => {
        if (x.hour < y.hour) {
          return -1;
        }
        if (x.hour > y.hour) {
          return 1;
        }

        if (x.hour === y.hour) {
          if (x.minute < y.minute) {
            return -1;
          }
          if (x.minute > y.minute) {
            return 1;
          }
        }

        return 0;
      });

      const originalListObjectForm = sortedTimesTemp.map((item) => item.object);
      originalListObjectForm.forEach((item) => finalList.push(item));
    }
  });

  return finalList;
}
