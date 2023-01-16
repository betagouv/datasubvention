import { capitalizeFirstLetter } from "./StringHelper";

export const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export const isDateNewer = (a: string | Date, b: string | Date) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (!dateA || !dateB) return false;
    const diff = dateA.getTime() - dateB.getTime();
    if (diff >= 0) return true;
    else return false;
};

export const frenchToEnglishMonthsMap = {
    JANVIER: "january",
    FEVRIER: "february",
    MARS: "march",
    AVRIL: "april",
    MAI: "may",
    JUIN: "june",
    JUILLET: "july",
    AOUT: "august",
    SEPTEMBRE: "september",
    OCTOBRE: "october",
    NOVEMBRE: "november",
    DECEMBRE: "december"
};

export const englishMonthNames = Object.values(frenchToEnglishMonthsMap).map(monthLowercase =>
    capitalizeFirstLetter(monthLowercase)
);

export function getMonthlyDataObject(dbData, index1Key, dataKey) {
    /*
    format object from [
        { index1Key: 1, dataKey: dataJanuary },
        ... ,
        { index1Key: 12, dataKey: dataDecember }
    ]
    to {
        January: dataJanuary,
        ... ,
        December: dataDecember,
    }
     */
    const resultByMonth0Index = {};
    let index1;
    for (const document of dbData) {
        index1 = document[index1Key];
        resultByMonth0Index[index1 - 1] = document[dataKey];
    }
    return englishMonthNames.reduce((acc, month, index) => {
        acc[month] = resultByMonth0Index[index] || 0;
        return acc;
    }, {});
}

export const getMonthFromFrenchStr = (month: string) => {
    return frenchToEnglishMonthsMap[month];
};

export const isValidDate = date => date instanceof Date && !isNaN(date as unknown as number);

export const dateToUTCMonthYear = date => new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));

export const firstDayOfPeriod = (year: number, month = 0) => new Date(Date.UTC(year, month, 1));
export const oneYearAfterPeriod = (year: number, month: number | undefined = undefined) => {
    if (month === undefined) return new Date(Date.UTC(year + 1, 0, 1));
    return new Date(Date.UTC(year, month + 1, 1));
};
