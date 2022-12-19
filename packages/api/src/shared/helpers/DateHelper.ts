import { capitalizeFirstLetter } from "./StringHelper";

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
    const resultByMonth0Index = {};
    let index1, value;
    for (const document of dbData) {
        index1 = document[index1Key];
        value = document[dataKey];
        resultByMonth0Index[index1 - 1] = value;
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
